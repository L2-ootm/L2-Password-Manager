/**
 * L2 Vault - Multi-Vault Manager
 * Supports multiple isolated vaults with separate passwords
 */

const VAULTS_META_KEY = 'l2vault_vaults_meta';
const CURRENT_VAULT_KEY = 'l2vault_current_vault';

/**
 * Vault metadata structure
 * {
 *   id: string,
 *   name: string,
 *   color: string,
 *   createdAt: number,
 *   isDefault: boolean,
 *   isDecoy: boolean // If true, this is a decoy vault
 * }
 */

// Current vault ID
let currentVaultId = 'default';

/**
 * Get all vault metadata
 */
export function getAllVaults() {
    try {
        const data = localStorage.getItem(VAULTS_META_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn('Failed to load vaults:', e);
    }

    // Default vault if none exist
    return [{
        id: 'default',
        name: 'Principal',
        color: '#D4AF37',
        createdAt: Date.now(),
        isDefault: true,
        isDecoy: false
    }];
}

/**
 * Save vault metadata
 */
function saveVaultsMeta(vaults) {
    try {
        localStorage.setItem(VAULTS_META_KEY, JSON.stringify(vaults));
    } catch (e) {
        console.error('Failed to save vaults:', e);
    }
}

/**
 * Get current vault ID
 */
export function getCurrentVaultId() {
    if (currentVaultId) return currentVaultId;

    try {
        const saved = localStorage.getItem(CURRENT_VAULT_KEY);
        if (saved) {
            currentVaultId = saved;
            return saved;
        }
    } catch (e) { }

    return 'default';
}

/**
 * Set current vault
 */
export function setCurrentVault(vaultId) {
    currentVaultId = vaultId;
    try {
        localStorage.setItem(CURRENT_VAULT_KEY, vaultId);
    } catch (e) { }
}

/**
 * Get vault by ID
 */
export function getVault(vaultId) {
    return getAllVaults().find(v => v.id === vaultId);
}

/**
 * Create a new vault
 */
export function createVault(name, options = {}) {
    const vaults = getAllVaults();

    const newVault = {
        id: `vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || `Cofre ${vaults.length + 1}`,
        color: options.color || generateVaultColor(vaults.length),
        createdAt: Date.now(),
        isDefault: false,
        isDecoy: options.isDecoy || false
    };

    vaults.push(newVault);
    saveVaultsMeta(vaults);

    return newVault;
}

/**
 * Delete a vault (cannot delete default)
 */
export function deleteVault(vaultId) {
    if (vaultId === 'default') {
        throw new Error('Não é possível excluir o cofre principal');
    }

    const vaults = getAllVaults().filter(v => v.id !== vaultId);
    saveVaultsMeta(vaults);

    // If deleting current vault, switch to default
    if (getCurrentVaultId() === vaultId) {
        setCurrentVault('default');
    }

    // Delete the vault's IndexedDB database
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(`l2vault_${vaultId}`);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Rename a vault
 */
export function renameVault(vaultId, newName) {
    const vaults = getAllVaults();
    const vault = vaults.find(v => v.id === vaultId);

    if (vault) {
        vault.name = newName;
        saveVaultsMeta(vaults);
    }

    return vault;
}

/**
 * Change vault color
 */
export function setVaultColor(vaultId, color) {
    const vaults = getAllVaults();
    const vault = vaults.find(v => v.id === vaultId);

    if (vault) {
        vault.color = color;
        saveVaultsMeta(vaults);
    }

    return vault;
}

/**
 * Get database name for a vault
 */
export function getVaultDbName(vaultId) {
    if (!vaultId || vaultId === 'default') {
        return 'L2VaultDB'; // Original DB name for backwards compatibility
    }
    return `l2vault_${vaultId}`;
}

/**
 * Generate a color for new vault based on index
 */
function generateVaultColor(index) {
    const colors = [
        '#D4AF37', // Gold (default)
        '#E53935', // Red
        '#8E24AA', // Purple
        '#1E88E5', // Blue
        '#43A047', // Green
        '#FB8C00', // Orange
        '#00ACC1', // Cyan
        '#F06292', // Pink
        '#7CB342', // Light Green
        '#5E35B1'  // Deep Purple
    ];

    return colors[index % colors.length];
}

/**
 * Get vault index (for swipe navigation)
 */
export function getVaultIndex(vaultId) {
    const vaults = getAllVaults();
    return vaults.findIndex(v => v.id === vaultId);
}

/**
 * Get next vault (for swipe right)
 */
export function getNextVault(currentId) {
    const vaults = getAllVaults();
    const currentIndex = vaults.findIndex(v => v.id === currentId);
    const nextIndex = (currentIndex + 1) % vaults.length;
    return vaults[nextIndex];
}

/**
 * Get previous vault (for swipe left)
 */
export function getPreviousVault(currentId) {
    const vaults = getAllVaults();
    const currentIndex = vaults.findIndex(v => v.id === currentId);
    const prevIndex = (currentIndex - 1 + vaults.length) % vaults.length;
    return vaults[prevIndex];
}

/**
 * Check if vault is a decoy
 */
export function isDecoyVault(vaultId) {
    const vault = getVault(vaultId);
    return vault?.isDecoy || false;
}

/**
 * Export vault metadata for backup
 */
export function exportVaultsMeta() {
    return getAllVaults();
}

/**
 * Import vault metadata from backup
 */
export function importVaultsMeta(vaults) {
    if (Array.isArray(vaults)) {
        saveVaultsMeta(vaults);
    }
}
