// In backend/models/Order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const encryptedFieldsPlugin = require('../utils/encryptedField');

// This is a sub-document schema for items *within* an order
const OrderItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true }, // Store the primary image path
  price: { type: Number, required: true },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
});

const OrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [OrderItemSchema], // An array of items
    shippingAddress: {
      fullName: { type: String, required: true, encrypted: true },
      address: { type: String, required: true, encrypted: true },
      city: { type: String, required: true },
      phone: { type: String, required: true, encrypted: true },
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Paynow', // From your MVP
    },
    paymentResult: {
      // This will be filled by Paynow's response
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    paidAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    trackingNumber: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Apply encrypted fields plugin to automatically encrypt/decrypt sensitive data
OrderSchema.plugin(encryptedFieldsPlugin);

module.exports = mongoose.model('Order', OrderSchema);