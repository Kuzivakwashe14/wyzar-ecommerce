# Better Auth MongoDB Schema Documentation

Better Auth automatically creates and manages these collections in your MongoDB database when the application runs.

## Collections Overview

### 1. **user**
User account information with custom e-commerce fields.

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  emailVerified: Boolean,
  name: String,
  image: String,
  createdAt: Date,
  updatedAt: Date,

  // Custom fields for WyZar
  phone: String,
  isSeller: Boolean (default: false),
  isEmailVerified: Boolean (default: false),
  isPhoneVerified: Boolean (default: false),
  isSuspended: Boolean (default: false),
  role: String (default: 'buyer') // buyer, seller, admin
}
```

### 2. **account**
Authentication providers and credentials.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: user),
  provider: String, // 'credential', 'google', etc.
  providerAccountId: String,
  passwordHash: String, // For email/password auth
  salt: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **session**
Active user sessions.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: user),
  token: String (unique),
  expiresAt: Date,
  ipAddress: String,
  userAgent: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **verification**
Email verification and password reset tokens.

```javascript
{
  _id: ObjectId,
  identifier: String, // email or phone
  token: String (unique),
  type: String, // 'email-verification', 'password-reset'
  expiresAt: Date,
  createdAt: Date
}
```

### 5. **twoFactor**
Two-factor authentication secrets and backup codes.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: user),
  secret: String, // TOTP secret
  backupCodes: [String], // Encrypted backup codes
  enabled: Boolean,
  verifiedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **organization**
Seller organizations (shop/business accounts).

```javascript
{
  _id: ObjectId,
  name: String (required),
  slug: String (unique, required),
  logo: String,
  metadata: Object, // Custom data (address, phone, etc.)
  createdAt: Date,
  updatedAt: Date
}
```

### 7. **member**
Organization memberships (links users to seller organizations).

```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (ref: organization),
  userId: ObjectId (ref: user),
  role: String, // 'owner', 'admin', 'member'
  createdAt: Date,
  updatedAt: Date
}
```

### 8. **invitation**
Pending organization invitations.

```javascript
{
  _id: ObjectId,
  organizationId: ObjectId (ref: organization),
  email: String,
  role: String,
  token: String (unique),
  expiresAt: Date,
  invitedBy: ObjectId (ref: user),
  createdAt: Date,
  status: String // 'pending', 'accepted', 'declined'
}
```

## Indexes

Better Auth automatically creates these indexes:

- `user.email` - Unique index
- `account.userId` - Standard index
- `account.provider + providerAccountId` - Compound unique index
- `session.token` - Unique index
- `session.userId` - Standard index
- `verification.token` - Unique index
- `twoFactor.userId` - Unique index
- `organization.slug` - Unique index
- `member.organizationId + userId` - Compound unique index
- `invitation.token` - Unique index

## Notes

1. **Auto-generation**: Collections are created automatically when Better Auth initializes
2. **Migration**: Better Auth handles schema migrations automatically
3. **Custom Fields**: The custom user fields (phone, isSeller, etc.) are added automatically
4. **ObjectId**: All IDs use MongoDB ObjectId format for consistency
5. **Timestamps**: createdAt and updatedAt are managed automatically by Better Auth
