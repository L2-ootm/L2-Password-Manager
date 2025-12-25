/**
 * L2 Vault - Advanced Password Generator
 * Military-grade password generation with multiple algorithms
 */

// ========== Word Banks for Memorable Passwords ==========
const WORD_BANKS = {
    adjectives: [
        'swift', 'bright', 'silent', 'fierce', 'cosmic', 'ancient', 'frozen', 'golden',
        'hidden', 'mystic', 'savage', 'noble', 'primal', 'stellar', 'thunder', 'twilight',
        'velvet', 'wicked', 'zealous', 'blazing', 'crystal', 'diamond', 'eternal', 'phantom',
        'radiant', 'shadow', 'titan', 'ultra', 'vibrant', 'arctic', 'bronze', 'crimson',
        'digital', 'electric', 'flying', 'granite', 'hollow', 'iron', 'jade', 'karmic',
        'lunar', 'magnetic', 'neon', 'obsidian', 'plasma', 'quantum', 'rogue', 'sonic',
        'toxic', 'venom', 'winter', 'xenon', 'yellow', 'zero', 'alpha', 'beta', 'cyber',
        'dark', 'epic', 'fatal', 'ghost', 'hyper', 'infinite', 'jungle', 'kinetic'
    ],
    nouns: [
        'dragon', 'phoenix', 'thunder', 'storm', 'falcon', 'wolf', 'tiger', 'viper',
        'hawk', 'eagle', 'panther', 'cobra', 'raven', 'shark', 'lion', 'bear',
        'fortress', 'citadel', 'castle', 'tower', 'vault', 'bunker', 'nexus', 'matrix',
        'cipher', 'codex', 'oracle', 'sentinel', 'guardian', 'warden', 'templar', 'knight',
        'blade', 'sword', 'shield', 'spear', 'arrow', 'hammer', 'axe', 'dagger',
        'nova', 'nebula', 'cosmos', 'galaxy', 'pulsar', 'quasar', 'orbit', 'meteor',
        'zero', 'omega', 'alpha', 'delta', 'sigma', 'gamma', 'theta', 'epsilon',
        'forge', 'reactor', 'engine', 'core', 'grid', 'circuit', 'network', 'protocol'
    ],
    verbs: [
        'ignite', 'launch', 'strike', 'surge', 'breach', 'unlock', 'decode', 'encrypt',
        'forge', 'craft', 'build', 'create', 'invoke', 'summon', 'awaken', 'unleash',
        'defend', 'protect', 'guard', 'shield', 'secure', 'fortify', 'armor', 'cloak',
        'hack', 'crack', 'break', 'smash', 'crush', 'destroy', 'annihilate', 'obliterate'
    ],
    symbols: ['!', '@', '#', '$', '%', '^', '&', '*', '+', '=', '?'],
    separators: ['-', '_', '.', '~', ':']
};

// ========== Diceware Word List (subset for memorable passphrases) ==========
const DICEWARE_WORDS = [
    'about', 'above', 'abuse', 'actor', 'admit', 'adopt', 'adult', 'after', 'again', 'agent',
    'agree', 'ahead', 'alarm', 'album', 'alert', 'alien', 'allow', 'alloy', 'alone', 'alpha',
    'alter', 'among', 'angel', 'anger', 'angle', 'angry', 'ankle', 'apple', 'apply', 'arena',
    'argue', 'armor', 'array', 'arrow', 'aside', 'asset', 'atlas', 'audio', 'audit', 'avoid',
    'bacon', 'badge', 'basic', 'beach', 'beast', 'begin', 'below', 'bench', 'berry', 'blade',
    'blame', 'blank', 'blast', 'blend', 'bless', 'blind', 'block', 'blood', 'bloom', 'blush',
    'board', 'bonus', 'boost', 'boots', 'brain', 'brand', 'brass', 'brave', 'bread', 'break',
    'brick', 'bride', 'brief', 'bring', 'brisk', 'broad', 'broke', 'brown', 'brush', 'buddy',
    'build', 'burst', 'buyer', 'cabin', 'cable', 'cache', 'camel', 'candy', 'cargo', 'carry',
    'catch', 'cause', 'cedar', 'chain', 'chair', 'chalk', 'chaos', 'charm', 'chase', 'cheap',
    'check', 'chess', 'chest', 'chief', 'child', 'china', 'chips', 'chose', 'chunk', 'civic',
    'civil', 'claim', 'clash', 'class', 'clean', 'clear', 'clerk', 'click', 'cliff', 'climb',
    'clock', 'clone', 'close', 'cloth', 'cloud', 'coach', 'coast', 'couch', 'could', 'count',
    'court', 'cover', 'crack', 'craft', 'crane', 'crash', 'cream', 'crime', 'crisp', 'cross',
    'crowd', 'crown', 'crush', 'cubic', 'curve', 'cyber', 'cycle', 'daily', 'dance', 'datum',
    'dealt', 'death', 'debug', 'decay', 'decor', 'decoy', 'delta', 'demon', 'dense', 'depth'
];

