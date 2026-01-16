// backend/routes/order.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Paynow } = require('paynow');

// Import our models
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

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
    const user = await User.findById(req.user.id);

    // --- A. Create Order in our DB ---
    
    // 1. Get product IDs from the cart
    const productIds = cartItems.map(item => item._id);

    // 2. Fetch the *real* product data from our DB (Security!)
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    let totalPrice = 0;
    const orderItems = [];

    // 3. Loop and calculate total price
    for (const cartItem of cartItems) {
      const dbProduct = dbProducts.find(p => p._id.toString() === cartItem._id);
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
        product: dbProduct._id,
      });
    }

    // 4. Create new order instance
    const newOrder = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      status: paymentMethod === 'CashOnDelivery' ? 'Confirmed' : 'Pending', // COD orders are confirmed immediately
    });

    // 5. Save the pending order
    const savedOrder = await newOrder.save();
    
    // 6. Send order confirmation notifications (Email + SMS) - Don't block the response
    sendOrderConfirmation(savedOrder, user).catch(err => {
      console.error('Error sending order confirmation:', err);
    });

    // 7. Notify sellers of new orders - Group items by seller
    const sellerOrders = {};
    for (const item of orderItems) {
      const product = await Product.findById(item.product).populate('seller');
      if (product && product.seller) {
        if (!sellerOrders[product.seller._id]) {
          sellerOrders[product.seller._id] = {
            seller: product.seller,
            items: []
          };
        }
        sellerOrders[product.seller._id].items.push(item);
      }
    }

    // Send notification to each seller
    for (const sellerId in sellerOrders) {
      const { seller, items } = sellerOrders[sellerId];
      const sellerOrderDetails = {
        ...savedOrder.toObject(),
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
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity }
        });
      }

      savedOrder.paymentResult = {
        id: 'COD_' + Date.now(),
        status: 'Cash on Delivery - Payment pending',
        update_time: new Date().toISOString(),
      };
      await savedOrder.save();

      return res.json({
        orderId: savedOrder._id,
        message: 'Order placed successfully! Pay with cash upon delivery.',
        redirectUrl: `/order/success?orderId=${savedOrder._id}`,
        paymentMethod: 'CashOnDelivery'
      });
    }
    
    // Handle Paynow payment
    if (isPaynowConfigured) {
      // Use test email in development, or user's email in production
      const paymentEmail = process.env.NODE_ENV === 'production' 
        ? user.email 
        : (process.env.PAYNOW_TEST_EMAIL || 'kuzivakwashekubiku@gmail.com');
      
      // Production: Use Paynow payment gateway
      // 1. Create a new payment
      const payment = paynow.createPayment(savedOrder._id.toString(), paymentEmail);

      // 2. Add total as a single item
      payment.add("WyZar Order", savedOrder.totalPrice);

      // 3. Send the payment to Paynow
      const response = await paynow.send(payment);

      if (response.success) {
        // 4. Send back the redirect URL to the frontend
        res.json({
          orderId: savedOrder._id,
          paynowRedirectUrl: response.redirectUrl,
        });
      } else {
        console.error("Paynow error:", response.error);
        return res.status(500).json({ msg: "Paynow initiation failed", error: response.error });
      }
    } else {
      // Development mode: Auto-approve the order and update stock
      savedOrder.status = 'Paid';
      savedOrder.paidAt = new Date();
      savedOrder.paymentResult = {
        id: 'DEV_' + Date.now(),
        status: 'Development Mode - Auto Approved',
        update_time: new Date().toISOString(),
      };

      // Update product stock
      for (const item of savedOrder.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity }
        });
      }

      await savedOrder.save();

      // Return success without payment URL
      res.json({
        orderId: savedOrder._id,
        message: 'Order created successfully (Development mode - payment skipped)',
        redirectUrl: `/order/success?orderId=${savedOrder._id}`,
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
    const order = await Order.findById(statusUpdate.reference);

    if (!order) {
      console.error(`Order not found: ${statusUpdate.reference}`);
      // Respond to Paynow
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    // Only update if it's still Pending
    if (order.status !== 'Pending') {
      console.log(`Order ${order._id} already processed. Status: ${order.status}`);
      return res.status(200).json({ msg: 'Order already processed' });
    }

    // 3. Verify the payment status
    // 'Paid' or 'Awaiting Delivery' are common success statuses
    const successfulStatus = ['Paid', 'Awaiting Delivery', 'Delivered'];

    if (successfulStatus.includes(statusUpdate.status)) {
      // 4. Update the order in your database
      order.status = 'Paid';
      order.paidAt = new Date();
      order.paymentResult = {
        id: statusUpdate.paynowreference,
        status: statusUpdate.status,
        update_time: new Date().toISOString(),
      };
      
      // --- IMPORTANT: Update Product Stock ---
      // We must decrease the quantity of products sold
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity } // Decrement quantity
        });
      }

      await order.save();
      console.log(`Order ${order._id} marked as Paid.`);
      
      // Send payment confirmation notification
      const user = await User.findById(order.user);
      if (user) {
        sendOrderStatusUpdate(order, user, 'Paid').catch(err => {
          console.error('Error sending payment confirmation:', err);
        });
      }
      
    } else {
      console.log(`Order ${order._id} status: ${statusUpdate.status}`);
      // Handle 'Cancelled' or 'Failed' statuses
      order.status = 'Cancelled';
      await order.save();
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
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    // Check if user is a seller
    const user = await User.findById(req.user.id);
    if (!user.isSeller) {
      return res.status(403).json({ success: false, msg: 'Only sellers can verify payments' });
    }

    // Only verify pending orders
    if (order.status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        msg: `Order is already ${order.status}. No verification needed.` 
      });
    }

    // If Paynow is configured, try to poll for status
    if (paynow && order.paymentResult?.pollUrl) {
      try {
        const status = await paynow.pollTransaction(order.paymentResult.pollUrl);
        
        if (status.paid) {
          order.status = 'Paid';
          order.paidAt = new Date();
          order.paymentResult.status = 'Paid (Verified)';
          order.paymentResult.update_time = new Date().toISOString();

          // Update stock
          for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { quantity: -item.quantity }
            });
          }

          await order.save();
          
          return res.json({
            success: true,
            msg: 'Payment verified successfully! Order marked as Paid.',
            order: { _id: order._id, status: order.status }
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
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    // Check if user is a seller
    const user = await User.findById(req.user.id);
    if (!user.isSeller) {
      return res.status(403).json({ success: false, msg: 'Only sellers can confirm payments' });
    }

    // Only confirm pending orders
    if (order.status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        msg: `Order is already ${order.status}. Cannot confirm payment.` 
      });
    }

    // Mark as paid
    order.status = 'Paid';
    order.paidAt = new Date();
    order.paymentResult = {
      id: 'MANUAL_' + Date.now(),
      status: 'Manually Confirmed by Seller',
      update_time: new Date().toISOString(),
    };

    // Update stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity }
      });
    }

    await order.save();

    // Notify buyer
    const buyer = await User.findById(order.user);
    if (buyer) {
      sendOrderStatusUpdate(order, buyer, 'Paid').catch(err => {
        console.error('Error sending payment confirmation:', err);
      });
    }

    res.json({
      success: true,
      msg: 'Payment confirmed! Order marked as Paid.',
      order: { _id: order._id, status: order.status }
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
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
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
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    // Security check: Make sure the user viewing the order is the one who made it
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Order not found' });
    }
    res.status(500).send('Server Error');
  }
});

