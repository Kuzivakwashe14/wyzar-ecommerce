// config/localStorage.js
// Optimized local storage configuration for images

const path = require('path');
const fs = require('fs');

// Storage directories configuration
const STORAGE_CONFIG = {
  // Base upload directory
  baseDir: path.join(__dirname, '..', 'uploads'),

  // Subdirectories for different types of uploads
  products: 'products',
  verification: 'verification',
  temp: 'temp',

  // Maximum file sizes (in bytes)
  maxFileSize: {
    image: 10 * 1024 * 1024, // 10MB
    document: 5 * 1024 * 1024 // 5MB
  },

  // Allowed file types
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  allowedDocTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],

  // Image optimization settings
  optimization: {
    // Resize large images to max dimensions
    maxWidth: 1920,
    maxHeight: 1920,

    // JPEG quality (1-100)
    jpegQuality: 85,

    // PNG compression level (0-9)
    pngCompressionLevel: 8,

    // WebP quality (1-100)
    webpQuality: 85,

    // Create thumbnails
    createThumbnails: true,
    thumbnailSize: 400,

    // Convert to WebP for better compression
    convertToWebP: false // Set to true to auto-convert to WebP
  }
};

/**
 * Ensure all storage directories exist
 */
function ensureDirectoriesExist() {
  const dirs = [
    STORAGE_CONFIG.baseDir,
    path.join(STORAGE_CONFIG.baseDir, STORAGE_CONFIG.products),
    path.join(STORAGE_CONFIG.baseDir, STORAGE_CONFIG.products, 'thumbnails'),
    path.join(STORAGE_CONFIG.baseDir, STORAGE_CONFIG.verification),
    path.join(STORAGE_CONFIG.baseDir, STORAGE_CONFIG.temp)
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
}

/**
 * Get full path for a storage type
 */
function getStoragePath(type = 'products') {
  return path.join(STORAGE_CONFIG.baseDir, STORAGE_CONFIG[type] || type);
}

/**
 * Get public URL for an uploaded file
 * This returns /uploads path served by Express static middleware
 */
function getPublicUrl(filePath) {
  // Convert absolute path to relative URL
  // Example: uploads/products/image.jpg -> /uploads/products/image.jpg
  const relativePath = filePath.replace(/\\/g, '/').split('uploads/')[1];
  return `/uploads/${relativePath}`;
}

/**
 * Generate unique filename
 */
function generateFilename(userId, originalname) {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(originalname);
  return `${userId}-${timestamp}-${random}${ext}`;
}

/**
 * Delete a file safely
 */
function deleteFile(filePath) {
  return new Promise((resolve, reject) => {
    if (!filePath || !fs.existsSync(filePath)) {
      return resolve(false);
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return reject(err);
      }
      console.log(`✅ Deleted file: ${filePath}`);
      resolve(true);
    });
  });
}

/**
 * Delete multiple files
 */
async function deleteMultipleFiles(filePaths) {
  const deletePromises = filePaths.map(filePath => deleteFile(filePath));
  return Promise.allSettled(deletePromises);
}

/**
 * Get file size in MB
 */
function getFileSizeMB(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const stats = fs.statSync(filePath);
  return (stats.size / (1024 * 1024)).toFixed(2);
}

/**
 * Get directory size
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;

  if (!fs.existsSync(dirPath)) return 0;

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    }
  });

  return totalSize;
}

/**
 * Get storage statistics
 */
function getStorageStats() {
  const productsDir = getStoragePath('products');
  const verificationDir = getStoragePath('verification');

  return {
    products: {
      path: productsDir,
      size: (getDirectorySize(productsDir) / (1024 * 1024)).toFixed(2) + ' MB',
      files: fs.readdirSync(productsDir).length
    },
    verification: {
      path: verificationDir,
      size: (getDirectorySize(verificationDir) / (1024 * 1024)).toFixed(2) + ' MB',
      files: fs.readdirSync(verificationDir).length
    },
    total: {
      size: (getDirectorySize(STORAGE_CONFIG.baseDir) / (1024 * 1024)).toFixed(2) + ' MB'
    }
  };
}

// Initialize directories on module load
ensureDirectoriesExist();

module.exports = {
  STORAGE_CONFIG,
  ensureDirectoriesExist,
  getStoragePath,
  getPublicUrl,
  generateFilename,
  deleteFile,
  deleteMultipleFiles,
  getFileSizeMB,
  getDirectorySize,
  getStorageStats
};
