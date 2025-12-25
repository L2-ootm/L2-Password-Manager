/**
 * L2 Vault - Security Dashboard Module
 * Analyzes password health and security issues
 */

import { calculateStrength, getEntropyBits } from '../crypto/generator.js';

// Configuration
const CONFIG = {
    WEAK_THRESHOLD: 50,           // Below 50% is weak
    OLD_DAYS_THRESHOLD: 90,       // Older than 90 days
    HIBP_API_URL: 'https://api.pwnedpasswords.com/range/',
    DUPLICATE_WARNING: true
};

/**
 * Analyze all credentials for security issues
 * @param {Array} credentials - Array of decrypted credentials
 * @returns {Object} Security analysis report
 */
export function analyzeSecurityHealth(credentials) {
    const report = {
        total: credentials.length,
        score: 100,
        issues: [],
        weak: [],
        duplicates: [],
        old: [],
        reused: [],
        breached: [],
        summary: {
            weakCount: 0,
            duplicateCount: 0,
            oldCount: 0,
            breachedCount: 0
        }
    };

    if (credentials.length === 0) {
        return report;
    }

    // Analyze weak passwords
    const weakPasswords = findWeakPasswords(credentials);
    report.weak = weakPasswords;
    report.summary.weakCount = weakPasswords.length;

    // Find duplicates
    const duplicates = findDuplicatePasswords(credentials);
    report.duplicates = duplicates;
    report.summary.duplicateCount = duplicates.length;

    // Find old passwords
    const oldPasswords = findOldPasswords(credentials);
    report.old = oldPasswords;
    report.summary.oldCount = oldPasswords.length;

    // Calculate overall score
    report.score = calculateSecurityScore(report, credentials.length);

    // Generate issues list
    report.issues = generateIssuesList(report);

    return report;
}

/**
 * Find passwords below strength threshold
 */
function findWeakPasswords(credentials) {
    const weak = [];

    credentials.forEach(cred => {
        if (cred.password) {
            const strength = calculateStrength(cred.password);
            if (strength < CONFIG.WEAK_THRESHOLD) {
                weak.push({
                    id: cred.id,
                    title: cred.title,
                    strength: strength,
                    severity: strength < 25 ? 'critical' : 'warning'
                });
            }
        }
    });

    // Sort by strength (weakest first)
    weak.sort((a, b) => a.strength - b.strength);

    return weak;
}

/**
 * Find duplicate/reused passwords
 */
function findDuplicatePasswords(credentials) {
    const passwordMap = new Map();
    const duplicates = [];

    credentials.forEach(cred => {
        if (cred.password) {
            const existing = passwordMap.get(cred.password);
            if (existing) {
                existing.push({
                    id: cred.id,
                    title: cred.title
                });
            } else {
                passwordMap.set(cred.password, [{
                    id: cred.id,
                    title: cred.title
                }]);
            }
        }
    });

    // Filter to only groups with duplicates
    passwordMap.forEach((group, password) => {
        if (group.length > 1) {
            duplicates.push({
                count: group.length,
                credentials: group,
                severity: group.length > 3 ? 'critical' : 'warning'
            });
        }
    });

    // Sort by count (most duplicated first)
    duplicates.sort((a, b) => b.count - a.count);

    return duplicates;
}

/**
 * Find passwords older than threshold
 */
function findOldPasswords(credentials) {
    const old = [];
    const now = Date.now();
    const thresholdMs = CONFIG.OLD_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;

    credentials.forEach(cred => {
        const updatedAt = cred.updatedAt || cred.createdAt;
        if (updatedAt) {
            const ageMs = now - updatedAt;
            const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

            if (ageDays > CONFIG.OLD_DAYS_THRESHOLD) {
                old.push({
                    id: cred.id,
                    title: cred.title,
                    ageDays: ageDays,
                    severity: ageDays > 180 ? 'critical' : 'warning'
                });
            }
        }
    });

    // Sort by age (oldest first)
    old.sort((a, b) => b.ageDays - a.ageDays);

    return old;
}

/**
 * Calculate overall security score (0-100)
 */
function calculateSecurityScore(report, total) {
    if (total === 0) return 100;

    let deductions = 0;

    // Weak passwords: up to 40 points deduction
    const weakRatio = report.summary.weakCount / total;
    deductions += Math.min(40, weakRatio * 60);

    // Duplicates: up to 30 points deduction
    const duplicateRatio = report.summary.duplicateCount / total;
    deductions += Math.min(30, duplicateRatio * 50);

    // Old passwords: up to 20 points deduction
    const oldRatio = report.summary.oldCount / total;
    deductions += Math.min(20, oldRatio * 30);

    // Breached: 10 points per breached password (max 40)
    deductions += Math.min(40, report.summary.breachedCount * 10);

    return Math.max(0, Math.round(100 - deductions));
}

/**
 * Generate human-readable issues list
 */
