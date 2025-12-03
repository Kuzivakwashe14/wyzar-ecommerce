// backend/scripts/test-better-auth.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testBetterAuth() {
  console.log('\n🧪 Testing Better Auth Integration...\n');

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📦 Current MongoDB Collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // Check for Better Auth collections
    console.log('\n🔍 Better Auth Collections Status:');
    const betterAuthCollections = [
      'user', 'account', 'session', 'verification',
      'twoFactor', 'organization', 'member', 'invitation'
    ];

    betterAuthCollections.forEach(name => {
      const exists = collections.some(c => c.name === name);
      console.log(`  ${exists ? '✅' : '⏳'} ${name}`);
    });

    console.log('\n💡 Note: Collections marked with ⏳ will be created automatically');
    console.log('   when users interact with Better Auth endpoints.\n');

    // Test API endpoints
    console.log('🌐 Testing Better Auth Endpoints:');
    console.log('  The server should be running on http://localhost:5000');
    console.log('\n  Available endpoints:');
    console.log('  - GET  /api/better-auth/session');
    console.log('  - POST /api/better-auth/sign-up/email');
    console.log('  - POST /api/better-auth/sign-in/email');
    console.log('  - POST /api/better-auth/sign-out');
    console.log('  - POST /api/better-auth/two-factor/enable');
    console.log('  - POST /api/better-auth/organization/create');
    console.log('\n  Try testing with curl:');
    console.log('  curl http://localhost:5000/api/better-auth/session\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testBetterAuth();
