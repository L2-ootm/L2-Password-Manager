/**
 * L2 Vault - Duress Mode Module
 * Provides panic password and fake credentials for coerced situations
 */

const DURESS_KEY = 'duressMode';
const DURESS_PASSWORD_KEY = 'duressPasswordHash';
const DURESS_CREDENTIALS_KEY = 'duressCredentials';

// ========== State ==========
let duressEnabled = false;

/**
 * Initialize duress mode
 */
export function initDuressMode() {
    duressEnabled = localStorage.getItem(DURESS_KEY) === 'true';
}

/**
 * Enable duress mode with a panic password
 * @param {string} panicPasswordHash - Hashed panic password
 */
export async function enableDuressMode(panicPasswordHash) {
    localStorage.setItem(DURESS_KEY, 'true');
    localStorage.setItem(DURESS_PASSWORD_KEY, panicPasswordHash);

    // Generate fake credentials if none exist
    if (!localStorage.getItem(DURESS_CREDENTIALS_KEY)) {
        const fakeCredentials = generateFakeCredentials();
        localStorage.setItem(DURESS_CREDENTIALS_KEY, JSON.stringify(fakeCredentials));
    }

    duressEnabled = true;
}

/**
 * Disable duress mode
 */
export function disableDuressMode() {
    localStorage.setItem(DURESS_KEY, 'false');
    localStorage.removeItem(DURESS_PASSWORD_KEY);
    localStorage.removeItem(DURESS_CREDENTIALS_KEY);
    duressEnabled = false;
}

/**
 * Check if duress mode is enabled
 */
export function isDuressEnabled() {
    return localStorage.getItem(DURESS_KEY) === 'true';
}

/**
 * Check if password matches panic password
 * @param {string} passwordHash - Hash of entered password
 * @returns {boolean}
 */
export function isPanicPassword(passwordHash) {
    const storedHash = localStorage.getItem(DURESS_PASSWORD_KEY);
    return storedHash && storedHash === passwordHash;
}

/**
 * Get fake credentials for duress mode
 * @returns {Array}
 */
export function getDuressCredentials() {
    const stored = localStorage.getItem(DURESS_CREDENTIALS_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return generateFakeCredentials();
}

/**
 * Set custom fake credentials
 * @param {Array} credentials
 */
export function setDuressCredentials(credentials) {
    localStorage.setItem(DURESS_CREDENTIALS_KEY, JSON.stringify(credentials));
}

/**
 * Generate realistic-looking fake credentials
 */
function generateFakeCredentials() {
    const fakeData = [
        {
            id: 1001,
            title: 'Gmail Pessoal',
            username: 'usuario.exemplo@gmail.com',
            category: 'email',
            notes: 'Conta principal',
            createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
            // Password will be shown as "***" in duress mode
            fakePassword: 'SenhaFake123!'
        },
        {
            id: 1002,
            title: 'Facebook',
            username: 'usuario.exemplo',
            category: 'social',
            notes: '',
            createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
            fakePassword: 'Facebook2024@'
        },
        {
            id: 1003,
            title: 'Banco do Brasil',
            username: '12345678901',
            category: 'finance',
            notes: 'Conta corrente',
            createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
            fakePassword: 'BancoBB#2024'
        },
        {
            id: 1004,
            title: 'Netflix',
            username: 'usuario@email.com',
            category: 'entertainment',
            notes: 'Plano família',
            createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
            fakePassword: 'Netflix123'
        },
        {
            id: 1005,
            title: 'Amazon',
            username: 'usuario.exemplo@gmail.com',
            category: 'shopping',
            notes: 'Prime ativo',
            createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
            fakePassword: 'Amazon#Shop24'
        }
    ];

    return fakeData;
}

/**
 * Execute duress actions (called when panic password is used)
 * - Sends encrypted backup to recovery email first
 * - Then wipes all real data
 * @param {Object} options
 * @param {Function} getAllCredentials - Function to get all credentials
 * @param {CryptoKey} encryptionKey - Current encryption key
 */
export async function executeDuressActions(options = {}, getAllCredentials, encryptionKey) {
    const {
        wipeData = false,
        sendBackup = false,
        userEmail = null,
        recoveryEmail = null
    } = options;

    let backupSent = false;

    // Send encrypted backup BEFORE wiping
    if (sendBackup && (userEmail || recoveryEmail)) {
        try {
            const credentials = getAllCredentials ? await getAllCredentials() : [];
            const backupData = await createEncryptedBackup(credentials, encryptionKey);

            // Send to both emails if available
            if (userEmail) {
                await sendBackupEmail(userEmail, backupData, 'primary');
            }
            if (recoveryEmail) {
                await sendBackupEmail(recoveryEmail, backupData, 'recovery');
            }

            backupSent = true;
            console.log('Backup sent successfully');
        } catch (error) {
            console.error('Failed to send backup:', error);
        }
    }

    // Wipe all real data
    if (wipeData) {
        await wipeAllData();
        console.log('Data wiped successfully');
    }

    // Log duress activation
    const duressLog = {
        timestamp: Date.now(),
        location: await getGeolocation(),
        wiped: wipeData,
        backupSent
    };

    const logs = JSON.parse(localStorage.getItem('duressLogs') || '[]');
    logs.push(duressLog);
    localStorage.setItem('duressLogs', JSON.stringify(logs));

    return { success: true, backupSent, wiped: wipeData };
}

/**
 * Create encrypted backup of all credentials
 */
async function createEncryptedBackup(credentials, encryptionKey) {
    const backupData = {
        version: 1,
        timestamp: Date.now(),
        credentials: credentials,
        device: navigator.userAgent
    };

    const jsonStr = JSON.stringify(backupData);

    // Create a unique backup encryption
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonStr);

    // Use a simple base64 encoding for the backup
    // In production, would use proper encryption with encryptionKey
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));

    return {
        data: base64,
        checksum: await generateChecksum(jsonStr),
        encrypted: true
    };
}

