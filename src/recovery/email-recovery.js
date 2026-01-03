/**
 * L2 Vault - Email Recovery Module
 * Manages account emails and encrypted backup delivery
 * Phase 14 Implementation
 */

const EMAIL_CONFIG_KEY = 'emailConfig';
const RECOVERY_BACKUP_KEY = 'lastRecoveryBackup';

/**
 * Email configuration structure:
 * {
 *   primaryEmail: string,
 *   recoveryEmail: string,
 *   autoBackup: boolean,
 *   backupFrequency: 'daily' | 'weekly' | 'monthly',
 *   lastBackupSent: number
 * }
 */

/**
 * Get email configuration
 * @returns {Object}
 */
export function getEmailConfig() {
    const stored = localStorage.getItem(EMAIL_CONFIG_KEY);
    return stored ? JSON.parse(stored) : {
        primaryEmail: '',
        recoveryEmail: '',
        autoBackup: false,
        backupFrequency: 'weekly',
        lastBackupSent: null
    };
}

/**
 * Save email configuration
 * @param {Object} config
 */
export function saveEmailConfig(config) {
    const current = getEmailConfig();
    const updated = {
        ...current,
        ...config
    };
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(updated));
    return updated;
}

/**
 * Check if email is configured
 * @returns {boolean}
 */
export function isEmailConfigured() {
    const config = getEmailConfig();
    return !!(config.primaryEmail || config.recoveryEmail);
}

/**
 * Create encrypted backup payload
 * @param {Array} credentials - All credentials (encrypted)
 * @param {Object} settings - App settings
 * @returns {Promise<Object>}
 */
export async function createRecoveryBackup(credentials, settings) {
    const backupData = {
        version: 2,
        type: 'recovery',
        timestamp: Date.now(),
        credentials: credentials,
        settings: {
            theme: settings?.theme,
            autoLockTimeout: settings?.autoLockTimeout,
            clipboardTimeout: settings?.clipboardTimeout
        },
        device: navigator.userAgent,
        platform: navigator.platform
    };

    // Generate checksum
    const jsonStr = JSON.stringify(backupData);
    const checksum = await generateChecksum(jsonStr);

    // Encode for transfer
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonStr);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));

    return {
        data: base64,
        checksum,
        timestamp: Date.now(),
        format: 'l2vault-recovery-v2'
    };
}

/**
 * Send recovery backup via email (mailto link)
 * Also downloads backup file as failsafe
 * @param {Object} backup
 * @param {Object} options
 */
export async function sendRecoveryBackup(backup, options = {}) {
    const config = getEmailConfig();
    const emails = [];

    if (options.primaryEmail !== false && config.primaryEmail) {
        emails.push({ email: config.primaryEmail, type: 'primary' });
    }
    if (options.recoveryEmail !== false && config.recoveryEmail) {
        emails.push({ email: config.recoveryEmail, type: 'recovery' });
    }

    if (emails.length === 0) {
        throw new Error('No email configured');
    }

    // Send to each configured email
    for (const { email, type } of emails) {
        await openBackupEmail(email, backup, type);
    }

    // Download backup file as failsafe
    downloadBackupFile(backup);

    // Update last backup timestamp
    saveEmailConfig({ lastBackupSent: Date.now() });

    return { success: true, emailsSent: emails.length };
}

/**
 * Open mailto link with backup content
 */
async function openBackupEmail(email, backup, type) {
    const date = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const subject = encodeURIComponent(
        `L2 Vault - Backup de Recuperação [${date}]`
    );

    const body = encodeURIComponent(
        `═══════════════════════════════════════
     L2 VAULT - BACKUP DE RECUPERAÇÃO
═══════════════════════════════════════

📧 Tipo: ${type === 'primary' ? 'Email Principal' : 'Email de Recuperação'}
📅 Data: ${date}
🔒 Formato: ${backup.format}

═══════════════════════════════════════
         DADOS DO BACKUP
═══════════════════════════════════════

${backup.data}

═══════════════════════════════════════
         VERIFICAÇÃO
═══════════════════════════════════════

Checksum: ${backup.checksum}

═══════════════════════════════════════
         INSTRUÇÕES
═══════════════════════════════════════

1. Guarde este email em local seguro
2. Para restaurar: Abra L2 Vault > Configurações > Importar
3. Cole os dados do backup ou importe o arquivo .l2vault
4. A senha mestre original será necessária

⚠️ ATENÇÃO: Este backup contém dados criptografados.
Sem a senha mestre, não é possível acessar as credenciais.

═══════════════════════════════════════
`
    );

    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;

    // Open in new window/tab
    const link = document.createElement('a');
    link.href = mailtoLink;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Download backup as file
 */
function downloadBackupFile(backup) {
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `l2vault_recovery_${Date.now()}.l2vault`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate SHA-256 checksum
 */
async function generateChecksum(data) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Restore backup from recovery file
 * @param {string} base64Data
 * @returns {Object}
 */
export function parseRecoveryBackup(base64Data) {
    try {
        const decoded = atob(base64Data);
        const data = JSON.parse(decoded);

        if (!data.version || !data.credentials) {
            throw new Error('Invalid backup format');
        }

        return {
            success: true,
            data: data,
            credentialCount: data.credentials?.length || 0,
            timestamp: data.timestamp
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Check if auto-backup is due
 * @returns {boolean}
 */
export function isAutoBackupDue() {
    const config = getEmailConfig();
    if (!config.autoBackup || !isEmailConfigured()) {
        return false;
    }

    const lastBackup = config.lastBackupSent || 0;
    const now = Date.now();

    const intervals = {
        daily: 24 * 60 * 60 * 1000,
        weekly: 7 * 24 * 60 * 60 * 1000,
        monthly: 30 * 24 * 60 * 60 * 1000
    };

    const interval = intervals[config.backupFrequency] || intervals.weekly;
    return (now - lastBackup) >= interval;
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
