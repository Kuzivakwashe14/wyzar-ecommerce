// backend/models/OTP.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OTPSchema = new Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['registration', 'login', 'password-reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    // OTP will expire in 10 minutes
    default: () => new Date(Date.now() + 10 * 60 * 1000)
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 attempts to prevent brute force
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Automatically delete OTP documents after 1 hour
    expires: 3600
  }
});

// Index for faster queries
OTPSchema.index({ phone: 1, type: 1, createdAt: -1 });

// Method to check if OTP is expired
OTPSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

// Method to increment attempts
OTPSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  return await this.save();
};

module.exports = mongoose.model('OTP', OTPSchema);