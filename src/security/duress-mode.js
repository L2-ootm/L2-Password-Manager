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
 * - Can optionally wipe real data
 * - Can send encrypted backup to recovery email first
 * @param {Object} options
 */
export async function executeDuressActions(options = {}) {
    const { wipeData = false, sendBackup = false, recoveryEmail = null } = options;

    // TODO: In Phase 14, send encrypted backup to recovery email before wiping
    if (sendBackup && recoveryEmail) {
        console.log('Would send backup to:', recoveryEmail);
        // await sendEncryptedBackup(recoveryEmail);
    }

    // Optionally wipe real data
    if (wipeData) {
        console.log('Wiping real data...');
        // await wipeRealCredentials();
    }

    // Log duress activation (for later analysis)
    const duressLog = {
        timestamp: Date.now(),
        location: null, // Could add geolocation if permitted
        wiped: wipeData,
        backupSent: sendBackup
    };

    const logs = JSON.parse(localStorage.getItem('duressLogs') || '[]');
    logs.push(duressLog);
    localStorage.setItem('duressLogs', JSON.stringify(logs));

    return true;
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
