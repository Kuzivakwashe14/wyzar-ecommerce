// backend/routes/order.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Paynow } = require('paynow');

// Import Prisma client
const prisma = require('../config/prisma');

// Import notification service
const {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  notifySellerOfOrder,
} = require('../services/notificationService');

// ===== Input Validation =====
const { validateOrderCreation, validateObjectIdParam } = require('../middleware/validateInput');

// --- 1. Initialize Paynow ---
// Check if Paynow is configured (for production) or if we're in development mode
const isPaynowConfigured =
  process.env.PAYNOW_INTEGRATION_ID &&
  process.env.PAYNOW_INTEGRATION_ID !== 'your_id' &&
  process.env.PAYNOW_INTEGRATION_KEY &&
  process.env.PAYNOW_INTEGRATION_KEY !== 'your_key';

let paynow;
if (isPaynowConfigured) {
  paynow = new Paynow(
    process.env.PAYNOW_INTEGRATION_ID,
    process.env.PAYNOW_INTEGRATION_KEY
  );
  // Set the return and result URLs
  paynow.returnUrl = process.env.PAYNOW_RETURN_URL;
  paynow.resultUrl = process.env.PAYNOW_RESULT_URL;
  console.log('✅ Paynow payment integration enabled');
} else {
  console.log('⚠️ Paynow not configured - running in DEVELOPMENT mode (orders will be auto-approved)');
}

// --- 2. Create Order & Initiate Payment Route ---
// @route   POST /api/orders/create
// @desc    Create a new order and get Paynow redirect URL
// @access  Private
router.post('/create', auth, validateOrderCreation, async (req, res) => {
  try {
    const { shippingAddress, cartItems, paymentMethod = 'Paynow' } = req.body;
    
    // Validate payment method
    const validPaymentMethods = ['Paynow', 'CashOnDelivery'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ msg: 'Invalid payment method' });
    }
    
    // Get the logged-in user
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // --- A. Create Order in our DB ---
    
    // 1. Get product IDs from the cart
    const productIds = cartItems.map(item => item._id);

    // 2. Fetch the *real* product data from our DB (Security!)
    const dbProducts = await prisma.product.findMany({ 
      where: { id: { in: productIds } } 
    });

    let totalPrice = 0;
    const orderItems = [];

    // 3. Loop and calculate total price
    for (const cartItem of cartItems) {
      const dbProduct = dbProducts.find(p => p.id === cartItem._id);
      if (!dbProduct) {
        return res.status(404).json({ msg: `Product ${cartItem.name} not found` });
      }
      if (cartItem.cartQuantity > dbProduct.quantity) {
        return res.status(400).json({ msg: `Not enough stock for ${dbProduct.name}` });
      }

      const itemPrice = dbProduct.price * cartItem.cartQuantity;
      totalPrice += itemPrice;

      orderItems.push({
        name: dbProduct.name,
        quantity: cartItem.cartQuantity,
        image: dbProduct.images[0], // Save first image
        price: dbProduct.price,
        productId: dbProduct.id,
      });
    }

    // 4. Create new order instance
    const savedOrder = await prisma.order.create({
      data: {
        userId: req.user.id,
        shippingFullName: shippingAddress.fullName,
        shippingAddress: shippingAddress.address,
        shippingCity: shippingAddress.city,
        shippingPhone: shippingAddress.phone,
        paymentMethod: paymentMethod === 'CashOnDelivery' ? 'CASH_ON_DELIVERY' : 'PAYNOW',
        totalPrice,
        status: paymentMethod === 'CashOnDelivery' ? 'CONFIRMED' : 'PENDING',
        orderItems: {
          createMany: {
            data: orderItems
          }
        }
      },
      include: {
        orderItems: true
      }
    });
    
    // 6. Send order confirmation notifications (Email + SMS) - Don't block the response
    sendOrderConfirmation(savedOrder, user).catch(err => {
      console.error('Error sending order confirmation:', err);
    });

    // 7. Notify sellers of new orders - Group items by seller
    const sellerOrders = {};
    for (const item of savedOrder.orderItems) {
      const product = await prisma.product.findUnique({ 
        where: { id: item.productId },
        include: { seller: true }
      });
      if (product && product.seller) {
        if (!sellerOrders[product.seller.id]) {
          sellerOrders[product.seller.id] = {
            seller: product.seller,
            items: []
          };
        }
        sellerOrders[product.seller.id].items.push(item);
      }
    }

    // Send notification to each seller
    for (const sellerId in sellerOrders) {
      const { seller, items } = sellerOrders[sellerId];
      const sellerOrderDetails = {
        ...savedOrder,
        orderItems: items
      };
      notifySellerOfOrder(sellerOrderDetails, seller).catch(err => {
        console.error(`Error notifying seller ${sellerId}:`, err);
      });
    }

    // --- B. Handle Payment ---
    
    // Handle Cash on Delivery orders
    if (paymentMethod === 'CashOnDelivery') {
      // Update product stock immediately for COD orders
      for (const item of savedOrder.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      await prisma.order.update({
        where: { id: savedOrder.id },
        data: {
          paymentResultId: 'COD_' + Date.now(),
          paymentStatus: 'Cash on Delivery - Payment pending',
          paymentUpdateTime: new Date().toISOString()
        }
      });

      return res.json({
        orderId: savedOrder.id,
        message: 'Order placed successfully! Pay with cash upon delivery.',
        redirectUrl: `/order/success?orderId=${savedOrder.id}`,
        paymentMethod: 'CashOnDelivery'
      });
    }
    
    // Handle Paynow payment
    if (isPaynowConfigured) {
      // Production: Use Paynow payment gateway
      // 1. Create a new payment
      const payment = paynow.createPayment(savedOrder.id, user.email);

      // 2. Add total as a single item
      payment.add("WyZar Order", savedOrder.totalPrice);

      // 3. Send the payment to Paynow
      const response = await paynow.send(payment);

      if (response.success) {
        // 4. Send back the redirect URL to the frontend
        res.json({
          orderId: savedOrder.id,
          paynowRedirectUrl: response.redirectUrl,
        });
      } else {
        console.error("Paynow error:", response.error);
        return res.status(500).json({ msg: "Paynow initiation failed", error: response.error });
      }
    } else {
      // Development mode: Auto-approve the order and update stock
      const updatedOrder = await prisma.order.update({
        where: { id: savedOrder.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentResultId: 'DEV_' + Date.now(),
          paymentStatus: 'Development Mode - Auto Approved',
          paymentUpdateTime: new Date().toISOString()
        }
      });

      // Update product stock
      for (const item of savedOrder.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      // Return success without payment URL
      res.json({
        orderId: savedOrder.id,
        message: 'Order created successfully (Development mode - payment skipped)',
        redirectUrl: `/order/success?orderId=${savedOrder.id}`,
      });
    }

  } catch (err) {
    console.error("Create Order Error:", err.message);
    res.status(500).send('Server Error');
  }
});