// ========== Password Generation Algorithms ==========

/**
 * Maximum Security - True Cryptographic Random
 * Uses all character types with maximum entropy
 */
export function generateMaxSecurity(length = 32) {
    const charset =
        'abcdefghijklmnopqrstuvwxyz' +
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        '0123456789' +
        '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

    const randomValues = crypto.getRandomValues(new Uint32Array(length));
    let password = '';

    for (let i = 0; i < length; i++) {
        password += charset[randomValues[i] % charset.length];
    }

    // Ensure at least one of each type
    return ensureComplexity(password, {
        lowercase: true,
        uppercase: true,
        numbers: true,
        symbols: true
    });
}

/**
 * Quantum-Inspired Random
 * Uses additional entropy mixing for theoretical quantum resistance
 */
export function generateQuantum(length = 40) {
    // Multiple entropy pools
    const pool1 = crypto.getRandomValues(new Uint32Array(length));
    const pool2 = crypto.getRandomValues(new Uint32Array(length));
    const pool3 = crypto.getRandomValues(new Uint32Array(length));

    // XOR mixing for enhanced entropy
    const mixed = new Uint32Array(length);
    for (let i = 0; i < length; i++) {
        mixed[i] = pool1[i] ^ pool2[(i + 7) % length] ^ pool3[(i + 13) % length];
    }

    // Extended charset including unicode-safe symbols
    const charset =
        'abcdefghijklmnopqrstuvwxyz' +
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        '0123456789' +
        '!@#$%^&*()_+-=[]{}|;:,.<>?/~`' +
        'æøåñüöäß';

    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[mixed[i] % charset.length];
    }

    return password;
}

/**
 * Memorable Passphrase
 * Uses word combinations that are easy to remember but hard to crack
 * Format: Adjective-Noun-Verb-Number-Symbol
 */
export function generateMemorable(wordCount = 4, includeNumbers = true, includeSymbols = true) {
    const words = [];
    const patterns = ['adjective', 'noun', 'adjective', 'noun', 'verb'];

    for (let i = 0; i < wordCount; i++) {
        const pattern = patterns[i % patterns.length];
        const bank = WORD_BANKS[pattern + 's'] || WORD_BANKS.nouns;
        const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % bank.length;
        let word = bank[randomIndex];

        // Capitalize first letter of each word
        word = word.charAt(0).toUpperCase() + word.slice(1);
        words.push(word);
    }

    // Join with separator
    const separatorIndex = crypto.getRandomValues(new Uint32Array(1))[0] % WORD_BANKS.separators.length;
    let password = words.join(WORD_BANKS.separators[separatorIndex]);

    // Add number
    if (includeNumbers) {
        const num = crypto.getRandomValues(new Uint32Array(1))[0] % 1000;
        password += num.toString().padStart(3, '0');
    }

    // Add symbol
    if (includeSymbols) {
        const symbolIndex = crypto.getRandomValues(new Uint32Array(1))[0] % WORD_BANKS.symbols.length;
        password += WORD_BANKS.symbols[symbolIndex];
    }

    return password;
}

