/**
 * L2 Vault - Favicon Utility
 * Auto-fetches favicons for websites, falls back to styled initials
 */

// Favicon providers
const FAVICON_PROVIDERS = [
    (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    (domain) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    (domain) => `https://favicon.yandex.net/favicon/${domain}`
];

// Cache for favicons (in-memory + localStorage)
const faviconCache = new Map();
const CACHE_KEY = 'l2vault_favicon_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Initialize cache from localStorage
 */
export function initFaviconCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            Object.entries(data).forEach(([key, value]) => {
                if (Date.now() - value.timestamp < CACHE_DURATION) {
                    faviconCache.set(key, value);
                }
            });
        }
    } catch (e) {
        console.warn('Favicon cache init failed:', e);
    }
}

/**
 * Save cache to localStorage
 */
function saveCache() {
    try {
        const data = {};
        faviconCache.forEach((value, key) => {
            data[key] = value;
        });
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Favicon cache save failed:', e);
    }
}

/**
 * Extract domain from title or URL
 */
export function extractDomain(title) {
    if (!title) return null;

    // Common patterns
    const titleLower = title.toLowerCase().trim();

    // Direct domain detection
    if (titleLower.includes('.')) {
        const urlMatch = titleLower.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
        if (urlMatch) return urlMatch[1];
    }

    // Common service mappings
    const serviceMap = {
        'google': 'google.com',
        'gmail': 'gmail.com',
        'youtube': 'youtube.com',
        'facebook': 'facebook.com',
        'instagram': 'instagram.com',
        'twitter': 'twitter.com',
        'x': 'x.com',
        'linkedin': 'linkedin.com',
        'github': 'github.com',
        'gitlab': 'gitlab.com',
        'amazon': 'amazon.com',
        'netflix': 'netflix.com',
        'spotify': 'spotify.com',
        'discord': 'discord.com',
        'slack': 'slack.com',
        'microsoft': 'microsoft.com',
        'outlook': 'outlook.com',
        'apple': 'apple.com',
        'icloud': 'icloud.com',
        'dropbox': 'dropbox.com',
        'paypal': 'paypal.com',
        'steam': 'steampowered.com',
        'reddit': 'reddit.com',
        'whatsapp': 'whatsapp.com',
        'telegram': 'telegram.org',
        'twitch': 'twitch.tv',
        'pinterest': 'pinterest.com',
        'tiktok': 'tiktok.com',
        'snapchat': 'snapchat.com',
        'uber': 'uber.com',
        'airbnb': 'airbnb.com',
        'booking': 'booking.com',
        'ebay': 'ebay.com',
        'walmart': 'walmart.com',
        'adobe': 'adobe.com',
        'zoom': 'zoom.us',
        'notion': 'notion.so',
        'figma': 'figma.com',
        'canva': 'canva.com',
        'trello': 'trello.com',
        'asana': 'asana.com',
        'jira': 'atlassian.com',
        'bitbucket': 'bitbucket.org',
        'heroku': 'heroku.com',
        'vercel': 'vercel.com',
        'netlify': 'netlify.com',
        'cloudflare': 'cloudflare.com',
        'digitalocean': 'digitalocean.com',
        'aws': 'aws.amazon.com',
        'azure': 'azure.microsoft.com',
        'firebase': 'firebase.google.com'
    };

    // Check for service match
    for (const [service, domain] of Object.entries(serviceMap)) {
        if (titleLower.includes(service)) {
            return domain;
        }
    }

    // Default: use title as domain guess
    return titleLower.replace(/\s+/g, '') + '.com';
}

/**
 * Generate styled initial fallback
 */
export function generateInitialIcon(title, size = 44) {
    const initial = (title || 'X').charAt(0).toUpperCase();

    // Generate consistent color from title
    const hash = title.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Colors from a curated palette
    const colors = [
        '#E53935', '#D81B60', '#8E24AA', '#5E35B1',
        '#3949AB', '#1E88E5', '#039BE5', '#00ACC1',
        '#00897B', '#43A047', '#7CB342', '#C0CA33',
        '#FDD835', '#FFB300', '#FB8C00', '#F4511E'
    ];

    const bgColor = colors[Math.abs(hash) % colors.length];

    return {
        type: 'initial',
        initial,
        bgColor,
        size
    };
}

/**
 * Load favicon for a domain
 */
export async function loadFavicon(title) {
    const domain = extractDomain(title);

    if (!domain) {
        return generateInitialIcon(title);
    }

    // Check cache first
    const cached = faviconCache.get(domain);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    // Try each provider
    for (const getUrl of FAVICON_PROVIDERS) {
        try {
            const url = getUrl(domain);
            const success = await testFaviconUrl(url);

            if (success) {
                const result = {
                    type: 'image',
                    url,
                    domain
                };

                // Cache successful result
                faviconCache.set(domain, {
                    data: result,
                    timestamp: Date.now()
                });
                saveCache();

                return result;
            }
        } catch (e) {
            continue;
        }
    }

    // Fallback to initial
    const fallback = generateInitialIcon(title);
    faviconCache.set(domain, {
        data: fallback,
        timestamp: Date.now()
    });
    saveCache();

    return fallback;
}

/**
 * Test if favicon URL is valid
 */
async function testFaviconUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const timeout = setTimeout(() => {
            resolve(false);
        }, 3000);

        img.onload = () => {
            clearTimeout(timeout);
            // Check if image is not a placeholder
            resolve(img.width > 1 && img.height > 1);
        };

        img.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
        };

        img.src = url;
    });
}

/**
 * Render favicon HTML
 */
export function renderFaviconHtml(faviconData) {
    if (faviconData.type === 'image') {
        return `<img src="${faviconData.url}" alt="" class="credential-favicon" onerror="this.parentElement.innerHTML='${faviconData.domain ? faviconData.domain.charAt(0).toUpperCase() : 'X'}'">`;
    }

    return `<span class="credential-initial" style="background-color: ${faviconData.bgColor}">${faviconData.initial}</span>`;
}

/**
 * Create credential icon element (async)
 */
export async function createCredentialIcon(title) {
    const faviconData = await loadFavicon(title);

    const div = document.createElement('div');
    div.className = 'credential-icon';

    if (faviconData.type === 'image') {
        const img = document.createElement('img');
        img.src = faviconData.url;
        img.alt = '';
        img.className = 'credential-favicon';
        img.onerror = () => {
            div.innerHTML = `<span class="credential-initial">${(title || 'X').charAt(0).toUpperCase()}</span>`;
        };
        div.appendChild(img);
    } else {
        const span = document.createElement('span');
        span.className = 'credential-initial';
        span.style.backgroundColor = faviconData.bgColor;
        span.textContent = faviconData.initial;
        div.appendChild(span);
    }

    return div;
}

// Initialize cache on load
initFaviconCache();