// --- 3. Paynow Callback/Result Route ---
// @route   POST /api/orders/paynow/callback
// @desc    Paynow sends payment status updates here
// @access  Public (from Paynow)
router.post('/paynow/callback', async (req, res) => {
  try {
    const statusUpdate = req.body;

    // 1. Log the update from Paynow (for debugging)
    console.log("Paynow Callback Received:", statusUpdate);

    // 2. Find the order in your database
    // The 'reference' is the Order ID we sent to Paynow
    const order = await prisma.order.findUnique({ where: { id: statusUpdate.reference } });

    if (!order) {
      console.error(`Order not found: ${statusUpdate.reference}`);
      // Respond to Paynow
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    // Only update if it's still Pending
    if (order.status !== 'PENDING') {
      console.log(`Order ${order.id} already processed. Status: ${order.status}`);
      return res.status(200).json({ msg: 'Order already processed' });
    }

    // 3. Verify the payment status
    // 'Paid' or 'Awaiting Delivery' are common success statuses
    const successfulStatus = ['Paid', 'Awaiting Delivery', 'Delivered'];

    if (successfulStatus.includes(statusUpdate.status)) {
      // 4. Update the order in your database
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentResultId: statusUpdate.paynowreference,
          paymentStatus: statusUpdate.status,
          paymentUpdateTime: new Date().toISOString()
        }
      });
      
      // --- IMPORTANT: Update Product Stock ---
      // We must decrease the quantity of products sold
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id }
      });
      
      for (const item of orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      console.log(`Order ${order.id} marked as Paid.`);
      
      // Send payment confirmation notification
      const user = await prisma.user.findUnique({ where: { id: order.userId } });
      if (user) {
        const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
        sendOrderStatusUpdate(updatedOrder, user, 'Paid').catch(err => {
          console.error('Error sending payment confirmation:', err);
        });
      }
      
    } else {
      console.log(`Order ${order.id} status: ${statusUpdate.status}`);
      // Handle 'Cancelled' or 'Failed' statuses
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' }
      });
    }

    // 5. Respond to Paynow to acknowledge receipt
    res.status(200).json({ msg: 'Callback received' });

  } catch (err) {
    console.error("Callback Error:", err.message);
    res.status(500).send('Server Error');
  }
});


