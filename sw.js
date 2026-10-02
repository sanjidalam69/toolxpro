// ToolX Pro Service Worker (PWA Engine v1.0)
const CACHE_NAME = 'toolxpro-pwa-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css?v=69.0',
    '/js/layout.js?v=69.0',
    '/js/main.js',
    '/site.webmanifest',
    '/images/icon-512.png',
    '/images/favicon-192x192.png',
    '/images/favicon-96x96.png'
];

// Install: Cache essential assets & activate immediately
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('PWA: Some static assets failed to cache:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Network-First for HTML/Navigations, Stale-While-Revalidate for static assets, Bypass for AdSense & APIs
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Bypass non-GET requests, AdSense, Analytics, or API requests
    if (request.method !== 'GET' ||
        url.hostname.includes('googlesyndication') ||
        url.hostname.includes('google-analytics') ||
        url.hostname.includes('doubleclick') ||
        url.hostname.includes('highperformanceformat') ||
        url.pathname.startsWith('/api/')) {
        return;
    }

    // HTML Navigation requests: Network-first with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(request).then((res) => res || caches.match('/index.html')))
        );
        return;
    }

    // Static Assets (CSS, JS, Fonts, Images): Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return networkResponse;
            }).catch(() => {
                // Ignore network failure when fetching in background
            });

            return cachedResponse || fetchPromise;
        })
    );
});
