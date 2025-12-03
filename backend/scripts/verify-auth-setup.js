// backend/scripts/verify-auth-setup.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function verifyAuthSetup() {
  console.log('\n🔍 Verifying Better Auth Setup...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  const requiredEnvVars = [
    'MONGODB_URI',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'FRONTEND_URL'
  ];

  let allEnvVarsPresent = true;
  requiredEnvVars.forEach(varName => {
    const isPresent = !!process.env[varName];
    console.log(`  ${isPresent ? '✅' : '❌'} ${varName}: ${isPresent ? 'Set' : 'Missing'}`);
    if (!isPresent) allEnvVarsPresent = false;
  });

  if (!allEnvVarsPresent) {
    console.log('\n❌ Some environment variables are missing. Please check your .env file.\n');
    process.exit(1);
  }

  // Test MongoDB connection
  console.log('\n🔌 Testing MongoDB Connection...');
  let client;
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('  ✅ Connected to MongoDB successfully');

    const db = client.db();
    console.log(`  ℹ️  Database: ${db.databaseName}`);

    // List existing collections
    const collections = await db.listCollections().toArray();
    console.log(`  ℹ️  Existing collections: ${collections.length}`);

    if (collections.length > 0) {
      console.log('\n📦 Current Collections:');
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }

    // Expected Better Auth collections
    console.log('\n📝 Expected Better Auth Collections (will be auto-created):');
    const expectedCollections = [
      { name: 'user', description: 'User accounts with custom e-commerce fields' },
      { name: 'account', description: 'Authentication providers and credentials' },
      { name: 'session', description: 'Active user sessions' },
      { name: 'verification', description: 'Email verification and password reset tokens' },
      { name: 'twoFactor', description: 'Two-factor authentication secrets' },
      { name: 'organization', description: 'Seller organizations (shops)' },
      { name: 'member', description: 'Organization memberships' },
      { name: 'invitation', description: 'Pending organization invitations' }
    ];

    expectedCollections.forEach(col => {
      const exists = collections.some(c => c.name === col.name);
      console.log(`  ${exists ? '✅' : '⏳'} ${col.name} - ${col.description}`);
    });

    console.log('\n💡 Note: Collections marked with ⏳ will be created automatically');
    console.log('   when you start the server and Better Auth initializes.\n');

  } catch (error) {
    console.log('  ❌ Failed to connect to MongoDB');
    console.error('  Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }

  // Test email configuration (don't actually send, just validate)
  console.log('\n📧 Email Configuration:');
  console.log(`  ✅ Host: ${process.env.EMAIL_HOST}`);
  console.log(`  ✅ Port: ${process.env.EMAIL_PORT}`);
  console.log(`  ✅ User: ${process.env.EMAIL_USER}`);
  console.log(`  ✅ From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}`);

  // Test Better Auth config loading
  console.log('\n⚙️  Better Auth Configuration:');
  try {
    const { auth } = require('../lib/auth');
    console.log('  ✅ Auth configuration loaded successfully');
    console.log(`  ℹ️  Base URL: ${process.env.BETTER_AUTH_URL}`);
    console.log(`  ℹ️  Frontend URL: ${process.env.FRONTEND_URL}`);
  } catch (error) {
    console.log('  ❌ Failed to load auth configuration');
    console.error('  Error:', error.message);
    process.exit(1);
  }

  console.log('\n✅ All checks passed! Better Auth is ready to use.\n');
  console.log('🚀 Next steps:');
  console.log('  1. Start your backend server: npm run dev');
  console.log('  2. The MongoDB collections will be created automatically');
  console.log('  3. Test authentication endpoints at http://localhost:5000/api/auth\n');
}

// Run verification
verifyAuthSetup().catch(error => {
  console.error('\n❌ Verification failed:', error);
  process.exit(1);
});
