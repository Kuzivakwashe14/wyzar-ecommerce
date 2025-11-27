// scripts/backupImages.js
// Backup uploaded images to a zip file

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { getStoragePath, getStorageStats } = require('../config/localStorage');

/**
 * Create a backup of all uploaded images
 */
async function backupImages() {
  console.log('🔄 Starting image backup...\n');

  // Get storage stats
  const stats = getStorageStats();
  console.log('📊 Storage Statistics:');
  console.log(`   Products: ${stats.products.files} files (${stats.products.size})`);
  console.log(`   Verification: ${stats.verification.files} files (${stats.verification.size})`);
  console.log(`   Total Size: ${stats.total.size}\n`);

  // Create backup directory if it doesn't exist
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Generate backup filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const backupFilename = `wyzar-images-backup-${timestamp}.zip`;
  const backupPath = path.join(backupDir, backupFilename);

  // Create write stream for zip file
  const output = fs.createWriteStream(backupPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  // Pipe archive to file
  archive.pipe(output);

  // Add uploads directory to archive
  const uploadsDir = getStoragePath().replace(/\\/g, '/').split('/').slice(0, -1).join('/');
  archive.directory(uploadsDir, 'uploads');

  // Finalize the archive
  await archive.finalize();

  // Wait for output stream to finish
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
      console.log(`✅ Backup completed successfully!`);
      console.log(`   File: ${backupFilename}`);
      console.log(`   Size: ${sizeMB} MB`);
      console.log(`   Location: ${backupPath}\n`);
      resolve(backupPath);
    });

    output.on('error', (err) => {
      console.error('❌ Backup failed:', err);
      reject(err);
    });
  });
}

// Run backup if called directly
if (require.main === module) {
  backupImages()
    .then(() => {
      console.log('✅ Backup process completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Backup process failed:', err);
      process.exit(1);
    });
}

module.exports = { backupImages };
