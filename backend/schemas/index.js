// backend/schemas/index.js
// Zod validation schemas for all API endpoints

const { z } = require('zod');

// =============================================================================
// CUSTOM VALIDATORS
// =============================================================================

/**
 * Zimbabwe phone number format
 * Accepts: 0771234567 or +263771234567
 */
const phoneRegex = /^(\+263|0)[0-9]{9}$/;

/**
 * UUID v4 format
 */
const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// =============================================================================
// BASE SCHEMAS (Reusable)
// =============================================================================

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .email('Invalid email format')
  .max(255, 'Email is too long')
  .transform((val) => val.toLowerCase().trim());

const phoneSchema = z
  .string({ required_error: 'Phone number is required' })
  .regex(phoneRegex, 'Invalid phone number. Use format: 0771234567 or +263771234567')
  .transform((val) => val.replace(/[\s\-()]/g, ''));

const uuidSchema = z
  .string({ required_error: 'ID is required' })
  .regex(uuidRegex, 'Invalid ID format');

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

const sanitizedString = (maxLength = 1000) =>
  z.string().max(maxLength).transform((val) => val.trim());

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
});

const loginSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  password: passwordSchema,
}).refine((data) => data.email || data.phone, {
  message: 'Email or phone number is required',
});

// =============================================================================
// PRODUCT SCHEMAS
// =============================================================================

const productSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name is too long')
    .transform((val) => val.trim()),
  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description is too long')
    .transform((val) => val.trim()),
  price: z
    .number({ required_error: 'Price is required', coerce: true })
    .min(0, 'Price cannot be negative')
    .max(1000000000, 'Price is unreasonably high'),
  category: z
    .string({ required_error: 'Category is required' })
    .min(1, 'Category is required')
    .max(100, 'Category is too long')
    .transform((val) => val.trim()),
  quantity: z
    .number({ required_error: 'Quantity is required', coerce: true })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .max(1000000, 'Quantity is unreasonably high'),
  brand: sanitizedString(100).optional(),
  deliveryTime: sanitizedString(100).optional(),
  countryOfOrigin: sanitizedString(100).optional(),
  condition: z.enum(['NEW', 'USED', 'REFURBISHED']).optional().default('NEW'),
  tags: z.array(z.string().max(50)).optional().default([]),
});

const productUpdateSchema = productSchema.partial();

// =============================================================================
// ORDER SCHEMAS
// =============================================================================

const shippingAddressSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Full name is too short')
    .max(100, 'Full name is too long')
    .transform((val) => val.trim()),
  address: z
    .string({ required_error: 'Address is required' })
    .min(5, 'Address is too short')
    .max(500, 'Address is too long')
    .transform((val) => val.trim()),
  city: z
    .string({ required_error: 'City is required' })
    .min(2, 'City is too short')
    .max(100, 'City is too long')
    .transform((val) => val.trim()),
  phone: phoneSchema,
});

const cartItemSchema = z.object({
  _id: uuidSchema.optional(),
  id: uuidSchema.optional(),
  cartQuantity: z
    .number({ coerce: true })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity is too high'),
}).refine((data) => data._id || data.id, {
  message: 'Product ID is required',
});

const orderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  cartItems: z
    .array(cartItemSchema)
    .min(1, 'Cart cannot be empty'),
  paymentMethod: z.enum(['EcoCash', 'BankTransfer', 'CashOnDelivery']).optional().default('EcoCash'),
});

// =============================================================================
// REVIEW SCHEMAS
// =============================================================================

const reviewSchema = z.object({
  productId: uuidSchema,
  rating: z
    .number({ required_error: 'Rating is required', coerce: true })
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z
    .string({ required_error: 'Comment is required' })
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment is too long')
    .transform((val) => val.trim()),
  title: sanitizedString(100).optional(),
  orderId: uuidSchema.optional(),
});

// =============================================================================
// MESSAGE SCHEMAS
// =============================================================================

const messageSchema = z.object({
  receiverId: uuidSchema,
  message: z
    .string({ required_error: 'Message is required' })
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters')
    .transform((val) => val.trim()),
  productId: uuidSchema.optional(),
});

// =============================================================================
// SELLER SCHEMAS
// =============================================================================

const sellerApplicationSchema = z.object({
  businessName: z
    .string({ required_error: 'Business name is required' })
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name is too long')
    .transform((val) => val.trim()),
  sellerType: z
    .string({ required_error: 'Seller type is required' })
    .transform((val) => val.toLowerCase())
    .refine((val) => ['individual', 'business'].includes(val), {
      message: 'Seller type must be either "individual" or "business"',
    }),
  phoneNumber: phoneSchema.optional(),
  ecocashNumber: sanitizedString(20).optional(),
  ecocashName: sanitizedString(100).optional(),
  bankName: sanitizedString(100).optional(),
  bankAccountName: sanitizedString(100).optional(),
  bankAccountNumber: sanitizedString(50).optional(),
  whatsappNumber: sanitizedString(20).optional(),
  whatsappNumber2: sanitizedString(20).optional(),
});

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

const paginationSchema = z.object({
  page: z.number({ coerce: true }).int().min(1).optional().default(1),
  limit: z.number({ coerce: true }).int().min(1).max(100).optional().default(20),
});

const objectIdParamSchema = z.object({
  id: uuidSchema,
});

const productIdParamSchema = z.object({
  productId: uuidSchema,
});

module.exports = {
  // Base schemas
  emailSchema,
  phoneSchema,
  uuidSchema,
  passwordSchema,
  sanitizedString,
  
  // Auth
  registrationSchema,
  loginSchema,
  
  // Products
  productSchema,
  productUpdateSchema,
  
  // Orders
  shippingAddressSchema,
  cartItemSchema,
  orderSchema,
  
  // Reviews
  reviewSchema,
  
  // Messages
  messageSchema,
  
  // Seller
  sellerApplicationSchema,
  
  // Query/Params
  paginationSchema,
  objectIdParamSchema,
  productIdParamSchema,
};
