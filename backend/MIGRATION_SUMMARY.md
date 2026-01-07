# Prisma Migration Summary

## Completed Migrations

### ✅ routes/product.js
- Replaced `const Product = require('../models/Product')` with `const prisma = require('../config/prisma')`
- Replaced `const User = require('../models/User')` removed (using prisma)
- `Product.find()` → `prisma.product.findMany()`
- `Product.findById()` → `prisma.product.findUnique({ where: { id } })`
- `new Product().save()` → `prisma.product.create({ data })`
- `Product.findByIdAndUpdate()` → `prisma.product.update({ where: { id }, data })`
- `Product.findByIdAndDelete()` → `prisma.product.delete({ where: { id } })`
- `User.findById()` → `prisma.user.findUnique({ where: { id } })`
- `.populate('seller')` → `include: { seller: { select: {...} } }`
- `seller` field → `sellerId` (foreign key)
- Condition enums: 'new' → 'NEW', 'used' → 'USED', 'refurbished' → 'REFURBISHED'
- `Product.insertMany()` → `prisma.product.createMany()`

### ✅ routes/order.js
- Replaced model imports with prisma
- `Order.findById()` → `prisma.order.findUnique({ where: { id } })`
- `new Order().save()` → `prisma.order.create({ data, include: { orderItems: true } })`
- `Product.find()` → `prisma.product.findMany()`
- Order creation with nested orderItems using `createMany`
- Payment method enums: 'Paynow' → 'PAYNOW', 'CashOnDelivery' → 'CASH_ON_DELIVERY'
- Status enums: 'Pending' → 'PENDING', 'Paid' → 'PAID', etc.
- `$inc: { quantity: -1 }` → `data: { quantity: { decrement: 1 } }`
- `order.user` → `order.userId`
- `item.product` → `item.productId`
- Seller orders using `orderItems: { some: { productId: { in: [...] } } }`
- Aggregations replaced with Prisma aggregations

### ✅ routes/review.js (Partial)
- Replaced model imports with prisma
- `Review.find()` → `prisma.review.findMany()`
- Aggregations using `prisma.review.groupBy()` and `prisma.review.aggregate()`
- `.populate('user', 'email')` → `include: { user: { select: { email: true } } }`

## Pending Migrations

### 🔄 routes/review.js (Complete remaining routes)

**Pattern replacements needed:**
```javascript
// Check existing review
const existingReview = await prisma.review.findUnique({
  where: {
    productId_userId: {
      productId: productId,
      userId: req.user.id
    }
  }
});

// Check verified purchase
const userOrders = await prisma.order.findMany({
  where: {
    userId: req.user.id,
    status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
  },
  include: { orderItems: true }
});

// Create review
const review = await prisma.review.create({
  data: {
    productId: productId,
    userId: req.user.id,
    rating: parseInt(rating),
    title: title || '',
    comment,
    orderId: orderId || null,
    verifiedPurchase
  },
  include: {
    user: {
      select: { id: true, email: true }
    }
  }
});

// Update review
const review = await prisma.review.update({
  where: { id: req.params.id },
  data: {
    rating: rating ? parseInt(rating) : undefined,
    title,
    comment,
    isEdited: true,
    editedAt: new Date()
  },
  include: {
    user: { select: { email: true } }
  }
});

// Delete review
await prisma.review.delete({ where: { id: req.params.id } });

// Get user reviews
const reviews = await prisma.review.findMany({
  where: { userId: req.user.id },
  include: {
    product: {
      select: { id: true, name: true, images: true, price: true }
    }
  },
  orderBy: { createdAt: 'desc' }
});

// Update product rating helper function
async function updateProductRating(productId) {
  const stats = await prisma.review.aggregate({
    where: {
      productId: productId,
      isApproved: true
    },
    _avg: { rating: true },
    _count: { rating: true }
  });

  if (stats._count.rating > 0) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAverage: Math.round(stats._avg.rating * 10) / 10,
        ratingCount: stats._count.rating
      }
    });
  } else {
    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAverage: 0,
        ratingCount: 0
      }
    });
  }
}
```

### 🔄 routes/seller.js

