// backend/scripts/setupTestUser.js
// Sets up test users for TestSprite automated testing
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Setting up test users...');

  // 1. Set password and seller status for tawandamhch@gmail.com
  const testEmail = 'tawandamhch@gmail.com';
  const testPassword = 'AlPha21Thxkvng';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(testPassword, salt);

  let user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (user) {
    await prisma.user.update({
      where: { email: testEmail },
      data: {
        password: hashedPassword,
        isSeller: true,
        isEmailVerified: true,
        isVerified: true,
      }
    });
    console.log(`✅ Updated ${testEmail} with local password and seller=true`);

    // Ensure sellerDetails exist
    const sellerDetails = await prisma.sellerDetails.findUnique({ where: { userId: user.id } });
    if (!sellerDetails) {
      await prisma.sellerDetails.create({
        data: {
          userId: user.id,
          businessName: 'Test Business',
          verificationStatus: 'APPROVED',
          city: 'Harare',
          country: 'Zimbabwe',
        }
      });
      console.log('✅ Created sellerDetails for', testEmail);
    }
  } else {
    user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        firstName: 'Tawanda',
        lastName: 'Test',
        isSeller: true,
        isEmailVerified: true,
        isVerified: true,
        role: 'USER',
      }
    });
    await prisma.sellerDetails.create({
      data: {
        userId: user.id,
        businessName: 'Test Business',
        verificationStatus: 'APPROVED',
        city: 'Harare',
        country: 'Zimbabwe',
      }
    });
    console.log(`✅ Created ${testEmail} with password and seller=true`);
  }

  // 2. Set up buyer@example.com (non-seller)
  const buyerEmail = 'buyer@example.com';
  const buyerPassword = 'Str0ngPass!1';
  const buyerHash = await bcrypt.hash(buyerPassword, salt);

  let buyer = await prisma.user.findUnique({ where: { email: buyerEmail } });
  if (buyer) {
    await prisma.user.update({
      where: { email: buyerEmail },
      data: {
        password: buyerHash,
        isEmailVerified: true,
      }
    });
    console.log(`✅ Updated ${buyerEmail} with local password`);
  } else {
    await prisma.user.create({
      data: {
        email: buyerEmail,
        password: buyerHash,
        firstName: 'Buyer',
        lastName: 'Test',
        isSeller: false,
        isEmailVerified: true,
        role: 'USER',
      }
    });
    console.log(`✅ Created ${buyerEmail} with password`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