// --- 6. Update Order Status (For Sellers) ---
// @route   PUT /api/orders/:id/status
// @desc    Update order status (Shipped, Delivered, etc.)
// @access  Private (Seller only)
router.put('/:id/status', auth, validateObjectIdParam('id'), async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Confirmed', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid status. Must be: Pending, Confirmed, Paid, Shipped, Delivered, or Cancelled' 
      });
    }

    // Find the order
    const order = await Order.findById(req.params.id).populate('user');
    if (!order) {
      return res.status(404).json({ 
        success: false,
        msg: 'Order not found' 
      });
    }

    // Check if user is seller of at least one product in the order
    const user = await User.findById(req.user.id);
    if (!user.isSeller) {
      return res.status(403).json({ 
        success: false,
        msg: 'Only sellers can update order status' 
      });
    }

    // Verify seller owns at least one product in this order
    const orderProductIds = order.orderItems.map(item => {
      // Handle both ObjectId and string formats
      return item.product?.toString ? item.product.toString() : item.product;
    });
    
    const sellerProducts = await Product.find({ 
      seller: req.user.id,
      _id: { $in: orderProductIds }
    });

    if (sellerProducts.length === 0) {
      return res.status(403).json({ 
        success: false,
        msg: 'You can only update orders containing your products' 
      });
    }

    // Get seller's product IDs for filtering
    const sellerProductIds = sellerProducts.map(p => p._id.toString());
    
    // Filter order items to only include seller's products
    const sellerOrderItems = order.orderItems.filter(item => {
      const itemProductId = item.product?.toString ? item.product.toString() : item.product;
      return sellerProductIds.includes(itemProductId);
    });

    // Check if all items in the order belong to this seller
    // If not, we should only update status for seller's items (but current schema doesn't support per-item status)
    // For now, we'll allow status update if seller has at least one item
    // Note: This means status update affects the entire order, which may include other sellers' items
    // This is a limitation of the current schema design

    // Validate status transitions
    const oldStatus = order.status;
    const validTransitions = {
      'Pending': ['Paid', 'Cancelled'],
      'Confirmed': ['Shipped', 'Paid', 'Cancelled'], // COD orders: can be marked Paid anytime
      'Paid': ['Shipped', 'Cancelled'],
      'Shipped': ['Delivered', 'Paid'], // COD orders can be marked as Paid after shipping
      'Delivered': ['Paid'], // COD orders can be marked as Paid after delivery
      'Cancelled': [] // Cannot transition from Cancelled
    };

    if (!validTransitions[oldStatus]?.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: `Cannot change order status from ${oldStatus} to ${status}. Valid transitions: ${validTransitions[oldStatus]?.join(', ') || 'none'}`
      });
    }

    // Update order status
    order.status = status;

    // Add tracking number if provided
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    // Set timestamps based on status
    if (status === 'Shipped' && !order.shippedAt) {
      order.shippedAt = new Date();
    }
    if (status === 'Delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Send status update notification to buyer
    sendOrderStatusUpdate(order, order.user, status).catch(err => {
      console.error('Error sending status update notification:', err);
    });

    res.json({
      success: true,
      msg: `Order status updated from ${oldStatus} to ${status}`,
      order: {
        id: order._id,
        status: order.status,
        trackingNumber: order.trackingNumber,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt
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
    const user = await User.findById(req.user.id);
    if (!user.isSeller) {
      return res.status(403).json({ 
        success: false,
        msg: 'Only sellers can access this route' 
      });
    }

    // Find all products by this seller
    const sellerProducts = await Product.find({ seller: req.user.id });
    const productIds = sellerProducts.map(p => p._id.toString());

    if (productIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        orders: []
      });
    }

    // Find orders containing these products
    const orders = await Order.find({
      'orderItems.product': { $in: productIds }
    })
    .populate('user', 'email phone')
    .sort({ createdAt: -1 });

    // Filter order items to show only seller's products and calculate seller's total
    const filteredOrders = orders.map(order => {
      const orderObj = order.toObject();
      const sellerItems = orderObj.orderItems.filter(item => {
        const itemProductId = item.product?.toString() || item.product;
        return productIds.includes(itemProductId);
      });
      
      // Calculate total price for seller's items only
      const sellerTotalPrice = sellerItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      return {
        ...orderObj,
        orderItems: sellerItems,
        sellerTotalPrice: sellerTotalPrice // Add seller's portion of the order
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
    const user = await User.findById(req.user.id);
    if (!user.isSeller) {
      return res.status(403).json({ 
        success: false,
        msg: 'Only sellers can access this route' 
      });
    }

    // Find all products by this seller
    const sellerProducts = await Product.find({ seller: req.user.id });
    const productIds = sellerProducts.map(p => p._id.toString());

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
    const allOrders = await Order.find({
      'orderItems.product': { $in: productIds }
    });

    // Calculate total earnings from "Paid" orders only
    // (As per requirement: sum of money from seller's products in "Paid" orders)
    let totalEarnings = 0;
    
    for (const order of allOrders) {
      if (order.status === 'Paid') {
        // Calculate seller's portion of this order
        const sellerItems = order.orderItems.filter(item => {
          const itemProductId = item.product?.toString ? item.product.toString() : item.product;
          return productIds.includes(itemProductId);
        });
        
        const sellerRevenue = sellerItems.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
        
        totalEarnings += sellerRevenue;
      }
    }

    // Count total unique orders containing seller's products
    const totalOrders = allOrders.length;

    // Count pending orders (status: "Pending" or "Paid" - waiting to be shipped)
    const pendingOrders = allOrders.filter(order => 
      order.status === 'Pending' || order.status === 'Paid'
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