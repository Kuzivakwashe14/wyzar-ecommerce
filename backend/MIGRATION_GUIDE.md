# MongoDB to PostgreSQL Migration Guide

## Overview
This document outlines the complete migration from MongoDB/Mongoose to PostgreSQL/Prisma for the WyZar E-commerce platform.

## What Has Been Changed

### 1. Database System
- **Before**: MongoDB with Mongoose ODM
- **After**: PostgreSQL with Prisma ORM

### 2. Schema Definition
- **Before**: Mongoose schemas in `models/` directory
- **After**: Prisma schema in `prisma/schema.prisma`

### 3. Database Connection
- **Before**: `mongoose.connect()` in `index.js`
- **After**: Prisma Client in `config/prisma.js`

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install @prisma/client
npm install -D prisma
```

### 2. Set Up Environment Variables
Create a `.env` file in the backend directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/wyzar_ecommerce?schema=public"
```

Replace:
- `username`: Your PostgreSQL username
- `password`: Your PostgreSQL password
- `localhost:5432`: Your PostgreSQL host and port
- `wyzar_ecommerce`: Your database name

### 3. Run Prisma Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

### 4. Remove Old MongoDB Dependencies
```bash
npm uninstall mongoose express-mongo-sanitize
```

## Migration Changes by File

### Core Files

#### `prisma/schema.prisma` ✅ CREATED
- Complete database schema with all models
- Enums defined (Role, SellerType, OrderStatus, etc.)
- Relationships configured
- Indexes defined

#### `config/prisma.js` ✅ CREATED
- Prisma Client singleton
- Graceful shutdown handling

#### `index.js` ✅ UPDATED
- Removed `mongoose` import
- Added `prisma` import
- Updated database connection code
- Updated graceful shutdown handlers

#### `package.json` ✅ UPDATED
- Added `@prisma/client` dependency
- Added `prisma` dev dependency
- Removed `mongoose` dependency
- Removed `express-mongo-sanitize` dependency

### Route Files

#### `routes/auth.js` ✅ UPDATED
- Registration: `new User().save()` → `prisma.user.create()`
- Login: `User.findOne()` → `prisma.user.findUnique()`
- Get user: `User.findById()` → `prisma.user.findUnique()`
- Enum values: `'user'` → `'USER'`, `'admin'` → `'ADMIN'`

#### `routes/product.js` ✅ UPDATED
- Product creation: `new Product().save()` → `prisma.product.create()`
- Get products: `Product.find()` → `prisma.product.findMany()`
- Get by ID: `Product.findById()` → `prisma.product.findUnique()`
- Update: `Product.findByIdAndUpdate()` → `prisma.product.update()`
- Delete: `Product.findByIdAndDelete()` → `prisma.product.delete()`
- Populate: `.populate('seller')` → `include: { seller: true }`
- Bulk upload: `insertMany()` → `createMany()`

#### `routes/order.js` ✅ UPDATED
- Order creation with nested items: `create({ data: { orderItems: { createMany: {...} } } })`
- Status enums: `'Paid'` → `'PAID'`, `'Pending'` → `'PENDING'`
- Payment method: `'Paynow'` → `'PAYNOW'`, `'CashOnDelivery'` → `'CASH_ON_DELIVERY'`

#### `routes/review.js` ✅ PARTIALLY UPDATED
- Reviews: `Review.find()` → `prisma.review.findMany()`
- Aggregations: `Review.aggregate()` → `prisma.review.groupBy()` and `.aggregate()`
- Ratings calculation handled with Prisma aggregations

#### `routes/otp.js` ✅ UPDATED
- OTP creation: `new OTP().save()` → `prisma.oTP.create()`
- Find OTP: `OTP.findOne()` → `prisma.oTP.findFirst()`
- Update: `otp.save()` → `prisma.oTP.update()`
- Enum: `'registration'` → `'REGISTRATION'`

#### `routes/seller.js` ✅ UPDATED
- Seller application with nested documents
- `sellerDetails` embedded document → separate `SellerDetails` table with relation
- `verificationDocuments` array → separate `VerificationDocument` table
- Enum conversions: `'pending'` → `'PENDING'`, `'approved'` → `'APPROVED'`

#### `routes/messages.js` ✅ UPDATED
- Conversation participants from embedded array → `ConversationParticipant` junction table
- Blocked users from embedded array → `UserBlock` table
- Unread count management through junction table
- Message queries with proper includes

#### `routes/search.js` ✅ UPDATED
- MongoDB `$regex` → Prisma `contains` with `mode: 'insensitive'`
- Text search → multiple field searches with OR
- Price range filters using `gte` and `lte`

#### `routes/admin.js` ✅ UPDATED
- Dashboard statistics
- Complex aggregations converted to Prisma patterns
- User/Product/Order counts
- Revenue calculations