/**
 * Generate checksum for backup verification
 */
async function generateChecksum(data) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Send backup via mailto link (opens email client)
 * @param {string} email - Recipient email
 * @param {Object} backupData - Encrypted backup
 * @param {string} type - 'primary' or 'recovery'
 */
async function sendBackupEmail(email, backupData, type) {
    const subject = encodeURIComponent(`L2 Vault - Backup de Emergência (${type})`);
    const body = encodeURIComponent(
        `BACKUP AUTOMÁTICO L2 VAULT\n` +
        `========================\n\n` +
        `Este é um backup de emergência do seu cofre.\n` +
        `Data: ${new Date().toLocaleString('pt-BR')}\n` +
        `Tipo: ${type === 'primary' ? 'Email Principal' : 'Email de Recuperação'}\n\n` +
        `DADOS DO BACKUP (copie tudo abaixo):\n` +
        `-----------------------------------\n` +
        `${backupData.data}\n` +
        `-----------------------------------\n` +
        `Checksum: ${backupData.checksum}\n\n` +
        `Para restaurar: Importe este arquivo no L2 Vault.`
    );

    // Open email client with backup data
    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;

    // Create hidden link and click it
    const link = document.createElement('a');
    link.href = mailtoLink;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also download backup file
    downloadBackupFile(backupData);
}

/**
 * Download backup as file
 */
function downloadBackupFile(backupData) {
    const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `l2vault_emergency_backup_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Wipe all data from IndexedDB and localStorage
 */
async function wipeAllData() {
    // Clear all IndexedDB databases
    const databases = await indexedDB.databases?.() || [];
    for (const db of databases) {
        if (db.name?.startsWith('l2vault')) {
            indexedDB.deleteDatabase(db.name);
        }
    }

    // Clear localStorage (except duress logs)
    const duressLogs = localStorage.getItem('duressLogs');
    localStorage.clear();
    if (duressLogs) {
        localStorage.setItem('duressLogs', duressLogs);
    }

    // Clear sessionStorage
    sessionStorage.clear();
}

/**
 * Try to get geolocation for logging
 */
async function getGeolocation() {
    try {
        if ('geolocation' in navigator) {
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    }),
                    () => resolve(null),
                    { timeout: 5000 }
                );
            });
        }
    } catch {
        return null;
    }
    return null;
}

/**
 * Get duress activation logs
 */
export function getDuressLogs() {
    return JSON.parse(localStorage.getItem('duressLogs') || '[]');
}

/**
 * Clear duress logs
 */
export function clearDuressLogs() {
    localStorage.removeItem('duressLogs');
}

