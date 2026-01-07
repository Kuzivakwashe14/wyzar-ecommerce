# WyZar E-Commerce - PostgreSQL Migration Setup

This guide will help you complete the migration from MongoDB to PostgreSQL.

## Prerequisites

- PostgreSQL installed and running
- Node.js and npm installed
- Git (for version control)

## Step-by-Step Setup

### 1. Install PostgreSQL (if not already installed)

**Windows:**
Download from https://www.postgresql.org/download/windows/

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create PostgreSQL Database

```bash
# Access PostgreSQL
psql -U postgres

# In psql shell:
CREATE DATABASE wyzar_ecommerce;
CREATE USER wyzar_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE wyzar_ecommerce TO wyzar_user;
\q
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- @prisma/client (runtime)
- prisma (CLI tool) - dev dependency

### 4. Configure Environment

Create `.env` file in backend directory:

```env
# Copy from .env.example
cp .env.example .env
```

Edit `.env` and update:
```env
DATABASE_URL="postgresql://wyzar_user:your_secure_password@localhost:5432/wyzar_ecommerce?schema=public"
```

### 5. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Create tables in database
npx prisma db push

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 6. Verify Migration

Check that all files are correctly migrated:

**Core Files:**
- ✅ `prisma/schema.prisma` - Database schema
- ✅ `config/prisma.js` - Prisma client
- ✅ `index.js` - Updated connection
- ✅ `package.json` - Updated dependencies

**Route Files:**
- ✅ `routes/auth.js`
- ✅ `routes/product.js`
- ✅ `routes/order.js`
- ✅ `routes/review.js`
- ✅ `routes/otp.js`
- ✅ `routes/seller.js`
- ✅ `routes/messages.js`
- ✅ `routes/search.js`
- ✅ `routes/admin.js`
- ✅ `routes/adminUsers.js`
- ✅ `routes/adminSellers.js`
- ✅ `routes/adminProducts.js`
- ✅ `routes/adminOrders.js`
- ✅ `routes/adminAccessControl.js`

**Middleware:**
- ✅ `middleware/adminAuth.js`

### 7. Remove Old MongoDB Files (Optional)

The old Mongoose model files in `models/` directory are no longer used and can be removed:

```bash
# Backup first!
mkdir models_backup
mv models/* models_backup/

# Or just remove if you're confident
rm -rf models/
```

### 8. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Verification Checklist

- [ ] PostgreSQL is running
- [ ] Database `wyzar_ecommerce` exists
- [ ] `.env` file is configured with correct DATABASE_URL
- [ ] `npx prisma generate` runs without errors
- [ ] `npx prisma db push` creates tables successfully
- [ ] Server starts without errors
- [ ] API endpoints respond correctly

## Common Commands

### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Push schema changes to database
npx prisma db push

# Create a migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio (database GUI)
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

### Database Management

```bash
# Reset database (WARNING: Deletes all data)
npx prisma db push --force-reset

# Seed database (if seed script exists)
npx prisma db seed
```

## Testing the Migration

### 1. Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Test Product Creation
```bash
# (Requires authentication token from login)
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_TOKEN" \
  -F "name=Test Product" \
  -F "description=Test Description" \
  -F "price=99.99" \
  -F "category=Electronics" \
  -F "quantity=10"
```

## Troubleshooting

### Error: Cannot connect to database

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql $DATABASE_URL`

### Error: Prisma Client not generated

**Solution:**
```bash
npx prisma generate
```

### Error: Enum value not recognized

**Solution:**
- All enum values must be UPPERCASE
- Check code for lowercase enum values:
  - `'user'` → `'USER'`
  - `'pending'` → `'PENDING'`
  - `'paid'` → `'PAID'`

### Error: Unique constraint violation

**Solution:**
- Ensure unique fields (email, phone) don't have duplicates
- Use `upsert` instead of `create` if needed

### Schema changes not reflecting

**Solution:**
```bash
npx prisma generate
npx prisma db push
```

## Performance Tips

1. **Use Indexes**: Schema already includes indexes for common queries
2. **Use Select**: Only query fields you need
3. **Batch Queries**: Use `createMany`, `updateMany` for bulk operations
4. **Use Transactions**: For operations that must succeed or fail together

Example transaction:
```javascript
await prisma.$transaction(async (tx) => {
  await tx.user.create({ data: userData });
  await tx.sellerDetails.create({ data: sellerData });
});
```

## Next Steps

1. **Data Migration** (if you have existing MongoDB data):
   - See MIGRATION_GUIDE.md for detailed instructions
   - Consider using a migration script

2. **Update Tests**:
   - Update Jest tests to use Prisma
   - Mock Prisma Client for unit tests

3. **Monitor Performance**:
   - Use Prisma query logging
   - Monitor slow queries
   - Optimize as needed

4. **Production Deployment**:
   - Set up managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
   - Configure connection pooling
   - Run migrations in production

## Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Prisma Best Practices**: https://www.prisma.io/docs/guides/performance-and-optimization
- **Migration Guide**: See MIGRATION_GUIDE.md in this directory

## Support

For issues or questions:
1. Check MIGRATION_GUIDE.md
2. Consult Prisma documentation
3. Review error logs in console

---

**Migration Status**: ✅ COMPLETE

All core functionality has been migrated from MongoDB to PostgreSQL using Prisma ORM.