/**
 * Diceware Passphrase
 * Uses the EFF diceware method for ultra-memorable passphrases
 */
export function generateDiceware(wordCount = 6, capitalize = true, addNumber = true) {
    const words = [];

    for (let i = 0; i < wordCount; i++) {
        const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % DICEWARE_WORDS.length;
        let word = DICEWARE_WORDS[randomIndex];

        if (capitalize) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
        }

        words.push(word);
    }

    let password = words.join('-');

    if (addNumber) {
        const num = crypto.getRandomValues(new Uint32Array(1))[0] % 100;
        password += num.toString().padStart(2, '0');
    }

    return password;
}

/**
 * PIN Generator
 * Generates numeric PINs of specified length
 */
export function generatePIN(length = 6) {
    const randomValues = crypto.getRandomValues(new Uint32Array(length));
    let pin = '';

    for (let i = 0; i < length; i++) {
        pin += (randomValues[i] % 10).toString();
    }

    return pin;
}

/**
 * Pronounceable Password
 * Alternates consonants and vowels for easy pronunciation
 */
export function generatePronounceable(length = 12) {
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const vowels = 'aeiou';
    const numbers = '23456789';

    let password = '';
    const randomValues = crypto.getRandomValues(new Uint32Array(length));

    for (let i = 0; i < length - 2; i++) {
        const charset = i % 2 === 0 ? consonants : vowels;
        password += charset[randomValues[i] % charset.length];
    }

    // Add 2 numbers at the end
    password += numbers[randomValues[length - 2] % numbers.length];
    password += numbers[randomValues[length - 1] % numbers.length];

    // Capitalize first letter
    return password.charAt(0).toUpperCase() + password.slice(1);
}

/**
 * Pattern-Based Password
 * Generates password following a custom pattern
 * L = lowercase, U = uppercase, N = number, S = symbol, W = word
 */
export function generatePattern(pattern = 'UULLLLNNSS') {
    const charsets = {
        L: 'abcdefghijklmnopqrstuvwxyz',
        U: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        N: '0123456789',
        S: '!@#$%^&*',
        W: null // Special handling for words
    };

    let password = '';
    const randomValues = crypto.getRandomValues(new Uint32Array(pattern.length));

    for (let i = 0; i < pattern.length; i++) {
        const type = pattern[i].toUpperCase();

        if (type === 'W') {
            const wordIndex = randomValues[i] % WORD_BANKS.nouns.length;
            password += WORD_BANKS.nouns[wordIndex];
        } else if (charsets[type]) {
            password += charsets[type][randomValues[i] % charsets[type].length];
        }
    }

    return password;
}

/**
 * Hex Password
 * Generates a hexadecimal password (useful for keys)
 */
export function generateHex(length = 32) {
    const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)));
    let hex = '';

    for (const byte of bytes) {
        hex += byte.toString(16).padStart(2, '0');
    }

    return hex.slice(0, length).toUpperCase();
}

/**
 * Base64 Password
 * Generates a URL-safe base64 password
 */
export function generateBase64(length = 24) {
    const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length * 0.75)));
    const base64 = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return base64.slice(0, length);
}

// ========== Utility Functions ==========

/**
 * Ensures password meets complexity requirements
 */
function ensureComplexity(password, requirements) {
    const chars = password.split('');
    const randomValues = crypto.getRandomValues(new Uint32Array(4));

    if (requirements.lowercase && !/[a-z]/.test(password)) {
        const pos = randomValues[0] % chars.length;
        chars[pos] = 'abcdefghijklmnopqrstuvwxyz'[randomValues[0] % 26];
    }

    if (requirements.uppercase && !/[A-Z]/.test(password)) {
        const pos = randomValues[1] % chars.length;
        chars[pos] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[randomValues[1] % 26];
    }

    if (requirements.numbers && !/[0-9]/.test(password)) {
        const pos = randomValues[2] % chars.length;
        chars[pos] = '0123456789'[randomValues[2] % 10];
    }

    if (requirements.symbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/.test(password)) {
        const pos = randomValues[3] % chars.length;
        chars[pos] = '!@#$%^&*'[randomValues[3] % 8];
    }

    return chars.join('');
}

