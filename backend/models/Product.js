// In backend/models/Product.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  // Link to the seller (User model)
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User', // This links it to our User model
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  images: [
    {
      type: String, // We will store file paths to the images
      required: true
    }
  ],
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  // As per your MVP doc [cite: 39]
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  quantity: { // This is the 'stock availability' [cite: 39]
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1
  },
  // As per your 'full' features doc [cite: 2]
  deliveryTime: {
    type: String,
    trim: true
  },
  countryOfOrigin: {
    type: String,
    trim: true
  },
  location: {
    city: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'Zimbabwe',
      trim: true
    }
  },
  condition: {
    type: String,
    enum: ['new', 'used', 'refurbished'],
    default: 'new'
  },
  brand: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  // We can add ratings later
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create text index for search
ProductSchema.index({ 
  name: 'text', 
  description: 'text', 
  category: 'text',
  brand: 'text',
  tags: 'text'
});

// Create indexes for common queries
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ seller: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ 'location.city': 1 });
ProductSchema.index({ featured: -1, createdAt: -1 });

// Virtual for checking if in stock
ProductSchema.virtual('inStock').get(function() {
  return this.quantity > 0;
});

module.exports = mongoose.model('Product', ProductSchema);