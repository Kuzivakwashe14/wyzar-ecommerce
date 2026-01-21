// backend/routes/order.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const verificationUploadOptimized = require('../middleware/verificationUploadOptimized'); // Reuse existing upload middleware
const platformPaymentDetails = require('../config/platformPaymentDetails');

// Import Prisma client
const prisma = require('../config/prisma');

// Import notification service
const {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  notifySellerOfOrder,
} = require('../services/notificationService');

// ===== Zod Validation =====
const { validateBody, validateParams } = require('../middleware/zodValidate');
const { orderSchema, objectIdParamSchema } = require('../schemas');

// ===== Rate Limiting =====
const { orderLimiter } = require('../config/security');

// Valid payment methods
const VALID_PAYMENT_METHODS = ['EcoCash', 'BankTransfer', 'CashOnDelivery'];

// --- 2. Create Order Route ---
// @route   POST /api/orders/create
// @desc    Create a new order with manual payment (EcoCash, Bank Transfer, or COD)
// @access  Private
router.post('/create', auth, orderLimiter, validateBody(orderSchema), async (req, res) => {
  try {
    const { shippingAddress, cartItems, paymentMethod = 'EcoCash' } = req.body;
    
    // Validate payment method
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ msg: 'Invalid payment method. Valid options: EcoCash, BankTransfer, CashOnDelivery' });
    }
    
    // Get the logged-in user
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // --- A. Create Order in our DB ---
    
    // 1. Get product IDs from the cart
    const productIds = cartItems.map(item => item.id || item._id);

    // 2. Fetch the *real* product data from our DB (Security!)
    const dbProducts = await prisma.product.findMany({ 
      where: { id: { in: productIds } } 
    });

    let totalPrice = 0;
    const orderItems = [];

    // 3. Loop and calculate total price
    for (const cartItem of cartItems) {
      const cartItemId = cartItem.id || cartItem._id;
      const dbProduct = dbProducts.find(p => p.id === cartItemId);
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

    // Map payment method to Prisma enum
    const paymentMethodMap = {
      'EcoCash': 'ECOCASH',
      'BankTransfer': 'BANK_TRANSFER',
      'CashOnDelivery': 'CASH_ON_DELIVERY'
    };

    // 4. Create new order instance
    const savedOrder = await prisma.order.create({
      data: {
        userId: req.user.id,
        shippingFullName: shippingAddress.fullName,
        shippingAddress: shippingAddress.address,
        shippingCity: shippingAddress.city,
        shippingPhone: shippingAddress.phone,
        paymentMethod: paymentMethodMap[paymentMethod],
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
    
    // Handle EcoCash and Bank Transfer - Orders are created as PENDING
    // Customer will make manual payment and seller will confirm
    res.json({
      orderId: savedOrder.id,
      message: 'Order placed successfully! Please follow the payment instructions.',
      redirectUrl: `/order/success?orderId=${savedOrder.id}`,
      paymentMethod: paymentMethod
    });

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
router.post('/:id/verify-payment', auth, validateParams(objectIdParamSchema), async (req, res) => {
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
router.post('/:id/confirm-payment', auth, validateParams(objectIdParamSchema), async (req, res) => {
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
router.get('/:id', auth, validateParams(objectIdParamSchema), async (req, res) => {
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

// --- 5.5 Get Order with Seller Payment Info ---
// @route   GET /api/orders/:id/payment-info
// @desc    Get order details with seller payment information for success page
// @access  Private
router.get('/:id/payment-info', auth, validateParams(objectIdParamSchema), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { 
        orderItems: {
          include: {
            product: {
              include: {
                seller: {
                  include: {
                    sellerDetails: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Security check: Make sure the user viewing the order is the one who made it
    if (order.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Return standardized Platform Payment Details
    // We strictly use the platform details instead of seller details
    const platformSellers = [{
      id: "PLATFORM",
      businessName: platformPaymentDetails.businessName,
      ecocashNumber: platformPaymentDetails.ecocash.number,
      ecocashName: platformPaymentDetails.ecocash.name,
      bankName: platformPaymentDetails.bank.bankName,
      bankAccountName: platformPaymentDetails.bank.accountName,
      bankAccountNumber: platformPaymentDetails.bank.accountNumber,
      whatsappNumber: platformPaymentDetails.contact.whatsapp,
      whatsappNumber2: null
    }];

    // Format response
    res.json({
      order: {
        id: order.id,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        paymentProof: order.paymentProof, // Include payment proof
        status: order.status,
        createdAt: order.createdAt,
        shippingFullName: order.shippingFullName,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingPhone: order.shippingPhone,
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        }))
      },
      sellers: platformSellers // Return platform details as the single "seller" for payment
    });
  } catch (err) {
    console.error('Get order payment info error:', err.message);
    return res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// --- 6. Update Order Status (For Sellers) ---
// @route   PUT /api/orders/:id/status
// @desc    Update order status (Shipped, Delivered, etc.)
// @access  Private (Seller only)
router.put('/:id/status', auth, validateParams(objectIdParamSchema), async (req, res) => {
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

// --- 9. Cancel Order (Buyer) ---
// @route   PUT /api/orders/:id/cancel
// @desc    Allow buyer to cancel their PENDING order
// @access  Private
router.put('/:id/cancel', auth, validateParams(objectIdParamSchema), async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { orderItems: true }
    });

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Security check
    if (order.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Allow cancelling PENDING or CONFIRMED (COD) orders
    // Cannot cancel PAID, SHIPPED, DELIVERED, or already CANCELLED
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ 
        msg: `Cannot cancel order with status ${order.status}. Please contact support.` 
      });
    }

    // If order was CONFIRMED (likely COD), we need to restock items
    if (order.paymentMethod === 'CASH_ON_DELIVERY' || order.status === 'CONFIRMED') {
      for (const item of order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } }
        });
      }
    }

    // Update status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });
    
    // Notify seller(s) about cancellation
    // (Optional: Implement notification logic here similar to create order)

    res.json({
      success: true,
      msg: 'Order cancelled successfully',
      order: updatedOrder
    });

  } catch (err) {
    console.error('Cancel order error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// --- 10. Update Payment Method (Buyer) ---
// @route   PUT /api/orders/:id/payment-method
// @desc    Allow buyer to change payment method for PENDING orders
// @access  Private
router.put('/:id/payment-method', auth, validateParams(objectIdParamSchema), async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    
    if (!['EcoCash', 'BankTransfer', 'CashOnDelivery'].includes(paymentMethod)) {
      return res.status(400).json({ msg: 'Invalid payment method' });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { orderItems: true }
    });

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (order.userId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // ONLY allow changing method if order is PENDING (for manual) or CONFIRMED (possibly for COD switch)
    // But safely, let's say only if it hasn't been PAID or PROCESSED.
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ msg: 'Cannot change payment method for this order status' });
    }
    
    // Map to Prisma Enum
    const paymentMethodMap = {
      'EcoCash': 'ECOCASH',
      'BankTransfer': 'BANK_TRANSFER',
      'CashOnDelivery': 'CASH_ON_DELIVERY'
    };
    const newPrismaMethod = paymentMethodMap[paymentMethod];
    
    // Check if Method is actually changing
    if (order.paymentMethod === newPrismaMethod) {
      return res.json({ msg: 'Payment method updated', order });
    }

    let newStatus = order.status;
    let newPaymentStatus = order.paymentStatus;
    
    // --- Stock Logic ---
    // Case 1: Switching TO COD (from Eco/Bank)
    // Needs to decrement stock, set status CONFIRMED
    if (newPrismaMethod === 'CASH_ON_DELIVERY' && order.paymentMethod !== 'CASH_ON_DELIVERY') {
      // Check stock first
      for (const item of order.orderItems) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product || product.quantity < item.quantity) {
           return res.status(400).json({ msg: `Cannot switch to COD. Not enough stock for ${item.name}.` });
        }
      }
      // Decrement stock
      for (const item of order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
      }
      newStatus = 'CONFIRMED';
      newPaymentStatus = 'Cash on Delivery - Payment pending';
    }
    
    // Case 2: Switching FROM COD (to Eco/Bank)
    // Needs to increment stock (release reservation), set status PENDING
    else if (order.paymentMethod === 'CASH_ON_DELIVERY' && newPrismaMethod !== 'CASH_ON_DELIVERY') {
      // Restock
       for (const item of order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } }
        });
      }
      newStatus = 'PENDING';
      newPaymentStatus = null; // Clear payment status
    }

    // Case 3: Switching between Eco and Bank
    // No stock change, Status remains PENDING

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        paymentMethod: newPrismaMethod,
        status: newStatus,
        paymentStatus: newPaymentStatus,
        paymentUpdateTime: new Date().toISOString()
      },
      include: { orderItems: true } // Include for response if needed
    });

    res.json({
      success: true,
      msg: 'Payment method updated successfully',
      order: updatedOrder
    });

  } catch (err) {
    console.error('Update payment method error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// --- 12. Admin Verify Payment ---
// @route   PUT /api/orders/:id/verify-payment
// @desc    Admin manually verifies payment and marks order as PAID
// @access  Private (Admin Only)
router.put('/:id/verify-payment', auth, async (req, res) => {
  try {
    // 1. Check Admin Role
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    // 2. Find Order
    const order = await prisma.order.findUnique({ 
      where: { id: req.params.id },
      include: { orderItems: true }
    });

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // 3. Check Status (Should be PENDING)
    if (order.status === 'PAID') {
       return res.status(400).json({ msg: 'Order is already marked as PAID.' });
    }

    // 4. Update Order Status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentStatus: 'Verified by Admin',
        paymentUpdateTime: new Date().toISOString()
      }
    });

    // 5. Decrement Stock (If not already validly done - assuming PENDING didn't decr)
    // NOTE: If original order created with 'CashOnDelivery', stock WAS decremented.
    // But this route is for manual payments (Eco/Bank) which started as PENDING and DID NOT decrement.
    // Double check: if paymentMethod was COD, status started as CONFIRMED.
    // If paymentMethod was Eco/Bank, status started as PENDING.
    // So if status was PENDING, we perform decrement now.
    
    if (order.status === 'PENDING') {
      for (const item of order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
      }
    }

    // 6. Notifications
    
    // Notify Buyer
    const buyer = await prisma.user.findUnique({ where: { id: order.userId } });
    if (buyer) {
      sendOrderStatusUpdate(updatedOrder, buyer, 'Paid').catch(console.error);
    }

    // Notify Seller(s) - Tell them to SHIP
    // We iterate items to find distinct sellers
    const sellerIds = [...new Set(order.orderItems.map(item => 
       // We'd need to fetch product->sellerId again or trust orderItem doesn't store sellerId directly?
       // OrderItem doesn't store sellerId. Product does.
       // We need to fetch products.
       // For efficiency, let's fetch products with sellers
       null
    ))]; 
    
    // Actually, let's just re-fetch items with products
    const itemsWithProduct = await prisma.orderItem.findMany({
       where: { orderId: order.id },
       include: { product: { include: { seller: true } } }
    });
    
    const uniqueSellers = {};
    itemsWithProduct.forEach(item => {
       if (item.product?.seller) {
         uniqueSellers[item.product.seller.id] = item.product.seller;
       }
    });
    
    Object.values(uniqueSellers).forEach(seller => {
       // Implement specific "Ship Now" notification if available, 
       // otherwise standard order notification or generic status update
       // For now, re-using order status update or creating custom notification service call
       // Assuming sendOrderStatusUpdate handles seller side? No, it's for buyer usually.
       // Using notifySellerOfOrder? That was for creation.
       // Ideally we need: notifySellerPaymentConfirmed(order, seller)
       // I'll skip specific implementation details of email logic and just log for now
       console.log(`[Notification] To Seller ${seller.email}: Payment confirmed for Order ${order.id}. Please ship.`);
    });


    res.json({
      success: true,
      msg: 'Payment verified and order marked as PAID.',
      order: updatedOrder
    });

  } catch (err) {
    console.error('Admin Verify Payment Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;

// --- 11. Upload Payment Proof ---
// @route   POST /api/orders/:id/proof
// @desc    Upload payment proof for an order
// @access  Private (Buyer)
router.post('/:id/proof', auth, (req, res) => {
  // Use the existing verification upload middleware which handles images/PDFs
  // and saves to 'uploads/verification' (we can treat proofs as verification docs)
  verificationUploadOptimized(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ msg: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "No document uploaded." });
    }

    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id }
      });

      if (!order) {
        // clean up file if order not found
        // fs.unlinkSync(req.file.path) // optional cleanup
        return res.status(404).json({ msg: 'Order not found' });
      }

      if (order.userId !== req.user.id) {
         return res.status(401).json({ msg: 'Not authorized' });
      }
      
      // Update order with proof path
      const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: {
          paymentProof: req.file.path,
          status: 'PENDING' // Keep as pending until seller verifies
        }
      });

      res.json({
        success: true,
        msg: 'Payment proof uploaded successfully',
        order: updatedOrder
      });

    } catch (dbErr) {
      console.error("Upload proof error:", dbErr);
      res.status(500).json({ msg: "Server Error", error: dbErr.message });
    }
  });
});