/**
 * Calculates password strength (0-100)
 */
export function calculateStrength(password) {
    if (!password) return 0;

    let score = 0;
    const length = password.length;

    // Length score
    score += Math.min(length * 4, 40);

    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    // Bonus for mixing
    const types = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(password)).length;
    score += types * 5;

    // Penalty for repetition
    if (/(.)\1{2,}/.test(password)) score -= 10;

    // Penalty for sequences
    if (/012|123|234|345|456|567|678|789|abc|bcd|cde|def/i.test(password)) score -= 10;

    return Math.max(0, Math.min(100, score));
}

/**
 * Gets entropy bits of password
 */
export function getEntropyBits(password) {
    if (!password) return 0;

    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    return Math.floor(password.length * Math.log2(charsetSize || 1));
}

/**
 * Estimates time to crack
 */
export function estimateCrackTime(password) {
    const entropy = getEntropyBits(password);
    const guessesPerSecond = 1e12; // 1 trillion (GPU cluster)
    const totalGuesses = Math.pow(2, entropy);
    const seconds = totalGuesses / guessesPerSecond / 2; // average case

    if (seconds < 1) return 'Instantâneo';
    if (seconds < 60) return `${Math.floor(seconds)} segundos`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} horas`;
    if (seconds < 31536000) return `${Math.floor(seconds / 86400)} dias`;
    if (seconds < 31536000 * 100) return `${Math.floor(seconds / 31536000)} anos`;
    if (seconds < 31536000 * 1000000) return `${Math.floor(seconds / 31536000 / 1000)} mil anos`;
    if (seconds < 31536000 * 1e9) return `${Math.floor(seconds / 31536000 / 1e6)} milhões de anos`;
    return 'Bilhões de anos+';
}

// ========== Generator Presets ==========
export const GENERATOR_PRESETS = {
    maxSecurity: {
        name: 'Segurança Máxima',
        description: 'Senha aleatória com todos os tipos de caracteres',
        icon: '🔒',
        generate: () => generateMaxSecurity(24),
        color: '#E53935'
    },
    quantum: {
        name: 'Nível Quântico',
        description: 'Entropia máxima com mistura de pools criptográficos',
        icon: '⚛️',
        generate: () => generateQuantum(32),
        color: '#9C27B0'
    },
    memorable: {
        name: 'Memorável',
        description: 'Palavras combinadas fáceis de lembrar',
        icon: '🧠',
        generate: () => generateMemorable(4, true, true),
        color: '#4CAF50'
    },
    diceware: {
        name: 'Diceware',
        description: 'Passphrase com palavras do dicionário',
        icon: '🎲',
        generate: () => generateDiceware(5, true, true),
        color: '#2196F3'
    },
    pronounceable: {
        name: 'Pronunciável',
        description: 'Fácil de falar e digitar',
        icon: '🗣️',
        generate: () => generatePronounceable(14),
        color: '#FF9800'
    },
    pin: {
        name: 'PIN Numérico',
        description: 'Apenas números para PINs',
        icon: '🔢',
        generate: () => generatePIN(6),
        color: '#607D8B'
    },
    hex: {
        name: 'Hexadecimal',
        description: 'Formato de chave criptográfica',
        icon: '🔑',
        generate: () => generateHex(32),
        color: '#795548'
    },
    base64: {
        name: 'Base64 URL-Safe',
        description: 'Seguro para URLs e APIs',
        icon: '🌐',
        generate: () => generateBase64(24),
        color: '#009688'
    }
};