**Key conversions:**
```javascript
// Replace imports
const prisma = require('../config/prisma');

// Find user
const user = await prisma.user.findUnique({
  where: { id: req.user.id },
  include: { sellerDetails: { include: { verificationDocuments: true } } }
});

// Update seller details
await prisma.user.update({
  where: { id: req.user.id },
  data: {
    isSeller: true,
    sellerDetails: {
      upsert: {
        create: {
          businessName,
          sellerType: sellerType.toUpperCase(), // INDIVIDUAL, BUSINESS, INTERNATIONAL
          phoneNumber,
          streetAddress: parsedAddress?.street,
          city: parsedAddress?.city,
          state: parsedAddress?.state,
          country: parsedAddress?.country,
          postalCode: parsedAddress?.postalCode,
          verificationStatus: 'UNDER_REVIEW',
          verificationDocuments: {
            createMany: {
              data: verificationDocuments.map(doc => ({
                documentType: doc.documentType.toUpperCase(),
                documentPath: doc.documentPath,
                documentName: doc.documentName,
                status: 'PENDING'
              }))
            }
          }
        },
        update: {
          businessName,
          sellerType: sellerType.toUpperCase(),
          phoneNumber,
          verificationStatus: 'UNDER_REVIEW'
        }
      }
    }
  }
});
```

### 🔄 routes/otp.js

**Key conversions:**
```javascript
const prisma = require('../config/prisma');

// Check existing user
const existingUser = await prisma.user.findUnique({ where: { email } });

// Find recent OTP
const recentOTP = await prisma.oTP.findFirst({
  where: {
    email,
    type: type.toUpperCase(), // REGISTRATION, LOGIN, PASSWORD_RESET
    createdAt: { gte: new Date(Date.now() - 60 * 1000) }
  }
});

// Create OTP
const otpRecord = await prisma.oTP.create({
  data: {
    email,
    otp: otpCode,
    type: type.toUpperCase(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  }
});

// Find and verify OTP
const otpRecord = await prisma.oTP.findFirst({
  where: {
    email,
    type: type.toUpperCase(),
    verified: false
  },
  orderBy: { createdAt: 'desc' }
});

// Mark as verified
await prisma.oTP.update({
  where: { id: otpRecord.id },
  data: { verified: true }
});

// Update user email verification
if (type === 'registration' || type === 'login') {
  await prisma.user.updateMany({
    where: { email },
    data: { isEmailVerified: true }
  });
}

// Increment attempts
await prisma.oTP.update({
  where: { id: otpRecord.id },
  data: { attempts: { increment: 1 } }
});
```

### 🔄 routes/messages.js

**Key conversions:**
```javascript
const prisma = require('../config/prisma');

// Get conversations
const conversations = await prisma.conversation.findMany({
  where: {
    participants: {
      some: { userId: req.user.id }
    }
  },
  include: {
    participants: {
      include: {
        user: {
          select: {
            id: true,
            email: true,
            sellerDetails: { select: { businessName: true } }
          }
        }
      }
    },
    product: { select: { id: true, name: true, images: true, price: true } },
    lastMessage: true
  },
  orderBy: { lastMessageAt: 'desc' }
});

// Get messages
const messages = await prisma.message.findMany({
  where: { conversationId: req.params.conversationId },
  include: {
    sender: { select: { id: true, email: true } },
    receiver: { select: { id: true, email: true } }
  },
  orderBy: { createdAt: 'asc' }
});

// Mark as read
await prisma.message.updateMany({
  where: {
    conversationId: conversation.id,
    receiverId: req.user.id,
    isRead: false
  },
  data: {
    isRead: true,
    readAt: new Date()
  }
});

// Find or create conversation
let conversation = await prisma.conversation.findFirst({
  where: {
    AND: [
      { participants: { some: { userId: req.user.id } } },
      { participants: { some: { userId: receiverId } } }
    ]
  }
});

if (!conversation) {
  conversation = await prisma.conversation.create({
    data: {
      productId: productId || null,
      participants: {
        createMany: {
          data: [
            { userId: req.user.id },
            { userId: receiverId }
          ]
        }
      }
    }
  });
}

// Create message
const newMessage = await prisma.message.create({
  data: {
    conversationId: conversation.id,
    senderId: req.user.id,
    receiverId: receiverId,
    message: message.trim()
  },
  include: {
    sender: { select: { email: true } },
    receiver: { select: { email: true } }
  }
});

// Update conversation
await prisma.conversation.update({
  where: { id: conversation.id },
  data: {
    lastMessageId: newMessage.id,
    lastMessageAt: new Date()
  }
});

// Increment unread count
await prisma.conversationParticipant.updateMany({
  where: {
    conversationId: conversation.id,
    userId: receiverId
  },
  data: {
    unreadCount: { increment: 1 }
  }
});

// Reset unread
await prisma.conversationParticipant.updateMany({
  where: {
    conversationId: conversation.id,
    userId: req.user.id
  },
  data: {
    unreadCount: 0
  }
});
```

