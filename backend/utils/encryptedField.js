// backend/utils/encryptedField.js
const { encrypt, decrypt } = require('./encryption');

/**
 * Mongoose plugin to automatically encrypt/decrypt specific fields
 * Usage: In your schema, add { type: String, encrypted: true } to fields you want encrypted
 */
function encryptedFieldsPlugin(schema, options = {}) {
  // Find all encrypted fields in the schema
  const encryptedFields = [];

  schema.eachPath((pathname, schemaType) => {
    if (schemaType.options && schemaType.options.encrypted) {
      encryptedFields.push(pathname);
    }
  });

  if (encryptedFields.length === 0) {
    return; // No encrypted fields, skip
  }

  // BEFORE SAVE: Encrypt fields
  schema.pre('save', function(next) {
    try {
      encryptedFields.forEach(field => {
        const value = this.get(field);

        // Only encrypt if field has a value and is modified
        if (value && this.isModified(field)) {
          // Check if already encrypted (to avoid double encryption)
          if (!isEncrypted(value)) {
            const encrypted = encrypt(value);
            this.set(field, encrypted);
          }
        }
      });
      next();
    } catch (error) {
      next(error);
    }
  });

  // AFTER FIND: Decrypt fields
  schema.post('find', function(docs) {
    if (!docs) return;

    docs.forEach(doc => {
      decryptDocument(doc, encryptedFields);
    });
  });

  schema.post('findOne', function(doc) {
    if (!doc) return;
    decryptDocument(doc, encryptedFields);
  });

  schema.post('findOneAndUpdate', function(doc) {
    if (!doc) return;
    decryptDocument(doc, encryptedFields);
  });

  // Method to get encrypted value (useful for queries)
  schema.methods.getEncryptedValue = function(field) {
    if (!encryptedFields.includes(field)) {
      throw new Error(`Field ${field} is not encrypted`);
    }
    return encrypt(this.get(field));
  };

  // Method to manually decrypt (if needed)
  schema.methods.decryptFields = function() {
    decryptDocument(this, encryptedFields);
  };
}

/**
 * Helper function to decrypt all encrypted fields in a document
 */
function decryptDocument(doc, fields) {
  if (!doc) return;

  fields.forEach(field => {
    const value = doc.get ? doc.get(field) : doc[field];

    if (value && isEncrypted(value)) {
      try {
        const decrypted = decrypt(value);
        if (doc.set) {
          doc.set(field, decrypted, { strict: false });
        } else {
          doc[field] = decrypted;
        }
      } catch (error) {
        console.error(`Error decrypting field ${field}:`, error.message);
        // Keep encrypted value if decryption fails
      }
    }
  });
}

/**
 * Check if a value is encrypted (simple heuristic)
 * Encrypted values follow the format: salt.iv.tag.encrypted (all hex)
 */
function isEncrypted(value) {
  if (typeof value !== 'string') return false;

  const parts = value.split('.');
  if (parts.length !== 4) return false;

  // Check if all parts are valid hex strings
  const hexRegex = /^[0-9a-f]+$/i;
  return parts.every(part => hexRegex.test(part));
}

module.exports = encryptedFieldsPlugin;
