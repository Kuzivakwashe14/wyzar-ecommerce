// backend/utils/encryption.js
const crypto = require('crypto');

/**
 * AES-256-GCM Encryption Utility
 * Uses authenticated encryption to protect sensitive data
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Derives a key from the encryption secret using PBKDF2
 * @param {string} secret - The encryption secret from environment variable
 * @param {Buffer} salt - The salt for key derivation
 * @returns {Buffer} - The derived key
 */
const deriveKey = (secret, salt) => {
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha256');
};

/**
 * Encrypts a string value
 * @param {string} text - The plaintext to encrypt
 * @returns {string} - The encrypted text in format: salt.iv.tag.encryptedData (all hex)
 */
const encrypt = (text) => {
  if (!text) return text; // Don't encrypt null/undefined/empty

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from secret
  const key = deriveKey(encryptionKey, salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get the auth tag
  const tag = cipher.getAuthTag();

  // Return format: salt.iv.tag.encrypted (all in hex)
  return `${salt.toString('hex')}.${iv.toString('hex')}.${tag.toString('hex')}.${encrypted}`;
};

/**
 * Decrypts an encrypted string
 * @param {string} encryptedText - The encrypted text in format: salt.iv.tag.encryptedData
 * @returns {string} - The decrypted plaintext
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText; // Don't decrypt null/undefined/empty

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }

  try {
    // Split the encrypted text into components
    const parts = encryptedText.split('.');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted text format');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    // Derive the same key
    const key = deriveKey(encryptionKey, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Generates a secure random encryption key
 * Use this to generate your ENCRYPTION_KEY for .env
 * @returns {string} - A secure random key in hex format
 */
const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash sensitive data (one-way, for data that doesn't need to be decrypted)
 * @param {string} data - The data to hash
 * @returns {string} - The hashed data
 */
const hash = (data) => {
  if (!data) return data;
  return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
  hash
};