### 🔄 routes/search.js

**Key conversions:**
```javascript
const prisma = require('../config/prisma');

// Build where clause for search
const where = {};

// Text search (use contains for search)
if (q && q.trim()) {
  where.OR = [
    { name: { contains: q.trim(), mode: 'insensitive' } },
    { description: { contains: q.trim(), mode: 'insensitive' } },
    { brand: { contains: q.trim(), mode: 'insensitive' } },
    { tags: { has: q.trim() } }
  ];
}

// Category filter
if (category) {
  where.category = { contains: category, mode: 'insensitive' };
}

// Price range
if (minPrice || maxPrice) {
  where.price = {};
  if (minPrice) where.price.gte = parseFloat(minPrice);
  if (maxPrice) where.price.lte = parseFloat(maxPrice);
}

// Location filter
if (location) {
  where.city = { contains: location, mode: 'insensitive' };
}

// Condition
if (condition) {
  where.condition = condition.toUpperCase();
}

// Brand
if (brand) {
  where.brand = { contains: brand, mode: 'insensitive' };
}

// In stock
if (inStock === 'true') {
  where.quantity = { gt: 0 };
}

// Featured
if (featured === 'true') {
  where.featured = true;
}

// Execute search
const products = await prisma.product.findMany({
  where,
  include: {
    seller: {
      select: {
        email: true,
        sellerDetails: {
          select: { businessName: true }
        }
      }
    }
  },
  orderBy: sort.startsWith('-') 
    ? { [sort.substring(1)]: 'desc' }
    : { [sort]: 'asc' },
  skip: (parseInt(page) - 1) * parseInt(limit),
  take: parseInt(limit)
});

const total = await prisma.product.count({ where });

// Suggestions
const suggestions = await prisma.product.findMany({
  where: {
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { brand: { contains: q, mode: 'insensitive' } },
      { tags: { has: q } }
    ]
  },
  select: { name: true, category: true, brand: true },
  take: 10
});
```

### 🔄 routes/admin.js

**Key conversions:**
```javascript
const prisma = require('../config/prisma');

// Count statistics
const [totalUsers, totalSellers, pendingSellers, totalProducts, totalOrders] = await Promise.all([
  prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
  prisma.user.count({ where: { isSeller: true, isVerified: true } }),
  prisma.sellerDetails.count({ where: { verificationStatus: 'PENDING' } }),
  prisma.product.count(),
  prisma.order.count()
]);

// Revenue calculations
const revenueData = await prisma.order.aggregate({
  where: {
    status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
  },
  _sum: { totalPrice: true }
});

// Revenue by day
const revenueByDay = await prisma.order.groupBy({
  by: ['createdAt'],
  where: {
    createdAt: { gte: startDate },
    status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] }
  },
  _sum: { totalPrice: true },
  _count: true
});
```

### 🔄 routes/adminUsers.js

