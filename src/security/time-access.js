/**
 * L2 Vault - Time-Based Access Module
 * Allows restricting credential access to specific time windows
 */

const TIME_ACCESS_KEY = 'timeAccessRules';

// Days of week mapping
const DAYS = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Time access rule structure:
 * {
 *   credentialId: number,
 *   enabled: boolean,
 *   schedule: {
 *     days: [0,1,2,3,4,5,6], // Days of week (0=Sunday)
 *     startTime: "09:00",   // HH:MM format
 *     endTime: "18:00"      // HH:MM format
 *   },
 *   action: 'hide' | 'lock' | 'alert'  // What to do outside window
 * }
 */

/**
 * Get all time access rules
 * @returns {Object} Map of credentialId to rule
 */
export function getTimeAccessRules() {
    const stored = localStorage.getItem(TIME_ACCESS_KEY);
    return stored ? JSON.parse(stored) : {};
}

/**
 * Get time access rule for a specific credential
 * @param {number} credentialId 
 * @returns {Object|null}
 */
export function getTimeAccessRule(credentialId) {
    const rules = getTimeAccessRules();
    return rules[credentialId] || null;
}

/**
 * Set time access rule for a credential
 * @param {number} credentialId 
 * @param {Object} rule 
 */
export function setTimeAccessRule(credentialId, rule) {
    const rules = getTimeAccessRules();
    rules[credentialId] = {
        credentialId,
        enabled: rule.enabled ?? true,
        schedule: {
            days: rule.schedule?.days ?? [1, 2, 3, 4, 5], // Mon-Fri default
            startTime: rule.schedule?.startTime ?? '09:00',
            endTime: rule.schedule?.endTime ?? '18:00'
        },
        action: rule.action ?? 'hide'
    };
    localStorage.setItem(TIME_ACCESS_KEY, JSON.stringify(rules));
}

/**
 * Remove time access rule for a credential
 * @param {number} credentialId 
 */
export function removeTimeAccessRule(credentialId) {
    const rules = getTimeAccessRules();
    delete rules[credentialId];
    localStorage.setItem(TIME_ACCESS_KEY, JSON.stringify(rules));
}

/**
 * Check if credential is currently accessible
 * @param {number} credentialId 
 * @returns {{accessible: boolean, reason: string, nextWindow: Date|null}}
 */
export function isCredentialAccessible(credentialId) {
    const rule = getTimeAccessRule(credentialId);

    // No rule = always accessible
    if (!rule || !rule.enabled) {
        return { accessible: true, reason: null, nextWindow: null };
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check if today is an allowed day
    const dayAllowed = rule.schedule.days.includes(currentDay);

    // Check if current time is within window
    const timeInWindow = currentTime >= rule.schedule.startTime &&
        currentTime <= rule.schedule.endTime;

    if (dayAllowed && timeInWindow) {
        return { accessible: true, reason: null, nextWindow: null };
    }

    // Calculate next access window
    const nextWindow = calculateNextWindow(rule.schedule, now);

    let reason = '';
    if (!dayAllowed) {
        reason = `Disponível apenas: ${rule.schedule.days.map(d => DAY_NAMES[d]).join(', ')}`;
    } else {
        reason = `Disponível das ${rule.schedule.startTime} às ${rule.schedule.endTime}`;
    }

    return { accessible: false, reason, nextWindow };
}

/**
 * Filter credentials by time access
 * @param {Array} credentials 
 * @param {string} filterMode - 'hide' | 'show-all' | 'show-locked'
 * @returns {Array}
 */
export function filterByTimeAccess(credentials, filterMode = 'show-locked') {
    if (filterMode === 'show-all') {
        return credentials.map(cred => ({
            ...cred,
            timeAccess: isCredentialAccessible(cred.id)
        }));
    }

    return credentials.filter(cred => {
        const access = isCredentialAccessible(cred.id);
        if (filterMode === 'hide') {
            return access.accessible;
        }
        // show-locked: always show but mark as locked
        cred.timeAccess = access;
        return true;
    });
}

/**
 * Calculate next access window
 * @param {Object} schedule 
 * @param {Date} from 
 * @returns {Date}
 */
function calculateNextWindow(schedule, from) {
    const result = new Date(from);

    // If today is an allowed day but time hasn't started
    const currentTime = `${String(from.getHours()).padStart(2, '0')}:${String(from.getMinutes()).padStart(2, '0')}`;

    if (schedule.days.includes(from.getDay()) && currentTime < schedule.startTime) {
        // Today, at start time
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        result.setHours(hours, minutes, 0, 0);
        return result;
    }

    // Find next allowed day
    let daysToAdd = 1;
    while (daysToAdd <= 7) {
        const checkDay = (from.getDay() + daysToAdd) % 7;
        if (schedule.days.includes(checkDay)) {
            result.setDate(result.getDate() + daysToAdd);
            const [hours, minutes] = schedule.startTime.split(':').map(Number);
            result.setHours(hours, minutes, 0, 0);
            return result;
        }
        daysToAdd++;
    }

    return null;
}

/**
 * Format next window for display
 * @param {Date} nextWindow 
 * @returns {string}
 */
export function formatNextWindow(nextWindow) {
    if (!nextWindow) return 'Indisponível';

    const now = new Date();
    const diffMs = nextWindow - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours < 24) {
        if (diffHours === 0) {
            return `Em ${diffMinutes} minutos`;
        }
        return `Em ${diffHours}h ${diffMinutes}min`;
    }

    const days = Math.floor(diffHours / 24);
    const options = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
    return nextWindow.toLocaleDateString('pt-BR', options);
}

/**
 * Get day names for display
 */
export function getDayNames() {
    return DAY_NAMES;
}

/**
 * Create default schedule
 */
export function createDefaultSchedule() {
    return {
        days: [1, 2, 3, 4, 5], // Monday to Friday
        startTime: '09:00',
        endTime: '18:00'
    };
}
