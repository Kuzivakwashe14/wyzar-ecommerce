// scripts/fixImagePaths.js
// Fix image paths in database - convert absolute paths to public URLs

const mongoose = require('mongoose');
const Product = require('../models/Product');
const { getPublicUrl } = require('../config/localStorage');
require('dotenv').config();

/**
 * Convert absolute Windows path to public URL
 * Example: C:/Users/.../uploads/products/image.jpg -> /static/uploads/products/image.jpg
 */
function convertPathToPublicUrl(absolutePath) {
  // If already a public URL, return as-is
  if (absolutePath.startsWith('/static/')) {
    return absolutePath;
  }

  // If it's an absolute path, extract the relative part
  if (absolutePath.includes('uploads/')) {
    const parts = absolutePath.split('uploads/');
    return `/static/uploads/${parts[1].replace(/\\/g, '/')}`;
  }

  // Fallback: try to use getPublicUrl
  try {
    return getPublicUrl(absolutePath);
  } catch (error) {
    console.error(`Could not convert path: ${absolutePath}`);
    return absolutePath;
  }
}

/**
 * Fix all products in the database
 */
async function fixAllProductPaths() {
  try {
    console.log('\n🔧 Starting Image Path Migration...\n');
    console.log('='.repeat(60));

    // Connect to database
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products in database\n`);

    if (products.length === 0) {
      console.log('ℹ️  No products to fix. Exiting...\n');
      process.exit(0);
    }

    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    const errors = [];

    // Process each product
    for (const product of products) {
      try {
        let needsUpdate = false;
        const originalImages = [...product.images];

        // Convert each image path
        const updatedImages = product.images.map(imagePath => {
          const newPath = convertPathToPublicUrl(imagePath);

          // Check if path was changed
          if (newPath !== imagePath) {
            needsUpdate = true;
          }

          return newPath;
        });

        if (needsUpdate) {
          // Update product
          product.images = updatedImages;
          await product.save();

          fixedCount++;
          console.log(`✅ Fixed: ${product.name}`);
          console.log(`   ID: ${product._id}`);
          console.log(`   Before: ${originalImages[0].substring(0, 60)}...`);
          console.log(`   After:  ${updatedImages[0]}`);
          console.log(`   Images: ${updatedImages.length} image(s) updated\n`);
        } else {
          alreadyCorrectCount++;
          console.log(`⏭️  Skipped: ${product.name} (already correct)`);
        }

      } catch (error) {
        errors.push({
          product: product.name,
          id: product._id,
          error: error.message
        });
        console.error(`❌ Error fixing ${product.name}:`, error.message);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 MIGRATION SUMMARY\n');
    console.log(`Total products:        ${products.length}`);
    console.log(`✅ Fixed:              ${fixedCount}`);
    console.log(`⏭️  Already correct:    ${alreadyCorrectCount}`);
    console.log(`❌ Errors:             ${errors.length}\n`);

    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS:\n');
      errors.forEach((err, index) => {
        console.log(`${index + 1}. Product: ${err.product} (${err.id})`);
        console.log(`   Error: ${err.error}\n`);
      });
    }

    if (fixedCount > 0) {
      console.log('✅ Migration completed successfully!');
      console.log('   You can now reload your frontend and images should load.\n');
    } else {
      console.log('ℹ️  All products already have correct paths.\n');
    }

    console.log('='.repeat(60) + '\n');

    // Close database connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Verify migration (dry run)
 */
async function verifyMigration() {
  try {
    console.log('\n🔍 DRY RUN - Checking what would be changed...\n');
    console.log('='.repeat(60) + '\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products\n`);

    let needsFixCount = 0;

    for (const product of products) {
      const originalPath = product.images[0];
      const newPath = convertPathToPublicUrl(originalPath);

      if (newPath !== originalPath) {
        needsFixCount++;
        console.log(`🔄 Would fix: ${product.name}`);
        console.log(`   Before: ${originalPath.substring(0, 60)}...`);
        console.log(`   After:  ${newPath}\n`);
      } else {
        console.log(`✅ OK: ${product.name}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 ${needsFixCount} out of ${products.length} products need fixing\n`);

    if (needsFixCount > 0) {
      console.log('💡 To apply fixes, run: node scripts/fixImagePaths.js --fix\n');
    } else {
      console.log('✅ All products have correct paths!\n');
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--fix')) {
    // Run migration
    fixAllProductPaths();
  } else if (args.includes('--verify') || args.length === 0) {
    // Run dry run (default)
    verifyMigration();
  } else if (args.includes('--help')) {
    // Show help
    console.log('\n📖 Fix Image Paths - Migration Script\n');
    console.log('Usage:');
    console.log('  node scripts/fixImagePaths.js              # Dry run (preview changes)');
    console.log('  node scripts/fixImagePaths.js --verify     # Dry run (preview changes)');
    console.log('  node scripts/fixImagePaths.js --fix        # Apply fixes to database');
    console.log('  node scripts/fixImagePaths.js --help       # Show this help\n');
    console.log('Description:');
    console.log('  Converts absolute Windows paths to Nginx-compatible public URLs');
    console.log('  Example: C:/Users/.../uploads/products/image.jpg');
    console.log('           -> /static/uploads/products/image.jpg\n');
    process.exit(0);
  } else {
    console.error('❌ Unknown argument. Use --help for usage information.');
    process.exit(1);
  }
}

module.exports = { fixAllProductPaths, verifyMigration, convertPathToPublicUrl };
