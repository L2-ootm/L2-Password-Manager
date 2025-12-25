/**
 * L2 Vault - IndexedDB Storage Module
 * Encrypted at-rest storage for credentials
 * Supports multiple isolated vaults
 */

import { getCurrentVaultId, getVaultDbName } from './vaults.js';

const DB_VERSION = 1;
const STORES = {
    AUTH: 'auth',
    CREDENTIALS: 'credentials',
    SETTINGS: 'settings'
};

// Map of vault ID to database instance
const dbInstances = new Map();

/**
 * Gets the database name for current vault
 */
function getDbName() {
    return getVaultDbName(getCurrentVaultId());
}

/**
 * Gets the current vault's database instance
 * @returns {IDBDatabase|null}
 */
function getDb() {
    return dbInstances.get(getDbName()) || null;
}

/**
 * Opens and initializes the IndexedDB database for current vault
 * @returns {Promise<IDBDatabase>}
 */
export async function initDatabase() {
    const dbName = getDbName();

    // Check if already open
    if (dbInstances.has(dbName)) {
        return dbInstances.get(dbName);
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, DB_VERSION);

        request.onerror = () => {
            reject(new Error('Falha ao abrir banco de dados'));
        };

        request.onsuccess = () => {
            const db = request.result;
            dbInstances.set(dbName, db);
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Auth store - master password hash and salt
            if (!database.objectStoreNames.contains(STORES.AUTH)) {
                database.createObjectStore(STORES.AUTH, { keyPath: 'key' });
            }

            // Credentials store - encrypted passwords
            if (!database.objectStoreNames.contains(STORES.CREDENTIALS)) {
                const credentialsStore = database.createObjectStore(STORES.CREDENTIALS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                credentialsStore.createIndex('title', 'title', { unique: false });
                credentialsStore.createIndex('category', 'category', { unique: false });
                credentialsStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Settings store
            if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
                database.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }
        };
    });
}

// ========== Auth Operations ==========

/**
 * Checks if a master password has been set
 * @returns {Promise<boolean>}
 */
export async function hasMasterPassword() {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.AUTH, 'readonly');
        const store = tx.objectStore(STORES.AUTH);
        const request = store.get('master');

        request.onsuccess = () => {
            resolve(!!request.result);
        };

        request.onerror = () => {
            reject(new Error('Erro ao verificar senha mestra'));
        };
    });
}

/**
 * Stores the master password hash and salt
 * @param {string} hash - Base64 encoded hash
 * @param {string} salt - Base64 encoded salt
 * @returns {Promise<void>}
 */
export async function storeMasterPassword(hash, salt) {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.AUTH, 'readwrite');
        const store = tx.objectStore(STORES.AUTH);

        const request = store.put({
            key: 'master',
            hash,
            salt,
            createdAt: Date.now()
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Erro ao salvar senha mestra'));
    });
}

/**
 * Gets the stored master password hash and salt
 * @returns {Promise<{hash: string, salt: string} | null>}
 */
export async function getMasterPasswordData() {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.AUTH, 'readonly');
        const store = tx.objectStore(STORES.AUTH);
        const request = store.get('master');

        request.onsuccess = () => {
            const result = request.result;
            if (result) {
                resolve({ hash: result.hash, salt: result.salt });
            } else {
                resolve(null);
            }
        };

        request.onerror = () => {
            reject(new Error('Erro ao obter dados de autenticação'));
        };
    });
}

// ========== Credential Operations ==========

/**
 * Adds a new credential to the database
 * @param {object} credential - Encrypted credential object
 * @returns {Promise<number>} - The ID of the new credential
 */
export async function addCredential(credential) {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.CREDENTIALS, 'readwrite');
        const store = tx.objectStore(STORES.CREDENTIALS);

        const data = {
            ...credential,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Erro ao adicionar credencial'));
    });
}

/**
 * Updates an existing credential
 * @param {object} credential - Credential object with id
 * @returns {Promise<void>}
 */
