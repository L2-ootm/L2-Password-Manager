/**
 * L2 Vault - AES-256-GCM Encryption Module
 * Uses native Web Crypto API for maximum security
 */

/**
 * Encrypts data using AES-256-GCM
 * @param {string} plaintext - The text to encrypt
 * @param {CryptoKey} key - The AES key derived from master password
 * @returns {Promise<{ciphertext: string, iv: string}>} - Base64 encoded ciphertext and IV
 */
export async function encrypt(plaintext, key) {
  // Generate random 12-byte IV (recommended for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encode plaintext to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Encrypt
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128 // 128-bit authentication tag
    },
    key,
    data
  );
  
  // Convert to base64 for storage
  const ciphertext = arrayBufferToBase64(cipherBuffer);
  const ivBase64 = arrayBufferToBase64(iv);
  
  return {
    ciphertext,
    iv: ivBase64
  };
}

/**
 * Decrypts data using AES-256-GCM
 * @param {string} ciphertext - Base64 encoded ciphertext
 * @param {string} ivBase64 - Base64 encoded IV
 * @param {CryptoKey} key - The AES key derived from master password
 * @returns {Promise<string>} - Decrypted plaintext
 */
export async function decrypt(ciphertext, ivBase64, key) {
  // Convert from base64
  const cipherBuffer = base64ToArrayBuffer(ciphertext);
  const iv = base64ToArrayBuffer(ivBase64);
  
  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    key,
    cipherBuffer
  );
  
  // Decode to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Derives an AES-256 key from raw key material (from Argon2)
 * @param {Uint8Array} keyMaterial - 32-byte key from Argon2id
 * @returns {Promise<CryptoKey>} - AES-GCM CryptoKey
 */
export async function importKey(keyMaterial) {
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates a cryptographically secure random password
 * @param {number} length - Password length (default 20)
 * @param {object} options - Character set options
 * @returns {string} - Generated password
 */
export function generatePassword(length = 20, options = {}) {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;
  
  let charset = '';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (numbers) charset += '0123456789';
  if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (!charset) {
    charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }
  
  const randomValues = crypto.getRandomValues(new Uint32Array(length));
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  return password;
}

// ========== Utility Functions ==========

/**
 * Converts ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates a random salt for Argon2
 * @param {number} length - Salt length in bytes (default 16)
 * @returns {Uint8Array}
 */
export function generateSalt(length = 16) {
  return crypto.getRandomValues(new Uint8Array(length));
}
