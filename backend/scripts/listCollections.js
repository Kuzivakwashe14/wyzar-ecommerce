// backend/scripts/listCollections.js
const mongoose = require('mongoose');
require('dotenv').config();

async function listCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nExisting Collections:');
    collections.forEach(c => console.log(` - ${c.name}`));

    process.exit(0);
  } catch (error) {
    console.error('Error listing collections:', error);
    process.exit(1);
  }
}

listCollections();