**Key conversions:**
```javascript
const prisma = require('../config/prisma');

// Get all users
const users = await prisma.user.findMany({
  where: {
    role: { not: 'ADMIN' },
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(role && { role: role.toUpperCase() }),
    ...(isSeller !== '' && { isSeller: isSeller === 'true' }),
    ...(isVerified !== '' && { isVerified: isVerified === 'true' }),
    ...(isSuspended !== '' && { isSuspended: isSuspended === 'true' })
  },
  select: {
    id: true,
    email: true,
    phone: true,
    role: true,
    isSeller: true,
    isVerified: true,
    isSuspended: true,
    createdAt: true,
    sellerDetails: { select: { businessName: true } }
  },
  orderBy: { createdAt: 'desc' },
  take: parseInt(limit),
  skip: (parseInt(page) - 1) * parseInt(limit)
});

// Update user
await prisma.user.update({
  where: { id: req.params.id },
  data: {
    email,
    phone,
    isVerified,
    isSuspended,
    suspensionReason,
    role: role ? role.toUpperCase() : undefined
  }
});

// Delete user
await prisma.user.delete({ where: { id: req.params.id } });
```

### 🔄 routes/adminSellers.js

**Key conversions:**
```javascript
const prisma = require('../config/prisma');

// Get pending sellers
const pendingSellers = await prisma.user.findMany({
  where: {
    isSeller: true,
    sellerDetails: {
      verificationStatus: 'PENDING'
    }
  },
  include: {
    sellerDetails: {
      include: { verificationDocuments: true }
    }
  },
  orderBy: { createdAt: 'asc' }
});

// Approve seller
await prisma.user.update({
  where: { id: req.params.id },
  data: {
    isVerified: true,
    sellerDetails: {
      update: {
        verificationStatus: 'APPROVED',
        verifiedAt: new Date(),
        verifiedById: req.user.id
      }
    }
  }
});

// Reject seller
await prisma.user.update({
  where: { id: req.params.id },
  data: {
    isSeller: false,
    isVerified: false,
    sellerDetails: {
      update: {
        verificationStatus: 'REJECTED',
        verificationNotes: reason
      }
    }
  }
});
```

### 🔄 routes/adminProducts.js, adminOrders.js, adminAccessControl.js

Similar pattern: Replace Mongoose models with Prisma queries, use enum values in uppercase, change field names from MongoDB references to foreign keys with `Id` suffix.

## General Conversion Rules

1. **Imports**: `const Model = require('./models/Model')` → `const prisma = require('./config/prisma')`
2. **Find by ID**: `Model.findById(id)` → `prisma.model.findUnique({ where: { id } })`
3. **Find one**: `Model.findOne({ field: value })` → `prisma.model.findUnique() or findFirst()`
4. **Find many**: `Model.find({ field: value })` → `prisma.model.findMany({ where: { field: value } })`
5. **Create**: `new Model(data).save()` → `prisma.model.create({ data })`
6. **Update**: `model.save()` or `findByIdAndUpdate()` → `prisma.model.update({ where, data })`
7. **Delete**: `model.deleteOne()` or `findByIdAndDelete()` → `prisma.model.delete({ where })`
8. **Populate**: `.populate('field')` → `include: { field: true }` or detailed selects
9. **Select**: `.select('-password')` → `select: { password: false, ...fields: true }`
10. **Sort**: `.sort({ field: -1 })` → `orderBy: { field: 'desc' }`
11. **Skip/Limit**: `.skip(n).limit(m)` → `skip: n, take: m`
12. **Count**: `Model.countDocuments()` → `prisma.model.count()`
13. **Aggregate**: MongoDB aggregations → Prisma `groupBy()` and `aggregate()`
14. **Regex**: `{ field: { $regex: value, $options: 'i' } }` → `{ field: { contains: value, mode: 'insensitive' } }`
15. **In operator**: `{ field: { $in: [...] } }` → `{ field: { in: [...] } }`
16. **Increment**: `{ $inc: { field: 1 } }` → `{ field: { increment: 1 } }`
17. **Enums**: lowercase → UPPERCASE (e.g., 'user' → 'USER', 'pending' → 'PENDING')
18. **Field names**: Foreign keys get `Id` suffix (e.g., `seller` → `sellerId`, `user` → `userId`)
19. **ObjectId**: No need for `.toString()` comparisons, Prisma handles UUIDs as strings
20. **Error handling**: Remove `err.kind === 'ObjectId'` checks
