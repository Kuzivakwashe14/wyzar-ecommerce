// config/imagekit.js
// ImageKit configuration for cloud-based image management
// Uses @imagekit/nodejs v7+ SDK

const ImageKit = require('@imagekit/nodejs').default;
const fs = require('fs');

// Lazy-initialize ImageKit client (only when credentials are available)
let _client = null;

function getClient() {
  if (!_client && validateConfig()) {
    _client = new ImageKit({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY
    });
  }
  return _client;
}

/**
 * Upload file to ImageKit using v7 SDK
 * @param {String} filePath - Path to file on disk
 * @param {String} fileName - Name for the file
 * @param {String} folder - Folder path in ImageKit (e.g., 'products', 'verification')
 * @param {Object} options - Additional ImageKit upload options
 * @returns {Promise} ImageKit upload response
 */
async function uploadToImageKit(filePath, fileName, folder = 'products', options = {}) {
  try {
    const client = getClient();
    if (!client) {
      return { success: false, error: 'ImageKit client not initialized' };
    }

    // Use fs.createReadStream for file uploads (recommended by v7 SDK)
    const fileStream = fs.createReadStream(filePath);

    const response = await client.files.upload({
      file: fileStream,
      fileName: fileName,
      folder: `/${folder}`,
      useUniqueFileName: true,
      tags: options.tags || [],
    });

    return {
      success: true,
      url: response.url,
      fileId: response.fileId,
      name: response.name,
      filePath: response.filePath,
      thumbnailUrl: response.thumbnailUrl,
      size: response.size
    };
  } catch (error) {
    console.error('ImageKit upload error:', error.message || error);
    return {
      success: false,
      error: error.message || String(error)
    };
  }
}

/**
 * Delete file from ImageKit
 * @param {String} fileId - ImageKit file ID
 * @returns {Promise} Delete response
 */
async function deleteFromImageKit(fileId) {
  try {
    const client = getClient();
    if (!client) {
      return { success: false, error: 'ImageKit client not initialized' };
    }
    await client.files.delete(fileId);
    return { success: true };
  } catch (error) {
    console.error('ImageKit delete error:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Delete multiple files from ImageKit
 * @param {Array} fileIds - Array of ImageKit file IDs
 * @returns {Promise<Array>} Array of delete results
 */
async function deleteMultipleFromImageKit(fileIds) {
  try {
    const client = getClient();
    if (!client || !fileIds || fileIds.length === 0) {
      return { success: true };
    }
    await client.files.bulk.delete({ fileIds });
    return { success: true };
  } catch (error) {
    console.error('ImageKit bulk delete error:', error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Get ImageKit authentication parameters for client-side upload
 * Uses v7 SDK helper method
 * @returns {Object} Authentication parameters
 */
function getAuthenticationParameters() {
  const client = getClient();
  if (!client) {
    throw new Error('ImageKit client not initialized');
  }
  return client.helper.getAuthenticationParameters();
}

/**
 * Validate ImageKit configuration
 * @returns {Boolean} True if configured correctly
 */
function validateConfig() {
  const isConfigured = !!(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
  );

  if (!isConfigured) {
    console.warn('⚠️  ImageKit is not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your .env file');
  }

  return isConfigured;
}

module.exports = {
  getClient,
  uploadToImageKit,
  deleteFromImageKit,
  deleteMultipleFromImageKit,
  getAuthenticationParameters,
  validateConfig
};
