// scripts/cleanupOrphanedImages.js
// Remove images that are no longer referenced in the database

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const User = require('../models/User');
const { getStoragePath } = require('../config/localStorage');

require('dotenv').config();

/**
 * Find orphaned product images
 */
async function findOrphanedProductImages() {
  console.log('🔍 Scanning for orphaned product images...\n');

  const productsDir = getStoragePath('products');

  // Get all image files from disk
  const filesOnDisk = fs.readdirSync(productsDir)
    .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
    .map(file => path.join(productsDir, file));

  console.log(`📁 Found ${filesOnDisk.length} images on disk`);

  // Get all image paths from database
  const products = await Product.find({}).select('images');
  const imagesInDB = [];

  products.forEach(product => {
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(imgPath => {
        // Handle both full paths and relative paths
        const fullPath = imgPath.includes('uploads')
          ? path.join(__dirname, '..', imgPath.replace(/\\/g, '/'))
          : imgPath;
        imagesInDB.push(fullPath);
      });
    }
  });

  console.log(`💾 Found ${imagesInDB.length} images in database`);

  // Find orphaned files (on disk but not in DB)
  const orphanedFiles = filesOnDisk.filter(file => !imagesInDB.includes(file));

  console.log(`🗑️  Found ${orphanedFiles.length} orphaned images\n`);

  return orphanedFiles;
}

/**
 * Find orphaned verification documents
 */
async function findOrphanedVerificationDocs() {
  console.log('🔍 Scanning for orphaned verification documents...\n');

  const verificationDir = getStoragePath('verification');

  const filesOnDisk = fs.readdirSync(verificationDir)
    .filter(file => /\.(jpg|jpeg|png|pdf)$/i.test(file))
    .map(file => path.join(verificationDir, file));

  console.log(`📁 Found ${filesOnDisk.length} verification documents on disk`);

  // Get all verification docs from database
  const users = await User.find({ 'sellerDetails.verificationDocument': { $exists: true } })
    .select('sellerDetails.verificationDocument');

  const docsInDB = users
    .map(user => user.sellerDetails?.verificationDocument)
    .filter(Boolean)
    .map(docPath => {
      const fullPath = docPath.includes('uploads')
        ? path.join(__dirname, '..', docPath.replace(/\\/g, '/'))
        : docPath;
      return fullPath;
    });

  console.log(`💾 Found ${docsInDB.length} verification documents in database`);

  const orphanedDocs = filesOnDisk.filter(file => !docsInDB.includes(file));

  console.log(`🗑️  Found ${orphanedDocs.length} orphaned verification documents\n`);

  return orphanedDocs;
}

/**
 * Delete orphaned files
 */
async function deleteOrphanedFiles(files, dryRun = true) {
  if (files.length === 0) {
    console.log('✅ No orphaned files to delete\n');
    return;
  }

  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No files will be deleted\n');
    console.log('Files that would be deleted:');
    files.forEach((file, index) => {
      const sizeMB = (fs.statSync(file).size / (1024 * 1024)).toFixed(2);
      console.log(`   ${index + 1}. ${path.basename(file)} (${sizeMB} MB)`);
    });
    console.log(`\n⚠️  To actually delete these files, run with --delete flag\n`);
    return;
  }

  console.log('🗑️  Deleting orphaned files...\n');

  let deletedCount = 0;
  let deletedSize = 0;

  for (const file of files) {
    try {
      const size = fs.statSync(file).size;
      fs.unlinkSync(file);
      deletedCount++;
      deletedSize += size;
      console.log(`   ✅ Deleted: ${path.basename(file)}`);
    } catch (error) {
      console.error(`   ❌ Failed to delete ${path.basename(file)}:`, error.message);
    }
  }

  console.log(`\n✅ Deleted ${deletedCount} files (${(deletedSize / (1024 * 1024)).toFixed(2)} MB)\n`);
}

/**
 * Main cleanup function
 */
async function cleanup() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Check command line arguments
    const args = process.argv.slice(2);
    const deleteMode = args.includes('--delete');
    const dryRun = !deleteMode;

    // Find orphaned product images
    const orphanedImages = await findOrphanedProductImages();

    // Find orphaned verification documents
    const orphanedDocs = await findOrphanedVerificationDocs();

    // Combine all orphaned files
    const allOrphanedFiles = [...orphanedImages, ...orphanedDocs];

    // Delete or show what would be deleted
    await deleteOrphanedFiles(allOrphanedFiles, dryRun);

    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Cleanup completed\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { cleanup, findOrphanedProductImages, findOrphanedVerificationDocs };