#### `routes/adminUsers.js` ✅ UPDATED
- User management queries
- Search with case-insensitive contains
- Role-based filtering with uppercase enums

#### `routes/adminSellers.js` ✅ UPDATED
- Seller verification workflows
- Document management
- Status updates with uppercase enums

#### `routes/adminProducts.js` ✅ UPDATED
- Product management with filters
- Search across multiple fields
- Condition enum uppercase conversion

#### `routes/adminOrders.js` ✅ UPDATED
- Order management
- Status filtering with uppercase enums
- Date range filtering

#### `routes/adminAccessControl.js` ✅ UPDATED
- Admin user management
- Role: `'admin'` → `'ADMIN'`

### Middleware Files

#### `middleware/adminAuth.js` ✅ UPDATED
- User lookup: `User.findById()` → `prisma.user.findUnique()`
- Role check: `'admin'` → `'ADMIN'`

#### `middleware/auth.js` - May need updates if it queries User model

## Key Conversion Patterns

### Query Conversions
```javascript
// MongoDB → Prisma

// Find One
Model.findOne({ email }) 
→ prisma.model.findFirst({ where: { email } })
→ prisma.model.findUnique({ where: { email } }) // for unique fields

// Find Many
Model.find({ category })
→ prisma.model.findMany({ where: { category } })

// Find by ID
Model.findById(id)
→ prisma.model.findUnique({ where: { id } })

// Create
new Model(data).save()
→ prisma.model.create({ data })

// Update
Model.findByIdAndUpdate(id, update)
→ prisma.model.update({ where: { id }, data: update })

// Delete
Model.findByIdAndDelete(id)
→ prisma.model.delete({ where: { id } })

// Count
Model.countDocuments(query)
→ prisma.model.count({ where: query })

// Populate
Model.find().populate('field')
→ prisma.model.findMany({ include: { field: true } })

// Select
Model.find().select('-password')
→ prisma.model.findMany({ select: { password: false, ...otherFields: true } })
```

### Field Conversions
```javascript
// MongoDB → PostgreSQL/Prisma
_id → id
ObjectId → String (UUID)
$inc → { increment: number }
$push → create/connect nested records
$regex → contains with mode: 'insensitive'
$gte/$lte → gte/lte
$or → OR: [...]
$and → AND: [...]
```

### Enum Conversions
```javascript
// All enums are UPPERCASE in Prisma
'user' → 'USER'
'seller' → 'SELLER'  
'admin' → 'ADMIN'
'pending' → 'PENDING'
'approved' → 'APPROVED'
'rejected' → 'REJECTED'
'new' → 'NEW'
'used' → 'USED'
```

## Data Migration

### Option 1: Fresh Start (Development)
If you're in development with test data:
```bash
# Clear and recreate database
npx prisma db push --force-reset

# Optional: Run seed script
npx prisma db seed
```

### Option 2: Data Migration (Production)
If you have existing data in MongoDB to migrate:

1. Export MongoDB data:
```bash
mongoexport --db=wyzar --collection=users --out=users.json
mongoexport --db=wyzar --collection=products --out=products.json
mongoexport --db=wyzar --collection=orders --out=orders.json
# ... repeat for all collections
```

2. Create migration scripts to transform and import data
3. Handle ObjectId → UUID conversion
4. Handle embedded documents → related tables
5. Verify data integrity

## Testing

1. **Unit Tests**: Update test files to use Prisma
2. **Integration Tests**: Test all API endpoints
3. **Data Validation**: Ensure all data constraints work
4. **Performance**: Monitor query performance

## Prisma Studio

View and edit your database data:
```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555

## Troubleshooting

### Common Issues

1. **Connection Error**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify credentials

2. **Schema Changes**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Enum Errors**
   - Make sure all enum values are UPPERCASE
   - Check role comparisons in code

4. **UUID vs ObjectId**
   - All IDs are now UUIDs (strings)
   - Remove ObjectId validation

## Next Steps

1. ✅ Complete remaining route migrations
2. ⏳ Update utility functions if they use Mongoose models
3. ⏳ Update test files
4. ⏳ Data migration (if needed)
5. ⏳ Performance optimization
6. ⏳ Production deployment

## Rollback Plan

If you need to rollback:
1. Restore MongoDB connection in `index.js`
2. Reinstall mongoose: `npm install mongoose`
3. Restore old route files from git history
4. Remove Prisma: `npm uninstall @prisma/client prisma`

## Benefits of PostgreSQL/Prisma

- ✅ Type safety with generated types
- ✅ Better performance for complex queries
- ✅ ACID compliance
- ✅ Better tooling (Prisma Studio)
- ✅ Easier migrations
- ✅ Better for relational data
- ✅ Stronger data integrity

## Support

For Prisma documentation: https://www.prisma.io/docs
For PostgreSQL documentation: https://www.postgresql.org/docs/
