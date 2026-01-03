/**
 * L2 Vault - QR Sync Module
 * Secure credential transfer via QR codes
 */

// QR generation uses external library (qrcode.js)
// QR scanning uses getUserMedia + jsQR

const CHUNK_SIZE = 500; // Max bytes per QR code
const VERSION_PREFIX = 'L2V1:'; // Version identifier

/**
 * Encode credentials for QR transfer
 * @param {Array} credentials - Array of decrypted credentials
 * @param {string} transferPassword - Password to encrypt transfer data
 * @returns {Promise<string[]>} Array of QR payload strings
 */
export async function encodeForQR(credentials, transferPassword) {
    // Prepare minimal transfer data
    const transferData = credentials.map(cred => ({
        t: cred.title,           // title
        u: cred.username || '',  // username  
        p: cred.password,        // password (will be encrypted)
        c: cred.category || '',  // category
        n: cred.notes || ''      // notes
    }));

    const jsonData = JSON.stringify(transferData);

    // Encrypt the data with transfer password
    const encryptedData = await encryptTransferData(jsonData, transferPassword);

    // Base64 encode for QR
    const base64Data = btoa(encryptedData);

    // Split into chunks if necessary
    const chunks = splitIntoChunks(base64Data, CHUNK_SIZE);

    // Add headers to each chunk
    return chunks.map((chunk, index) =>
        `${VERSION_PREFIX}${index + 1}/${chunks.length}:${chunk}`
    );
}

/**
 * Decode credentials from QR payloads
 * @param {string[]} payloads - Array of scanned QR payloads
 * @param {string} transferPassword - Password to decrypt
 * @returns {Promise<Array>} Decoded credentials
 */
export async function decodeFromQR(payloads, transferPassword) {
    // Sort and validate chunks
    const sortedPayloads = sortAndValidateChunks(payloads);

    // Combine base64 data
    const base64Data = sortedPayloads.map(p => {
        const colonIndex = p.indexOf(':', VERSION_PREFIX.length);
        return p.substring(colonIndex + 1);
    }).join('');

    // Decode base64
    const encryptedData = atob(base64Data);

    // Decrypt with transfer password
    const jsonData = await decryptTransferData(encryptedData, transferPassword);

    // Parse and expand to full credential format
    const transferData = JSON.parse(jsonData);

    return transferData.map((item, index) => ({
        id: Date.now() + index,
        title: item.t,
        username: item.u,
        password: item.p,
        category: item.c,
        notes: item.n,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }));
}

/**
 * Encrypt data for transfer using Web Crypto
 */
async function encryptTransferData(data, password) {
    // Derive key from password
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive AES key
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );

    // Encrypt
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoder.encode(data)
    );

    // Combine salt + iv + ciphertext
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to string
    return String.fromCharCode(...result);
}

/**
 * Decrypt transfer data
 */
async function decryptTransferData(encryptedString, password) {
    // Convert string back to bytes
    const data = new Uint8Array(encryptedString.length);
    for (let i = 0; i < encryptedString.length; i++) {
        data[i] = encryptedString.charCodeAt(i);
    }

    // Extract salt, iv, ciphertext
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const ciphertext = data.slice(28);

    // Derive key
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Split data into chunks
 */
function splitIntoChunks(data, chunkSize) {
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
}

/**
 * Sort and validate QR chunks
 */
function sortAndValidateChunks(payloads) {
    // Parse chunk info
    const parsed = payloads.map(p => {
        if (!p.startsWith(VERSION_PREFIX)) {
            throw new Error('Invalid QR code format');
        }
        const match = p.match(/^L2V1:(\d+)\/(\d+):/);
        if (!match) throw new Error('Invalid chunk header');
        return {
            index: parseInt(match[1]),
            total: parseInt(match[2]),
            payload: p
        };
    });

    // Validate completeness
    const total = parsed[0].total;
    if (parsed.length !== total) {
        throw new Error(`Missing chunks: got ${parsed.length}, expected ${total}`);
    }

    // Sort by index
    parsed.sort((a, b) => a.index - b.index);

    return parsed.map(p => p.payload);
}

/**
 * Generate QR code data URL using canvas
 * @param {string} data - Data to encode
 * @param {number} size - QR code size in pixels
 * @returns {Promise<string>} Data URL of QR code image
 */
export async function generateQRDataURL(data, size = 256) {
    // This requires a QR library - using dynamic import
    try {
        // Try to use QRCode library if available
        if (typeof QRCode !== 'undefined') {
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, data, { width: size, margin: 2 });
            return canvas.toDataURL('image/png');
        }
    } catch (e) {
        console.warn('QR generation library not available');
    }

    // Fallback: return data as text (UI should handle this)
    return `data:text/plain;base64,${btoa(data)}`;
}

/**
 * Scan QR code from camera
 * @param {HTMLVideoElement} video - Video element with camera stream
 * @returns {Promise<string>} Decoded QR content
 */
export async function scanQRFromVideo(video) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        const scan = () => {
            if (video.paused || video.ended) {
                reject(new Error('Video stopped'));
                return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Try to use jsQR if available
            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, canvas.width, canvas.height);
                if (code) {
                    resolve(code.data);
                    return;
                }
            }

            // Continue scanning
            requestAnimationFrame(scan);
        };

        scan();
    });
}

/**
 * Request camera access for QR scanning
 * @returns {Promise<MediaStream>}
 */
export async function requestCameraAccess() {
    return navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
    });
}

/**
 * Stop camera stream
 * @param {MediaStream} stream 
 */
export function stopCameraStream(stream) {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}