// --- 3.5 Manual Payment Verification Route ---
// @route   POST /api/orders/:id/verify-payment
// @desc    Manually verify payment status with Paynow (for when callbacks fail)
// @access  Private (Seller only)
router.post('/:id/verify-payment', auth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    // Check if user is a seller
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.isSeller) {
      return res.status(403).json({ success: false, msg: 'Only sellers can verify payments' });
    }

    // Only verify pending orders
    if (order.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false, 
        msg: `Order is already ${order.status}. No verification needed.` 
      });
    }

    // If Paynow is configured, try to poll for status
    if (paynow && order.paymentResultId) {
      try {
        const status = await paynow.pollTransaction(order.paymentResultId);
        
        if (status.paid) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'PAID',
              paidAt: new Date(),
              paymentStatus: 'Paid (Verified)',
              paymentUpdateTime: new Date().toISOString()
            }
          });

          // Update stock
          const orderItems = await prisma.orderItem.findMany({
            where: { orderId: order.id }
          });
          for (const item of orderItems) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } }
            });
          }
          
          return res.json({
            success: true,
            msg: 'Payment verified successfully! Order marked as Paid.',
            order: { id: order.id, status: 'PAID' }
          });
        } else {
          return res.json({
            success: false,
            msg: 'Payment not yet completed on Paynow.',
            paynowStatus: status
          });
        }
      } catch (pollError) {
        console.error('Paynow poll error:', pollError);
        // Fall through to manual confirmation option
      }
    }

    // If we can't verify automatically, allow manual confirmation
    return res.json({
      success: false,
      msg: 'Unable to verify payment automatically. Use "Confirm Payment" to manually mark as paid if you have confirmed payment was received.',
      allowManualConfirmation: true
    });

  } catch (err) {
    console.error('Verify payment error:', err.message);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
});


// --- 3.6 Manual Payment Confirmation Route ---
// @route   POST /api/orders/:id/confirm-payment
// @desc    Manually confirm payment was received (for when Paynow callbacks fail)
// @access  Private (Seller only)
router.post('/:id/confirm-payment', auth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ 
      where: { id: req.params.id },
      include: { orderItems: true }
    });
    
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    // Check if user is a seller
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.isSeller) {
      return res.status(403).json({ success: false, msg: 'Only sellers can confirm payments' });
    }

    // Only confirm pending orders
    if (order.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false, 
        msg: `Order is already ${order.status}. Cannot confirm payment.` 
      });
    }

    // Mark as paid
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentResultId: 'MANUAL_' + Date.now(),
        paymentStatus: 'Manually Confirmed by Seller',
        paymentUpdateTime: new Date().toISOString()
      }
    });

    // Update stock
    for (const item of order.orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } }
      });
    }

    // Notify buyer
    const buyer = await prisma.user.findUnique({ where: { id: order.userId } });
    if (buyer) {
      const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      sendOrderStatusUpdate(updatedOrder, buyer, 'Paid').catch(err => {
        console.error('Error sending payment confirmation:', err);
      });
    }

    res.json({
      success: true,
      msg: 'Payment confirmed! Order marked as Paid.',
      order: { id: order.id, status: 'PAID' }
    });

  } catch (err) {
    console.error('Confirm payment error:', err.message);
    res.status(500).json({ success: false, msg: 'Server Error', error: err.message });
  }
});


// --- 4. Get Logged-in User's Orders ---
// @route   GET /api/orders/myorders
// @desc    Get all orders for the logged-in user
// @access  Private
router.get('/myorders', auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { orderItems: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- 5. Get Single Order by ID ---
// @route   GET /api/orders/:id
// @desc    Get a single order by its ID
// @access  Private
router.get('/:id', auth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { orderItems: true }
    });

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Security check: Make sure the user viewing the order is the one who made it
    if (order.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    return res.status(404).json({ msg: 'Order not found' });
  }
});

