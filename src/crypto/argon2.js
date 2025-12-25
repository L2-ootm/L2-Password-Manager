/**
 * L2 Vault - Argon2id Key Derivation Module
 * Uses argon2-browser for secure password-based key derivation
 * 
 * Argon2id is the recommended algorithm combining:
 * - Argon2i (side-channel resistance)
 * - Argon2d (GPU resistance)
 */

// Import argon2 from CDN (loaded dynamically)
let argon2Module = null;

/**
 * Loads the Argon2 WASM module
 * @returns {Promise<void>}
 */
async function loadArgon2() {
    if (argon2Module) return;

    // Dynamic import from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/argon2-browser@1.18.0/dist/argon2-bundled.min.js';

    await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    argon2Module = window.argon2;
}

/**
 * Argon2id parameters (OWASP recommended for password storage)
 * These can be tuned based on device performance
 */
const ARGON2_CONFIG = {
    type: 2, // Argon2id
    timeCost: 3, // iterations
    memoryCost: 65536, // 64 MB
    parallelism: 4, // threads
    hashLen: 32, // 256 bits for AES-256
};

/**
 * Derives a 256-bit key from a password using Argon2id
 * @param {string} password - User's master password
 * @param {Uint8Array} salt - Random salt (should be stored with encrypted data)
 * @returns {Promise<Uint8Array>} - 32-byte derived key
 */
export async function deriveKey(password, salt) {
    await loadArgon2();

    const saltString = uint8ArrayToBase64(salt);

    try {
        const result = await argon2Module.hash({
            pass: password,
            salt: saltString,
            type: ARGON2_CONFIG.type,
            time: ARGON2_CONFIG.timeCost,
            mem: ARGON2_CONFIG.memoryCost,
            parallelism: ARGON2_CONFIG.parallelism,
            hashLen: ARGON2_CONFIG.hashLen,
        });

        return result.hash; // Uint8Array
    } catch (error) {
        console.error('Argon2 key derivation failed:', error);
        throw new Error('Falha na derivação de chave');
    }
}

/**
 * Verifies if a password matches a stored hash
 * @param {string} password - Password to verify
 * @param {Uint8Array} salt - Stored salt
 * @param {Uint8Array} storedHash - Stored hash to compare against
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, salt, storedHash) {
    const derivedHash = await deriveKey(password, salt);

    // Constant-time comparison to prevent timing attacks
    if (derivedHash.length !== storedHash.length) return false;

    let diff = 0;
    for (let i = 0; i < derivedHash.length; i++) {
        diff |= derivedHash[i] ^ storedHash[i];
    }

    return diff === 0;
}

/**
 * Creates a password hash for storage (first-time setup)
 * @param {string} password - User's master password
 * @returns {Promise<{hash: string, salt: string}>} - Base64 encoded hash and salt
 */
export async function createPasswordHash(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await deriveKey(password, salt);

    return {
        hash: uint8ArrayToBase64(hash),
        salt: uint8ArrayToBase64(salt),
    };
}

/**
 * Verifies a password against stored credentials
 * @param {string} password - Password to verify
 * @param {string} storedHash - Base64 encoded stored hash
 * @param {string} storedSalt - Base64 encoded stored salt
 * @returns {Promise<boolean>}
 */
export async function verifyStoredPassword(password, storedHash, storedSalt) {
    const salt = base64ToUint8Array(storedSalt);
    const hash = base64ToUint8Array(storedHash);

    return verifyPassword(password, salt, hash);
}

/**
 * Gets the derived key for encryption operations
 * @param {string} password - Master password
 * @param {string} storedSalt - Base64 encoded salt
 * @returns {Promise<Uint8Array>} - 32-byte key for AES
 */
export async function getEncryptionKey(password, storedSalt) {
    const salt = base64ToUint8Array(storedSalt);
    return deriveKey(password, salt);
}

// ========== Utility Functions ==========

function uint8ArrayToBase64(array) {
    let binary = '';
    for (let i = 0; i < array.length; i++) {
        binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
}

function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return array;
}