export async function updateCredential(credential) {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.CREDENTIALS, 'readwrite');
        const store = tx.objectStore(STORES.CREDENTIALS);

        const data = {
            ...credential,
            updatedAt: Date.now()
        };

        const request = store.put(data);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Erro ao atualizar credencial'));
    });
}

/**
 * Deletes a credential by ID
 * @param {number} id - Credential ID
 * @returns {Promise<void>}
 */
export async function deleteCredential(id) {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.CREDENTIALS, 'readwrite');
        const store = tx.objectStore(STORES.CREDENTIALS);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Erro ao excluir credencial'));
    });
}

/**
 * Gets a single credential by ID
 * @param {number} id - Credential ID
 * @returns {Promise<object | null>}
 */
export async function getCredential(id) {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.CREDENTIALS, 'readonly');
        const store = tx.objectStore(STORES.CREDENTIALS);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error('Erro ao obter credencial'));
    });
}

/**
 * Gets all credentials (encrypted)
 * @returns {Promise<object[]>}
 */
export async function getAllCredentials() {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.CREDENTIALS, 'readonly');
        const store = tx.objectStore(STORES.CREDENTIALS);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(new Error('Erro ao obter credenciais'));
    });
}

/**
 * Clears all credentials (for import or reset)
 * @returns {Promise<void>}
 */
export async function clearAllCredentials() {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.CREDENTIALS, 'readwrite');
        const store = tx.objectStore(STORES.CREDENTIALS);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Erro ao limpar credenciais'));
    });
}

// ========== Settings Operations ==========

/**
 * Gets a setting value
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if not found
 * @returns {Promise<any>}
 */
export async function getSetting(key, defaultValue = null) {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.SETTINGS, 'readonly');
        const store = tx.objectStore(STORES.SETTINGS);
        const request = store.get(key);

        request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.value : defaultValue);
        };

        request.onerror = () => {
            reject(new Error('Erro ao obter configuração'));
        };
    });
}

/**
 * Sets a setting value
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
    await initDatabase();

    return new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(STORES.SETTINGS);
        const request = store.put({ key, value });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Erro ao salvar configuração'));
    });
}

// ========== Export/Import ==========

/**
 * Exports all data for backup
 * @returns {Promise<object>} - All stored data
 */
export async function exportAllData() {
    await initDatabase();

    const credentials = await getAllCredentials();
    const settings = await new Promise((resolve, reject) => {
        const tx = getDb().transaction(STORES.SETTINGS, 'readonly');
        const store = tx.objectStore(STORES.SETTINGS);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(new Error('Erro ao exportar configurações'));
    });

    return {
        version: DB_VERSION,
        exportedAt: Date.now(),
        credentials,
        settings
    };
}

/**
 * Imports data from backup (replaces existing)
 * @param {object} data - Backup data
 * @returns {Promise<void>}
 */
export async function importAllData(data) {
    await initDatabase();

    // Clear existing credentials
    await clearAllCredentials();

    // Import credentials
    for (const credential of data.credentials || []) {
        const { id, ...credentialData } = credential;
        await addCredential(credentialData);
    }

    // Import settings
    for (const setting of data.settings || []) {
        await setSetting(setting.key, setting.value);
    }
}

/**
 * Completely wipes all data for current vault (factory reset)
 * @returns {Promise<void>}
 */
export async function wipeAllData() {
    const dbName = getDbName();

    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);

        request.onsuccess = () => {
            dbInstances.delete(dbName);
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Erro ao limpar dados'));
        };
    });
}

/**
 * Closes the current vault database
 */
export function closeDatabase() {
    const dbName = getDbName();
    const db = dbInstances.get(dbName);

    if (db) {
        db.close();
        dbInstances.delete(dbName);
    }
}

/**
 * Switch to a different vault's database
 * Closes current and opens new one
 */
export async function switchVaultDb() {
    // Close all open databases
    dbInstances.forEach((db, name) => {
        db.close();
    });
    dbInstances.clear();

    // Initialize the new vault's database
    return initDatabase();
}
