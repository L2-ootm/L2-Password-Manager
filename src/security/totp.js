/**
 * L2 Vault - TOTP 2FA Generator Module
 * Generates Time-Based One-Time Passwords (RFC 6238)
 * Compatible with Google Authenticator, Authy, etc.
 */

// TOTP configuration
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = 'SHA-1';

// Storage key
const TOTP_ENTRIES_KEY = 'totpEntries';

/**
 * TOTP Entry structure:
 * {
 *   id: string,
 *   name: string,
 *   issuer: string,
 *   secret: string, // Base32 encoded
 *   algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512',
 *   digits: 6 | 8,
 *   period: number,
 *   createdAt: number
 * }
 */

/**
 * Get all TOTP entries
 * @returns {Array}
 */
export function getTOTPEntries() {
    const stored = localStorage.getItem(TOTP_ENTRIES_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Add a new TOTP entry
 * @param {Object} entry
 */
export function addTOTPEntry(entry) {
    const entries = getTOTPEntries();
    const newEntry = {
        id: crypto.randomUUID(),
        name: entry.name,
        issuer: entry.issuer || '',
        secret: entry.secret.replace(/\s/g, '').toUpperCase(),
        algorithm: entry.algorithm || 'SHA-1',
        digits: entry.digits || 6,
        period: entry.period || 30,
        createdAt: Date.now()
    };
    entries.push(newEntry);
    localStorage.setItem(TOTP_ENTRIES_KEY, JSON.stringify(entries));
    return newEntry;
}

/**
 * Remove a TOTP entry
 * @param {string} id
 */
export function removeTOTPEntry(id) {
    const entries = getTOTPEntries().filter(e => e.id !== id);
    localStorage.setItem(TOTP_ENTRIES_KEY, JSON.stringify(entries));
}

/**
 * Generate TOTP code for an entry
 * @param {Object} entry
 * @param {number} time - Optional timestamp (for testing)
 * @returns {Promise<string>}
 */
export async function generateTOTP(entry, time = null) {
    const timestamp = time || Math.floor(Date.now() / 1000);
    const counter = Math.floor(timestamp / (entry.period || TOTP_PERIOD));

    // Decode Base32 secret
    const secretBytes = base32Decode(entry.secret);

    // Generate HMAC
    const hmac = await generateHMAC(secretBytes, counter, entry.algorithm);

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
    ) % Math.pow(10, entry.digits || TOTP_DIGITS);

    return code.toString().padStart(entry.digits || TOTP_DIGITS, '0');
}

/**
 * Get remaining seconds for current TOTP code
 * @param {number} period
 * @returns {number}
 */
export function getTOTPRemainingSeconds(period = TOTP_PERIOD) {
    return period - (Math.floor(Date.now() / 1000) % period);
}

/**
 * Parse otpauth:// URI (from QR code)
 * @param {string} uri
 * @returns {Object|null}
 */
export function parseOTPAuthURI(uri) {
    try {
        const url = new URL(uri);
        if (url.protocol !== 'otpauth:') return null;

        const type = url.host; // 'totp' or 'hotp'
        if (type !== 'totp') return null;

        const label = decodeURIComponent(url.pathname.slice(1));
        const [issuer, name] = label.includes(':')
            ? label.split(':').map(s => s.trim())
            : ['', label];

        const params = new URLSearchParams(url.search);

        return {
            name: name || label,
            issuer: params.get('issuer') || issuer,
            secret: params.get('secret'),
            algorithm: params.get('algorithm') || 'SHA-1',
            digits: parseInt(params.get('digits')) || 6,
            period: parseInt(params.get('period')) || 30
        };
    } catch {
        return null;
    }
}

/**
 * Generate otpauth:// URI for exporting
 * @param {Object} entry
 * @returns {string}
 */
export function generateOTPAuthURI(entry) {
    const label = entry.issuer
        ? `${encodeURIComponent(entry.issuer)}:${encodeURIComponent(entry.name)}`
        : encodeURIComponent(entry.name);

    const params = new URLSearchParams({
        secret: entry.secret,
        issuer: entry.issuer || '',
        algorithm: entry.algorithm || 'SHA-1',
        digits: entry.digits || 6,
        period: entry.period || 30
    });

    return `otpauth://totp/${label}?${params.toString()}`;
}

// ========== Helper Functions ==========

/**
 * Base32 decode
 */
function base32Decode(input) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanInput = input.replace(/=+$/, '').toUpperCase();

    let bits = 0;
    let value = 0;
    let output = [];

    for (const char of cleanInput) {
        const idx = alphabet.indexOf(char);
        if (idx === -1) continue;

        value = (value << 5) | idx;
        bits += 5;

        if (bits >= 8) {
            bits -= 8;
            output.push((value >> bits) & 0xff);
        }
    }

    return new Uint8Array(output);
}

/**
 * Generate HMAC for TOTP
 */
async function generateHMAC(secret, counter, algorithm = 'SHA-1') {
    // Convert counter to 8-byte buffer (big endian)
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setBigUint64(0, BigInt(counter), false);

    // Map algorithm names
    const algoMap = {
        'SHA-1': 'SHA-1',
        'SHA-256': 'SHA-256',
        'SHA-512': 'SHA-512'
    };

    // Import key
    const key = await crypto.subtle.importKey(
        'raw',
        secret,
        { name: 'HMAC', hash: algoMap[algorithm] || 'SHA-1' },
        false,
        ['sign']
    );

    // Generate HMAC
    const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);

    return new Uint8Array(signature);
}

/**
 * Validate a TOTP secret (Base32)
 */
export function validateTOTPSecret(secret) {
    const cleanSecret = secret.replace(/\s/g, '').toUpperCase();
    const validChars = /^[A-Z2-7]+=*$/;
    return validChars.test(cleanSecret) && cleanSecret.length >= 16;
}