// --- 6. Update Order Status (For Sellers) ---
// @route   PUT /api/orders/:id/status
// @desc    Update order status (Shipped, Delivered, etc.)
// @access  Private (Seller only)
router.put('/:id/status', auth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    // Validate status and map to Prisma enum
    const statusMap = {
      'Pending': 'PENDING',
      'Confirmed': 'CONFIRMED',
      'Paid': 'PAID',
      'Shipped': 'SHIPPED',
      'Delivered': 'DELIVERED',
      'Cancelled': 'CANCELLED'
    };
    
    if (!statusMap[status]) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid status. Must be: Pending, Confirmed, Paid, Shipped, Delivered, or Cancelled' 
      });
    }
    
    const prismaStatus = statusMap[status];

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { 
        orderItems: true,
        user: true 
      }
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        msg: 'Order not found' 
      });
    }

    // Check if user is seller of at least one product in the order
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.isSeller) {
      return res.status(403).json({ 
        success: false,
        msg: 'Only sellers can update order status' 
      });
    }

    // Verify seller owns at least one product in this order
    const orderProductIds = order.orderItems.map(item => item.productId);
    
    const sellerProducts = await prisma.product.findMany({ 
      where: {
        sellerId: req.user.id,
        id: { in: orderProductIds }
      }
    });

    if (sellerProducts.length === 0) {
      return res.status(403).json({ 
        success: false,
        msg: 'You can only update orders containing your products' 
      });
    }

    // Validate status transitions
    const oldStatus = order.status;
    const validTransitions = {
      'PENDING': ['PAID', 'CANCELLED'],
      'CONFIRMED': ['SHIPPED', 'PAID', 'CANCELLED'],
      'PAID': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED', 'PAID'],
      'DELIVERED': ['PAID'],
      'CANCELLED': []
    };

    if (!validTransitions[oldStatus]?.includes(prismaStatus)) {
      return res.status(400).json({
        success: false,
        msg: `Cannot change order status from ${oldStatus} to ${prismaStatus}.`
      });
    }

    // Build update data
    const updateData = { status: prismaStatus };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (prismaStatus === 'SHIPPED' && !order.shippedAt) updateData.shippedAt = new Date();
    if (prismaStatus === 'DELIVERED' && !order.deliveredAt) updateData.deliveredAt = new Date();

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Send status update notification to buyer
    sendOrderStatusUpdate(updatedOrder, order.user, status).catch(err => {
      console.error('Error sending status update notification:', err);
    });

    res.json({
      success: true,
      msg: `Order status updated from ${oldStatus} to ${prismaStatus}`,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        shippedAt: updatedOrder.shippedAt,
        deliveredAt: updatedOrder.deliveredAt
      }
    });

  } catch (err) {
    console.error('Update order status error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server Error',
      error: err.message 
    });
  }
});

// --- 7. Get Seller's Orders ---
// @route   GET /api/orders/seller/orders
// @desc    Get all orders containing seller's products
// @access  Private (Seller only)
router.get('/seller/orders', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.isSeller) {
      return res.status(403).json({ 
        success: false,
        msg: 'Only sellers can access this route' 
      });
    }

    // Find all products by this seller
    const sellerProducts = await prisma.product.findMany({ 
      where: { sellerId: req.user.id } 
    });
    const productIds = sellerProducts.map(p => p.id);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        orders: []
      });
    }

    // Find orders containing these products
    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            productId: { in: productIds }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true
          }
        },
        orderItems: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter order items to show only seller's products and calculate seller's total
    const filteredOrders = orders.map(order => {
      const sellerItems = order.orderItems.filter(item => 
        productIds.includes(item.productId)
      );
      
      // Calculate total price for seller's items only
      const sellerTotalPrice = sellerItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      return {
        ...order,
        orderItems: sellerItems,
        sellerTotalPrice: sellerTotalPrice
      };
    });

    res.json({
      success: true,
      count: filteredOrders.length,
      orders: filteredOrders
    });

  } catch (err) {
    console.error('Get seller orders error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server Error',
      error: err.message 
    });
  }
});

// --- 8. Get Seller Earnings/Stats ---
// @route   GET /api/orders/seller/stats
// @desc    Get seller earnings and order statistics
// @access  Private (Seller only)
router.get('/seller/stats', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.isSeller) {
      return res.status(403).json({ 
        success: false,
        msg: 'Only sellers can access this route' 
      });
    }

    // Find all products by this seller
    const sellerProducts = await prisma.product.findMany({ 
      where: { sellerId: req.user.id } 
    });
    const productIds = sellerProducts.map(p => p.id);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalEarnings: 0,
          totalOrders: 0,
          pendingOrders: 0
        }
      });
    }

    // Find all orders containing seller's products
    const allOrders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            productId: { in: productIds }
          }
        }
      },
      include: {
        orderItems: true
      }
    });

    // Calculate total earnings from "PAID" orders only
    let totalEarnings = 0;
    
    for (const order of allOrders) {
      if (order.status === 'PAID') {
        // Calculate seller's portion of this order
        const sellerItems = order.orderItems.filter(item => 
          productIds.includes(item.productId)
        );
        
        const sellerRevenue = sellerItems.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
        
        totalEarnings += sellerRevenue;
      }
    }

    // Count total unique orders containing seller's products
    const totalOrders = allOrders.length;

    // Count pending orders (status: "PENDING" or "PAID" - waiting to be shipped)
    const pendingOrders = allOrders.filter(order => 
      order.status === 'PENDING' || order.status === 'PAID'
    ).length;

    res.json({
      success: true,
      stats: {
        totalEarnings: totalEarnings,
        totalOrders,
        pendingOrders
      }
    });

  } catch (err) {
    console.error('Get seller stats error:', err.message);
    res.status(500).json({ 
      success: false,
      msg: 'Server Error',
      error: err.message 
    });
  }
});

module.exports = router;