function generateIssuesList(report) {
    const issues = [];

    // Critical issues first
    if (report.summary.breachedCount > 0) {
        issues.push({
            type: 'breached',
            severity: 'critical',
            icon: '🚨',
            title: `${report.summary.breachedCount} senha(s) vazada(s)`,
            description: 'Estas senhas foram encontradas em vazamentos de dados conhecidos.'
        });
    }

    // Weak passwords
    const criticalWeak = report.weak.filter(w => w.severity === 'critical').length;
    if (criticalWeak > 0) {
        issues.push({
            type: 'weak',
            severity: 'critical',
            icon: '⚠️',
            title: `${criticalWeak} senha(s) muito fraca(s)`,
            description: 'Estas senhas podem ser quebradas em segundos.'
        });
    }

    if (report.summary.weakCount - criticalWeak > 0) {
        issues.push({
            type: 'weak',
            severity: 'warning',
            icon: '🔓',
            title: `${report.summary.weakCount - criticalWeak} senha(s) fraca(s)`,
            description: 'Considere usar o gerador de senhas para criar senhas mais fortes.'
        });
    }

    // Duplicates
    if (report.summary.duplicateCount > 0) {
        const totalAffected = report.duplicates.reduce((sum, d) => sum + d.count, 0);
        issues.push({
            type: 'duplicate',
            severity: 'warning',
            icon: '🔄',
            title: `${totalAffected} credenciais compartilham senhas`,
            description: 'Reutilizar senhas é arriscado. Se uma for comprometida, todas serão.'
        });
    }

    // Old passwords
    const criticalOld = report.old.filter(o => o.severity === 'critical').length;
    if (criticalOld > 0) {
        issues.push({
            type: 'old',
            severity: 'warning',
            icon: '📅',
            title: `${criticalOld} senha(s) com mais de 6 meses`,
            description: 'Senhas antigas devem ser trocadas regularmente.'
        });
    }

    if (report.summary.oldCount - criticalOld > 0) {
        issues.push({
            type: 'old',
            severity: 'info',
            icon: '⏰',
            title: `${report.summary.oldCount - criticalOld} senha(s) com mais de 90 dias`,
            description: 'Considere atualizar estas senhas.'
        });
    }

    return issues;
}

/**
 * Check password against HaveIBeenPwned (k-anonymity)
 * @param {string} password - Password to check
 * @returns {Promise<{breached: boolean, count: number}>}
 */
export async function checkPasswordBreach(password) {
    try {
        // Create SHA-1 hash of password
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        // k-anonymity: only send first 5 chars
        const prefix = hashHex.substring(0, 5);
        const suffix = hashHex.substring(5);

        // Query HIBP API
        const response = await fetch(`${CONFIG.HIBP_API_URL}${prefix}`, {
            headers: {
                'Add-Padding': 'true'  // Prevent response timing attacks
            }
        });

        if (!response.ok) {
            throw new Error('HIBP API error');
        }

        const text = await response.text();
        const lines = text.split('\n');

        // Check if our suffix is in the response
        for (const line of lines) {
            const [hashSuffix, count] = line.split(':');
            if (hashSuffix.trim() === suffix) {
                return {
                    breached: true,
                    count: parseInt(count.trim(), 10)
                };
            }
        }

        return { breached: false, count: 0 };

    } catch (error) {
        console.warn('HIBP check failed:', error);
        return { breached: false, count: 0, error: error.message };
    }
}

/**
 * Check all passwords for breaches (batch with rate limiting)
 * @param {Array} credentials - Decrypted credentials
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Array>} Breached credentials
 */
export async function checkAllBreaches(credentials, onProgress) {
    const breached = [];
    const total = credentials.length;

    for (let i = 0; i < total; i++) {
        const cred = credentials[i];

        if (cred.password) {
            const result = await checkPasswordBreach(cred.password);

            if (result.breached) {
                breached.push({
                    id: cred.id,
                    title: cred.title,
                    breachCount: result.count,
                    severity: 'critical'
                });
            }
        }

        // Report progress
        if (onProgress) {
            onProgress(i + 1, total);
        }

        // Rate limiting: 1.5 second between requests (HIBP limit)
        if (i < total - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    return breached;
}

/**
 * Get security score label and color
 */
export function getScoreInfo(score) {
    if (score >= 90) {
        return { label: 'Excelente', color: '#4CAF50', icon: '🛡️' };
    } else if (score >= 70) {
        return { label: 'Bom', color: '#8BC34A', icon: '✅' };
    } else if (score >= 50) {
        return { label: 'Regular', color: '#FFC107', icon: '⚠️' };
    } else if (score >= 30) {
        return { label: 'Fraco', color: '#FF9800', icon: '🔓' };
    } else {
        return { label: 'Crítico', color: '#F44336', icon: '🚨' };
    }
}

/**
 * Format age in human readable form
 */
export function formatAge(days) {
    if (days < 30) {
        return `${days} dias`;
    } else if (days < 365) {
        const months = Math.floor(days / 30);
        return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    } else {
        const years = Math.floor(days / 365);
        return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    }
}
