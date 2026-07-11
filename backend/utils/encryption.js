const crypto = require('crypto');

// 256-bit encryption key (32 bytes)
// In production, this MUST come from an environment variable!
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Default only for tests/dev fallback
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16 bytes

/**
 * Encrypts a string symmetrically.
 * @param {string} text - The text to encrypt
 * @returns {string} - The IV and encrypted data separated by a colon
 */
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts a symmetrically encrypted string.
 * @param {string} text - The encrypted text (format: iv:encryptedData)
 * @returns {string} - The decrypted text
 */
function decrypt(text) {
  if (!text) return null;
  const textParts = text.split(':');
  if (textParts.length !== 2) return null;
  
  try {
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt
};
