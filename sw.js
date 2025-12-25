/**
 * L2 Vault - Service Worker
 * Enables offline functionality and caching
 */

const CACHE_NAME = 'l2vault-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles/index.css',
    '/src/app.js',
    '/src/crypto/aes.js',
    '/src/crypto/argon2.js',
    '/src/storage/db.js',
    '/manifest.json'
];

// Install - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching assets');
            return cache.addAll(ASSETS);
        })
    );

    // Activate immediately
    self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );

    // Take control immediately
    self.clients.claim();
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external requests (like Argon2 CDN)
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            // Return cached if available
            if (cached) {
                return cached;
            }

            // Otherwise fetch from network
            return fetch(event.request).then((response) => {
                // Cache successful responses
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }

                return response;
            });
        }).catch(() => {
            // Offline fallback
            return caches.match('/index.html');
        })
    );
});
