// sw.js
const APP_VERSION = 'v12'; // UPDATE THIS WITH EACH DEPLOYMENT
const CACHE_NAME = `gym-timer-${APP_VERSION}`;

// URLs to cache with version parameter
const urlsToCache = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/state.js',
    '/js/dom-elements.js',
    '/js/utils.js',
    '/js/timer.js',
    '/js/workout.js',
    '/js/workout-timer.js',
    '/js/routine-builder.js',
    '/js/visibility-handler.js',
    '/js/audio.js',
    '/js/pwa.js',
    '/style.min.css',
].map(url => `${url}?v=${APP_VERSION}`);

// External resources
const externalResources = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js'
];

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
    console.log('Service Worker installing with version:', APP_VERSION);

    // Force activation of new SW immediately
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache:', CACHE_NAME);
                // Add version parameter to all requests to prevent caching issues
                const versionedUrls = urlsToCache.map(url => {
                    const urlObj = new URL(url, self.location.href);
                    if (!urlObj.searchParams.has('v')) {
                        urlObj.searchParams.append('v', APP_VERSION);
                    }
                    return urlObj.href;
                });

                return Promise.all([
                    cache.addAll(versionedUrls),
                    cache.addAll(externalResources)
                ]);
            })
    );
});

// Activate event - take control immediately and clean old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating:', APP_VERSION);

    event.waitUntil(
        Promise.all([
            // Take control of all clients immediately
            self.clients.claim(),

            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete all caches that aren't the current one
                        if (cacheName !== CACHE_NAME && cacheName.startsWith('gym-timer-')) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ]).then(() => {
            // Send message to all clients to notify about update (for mobile)
            return self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: APP_VERSION
                    });
                });
            });
        })
    );
});

// Fetch event - network first strategy with cache fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and cross-origin requests (except CDNs)
    // Add version parameter to all requests to prevent caching issues
    if (event.request.method === 'GET') {
        const url = new URL(event.request.url);
        if (url.origin === location.origin && !url.searchParams.has('v')) {
            const versionedRequest = new Request(
                `${url.href}${url.search ? '&' : '?'}v=${APP_VERSION}`,
                event.request
            );
            event.respondWith(fetch(versionedRequest));
            return;
        }
    }

    event.respondWith(
        (async () => {
            // Try network first
            try {
                const networkResponse = await fetch(event.request);

                // If successful, update cache and return response
                if (networkResponse.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, networkResponse.clone());
                }

                return networkResponse;
            } catch (error) {
                // Network failed, try cache
                console.log('Network failed, trying cache for:', event.request.url);
                const cachedResponse = await caches.match(event.request);

                if (cachedResponse) {
                    return cachedResponse;
                }

                // If both network and cache fail, return offline page for HTML requests
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/offline.html');
                }

                // For other requests, return error
                return new Response('Network error', {
                    status: 408,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
        })()
    );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLIENT_VERSION') {
        // Send version info back to client
        event.ports[0].postMessage({ version: APP_VERSION });
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        // Send version info back to client
        event.ports[0].postMessage({ version: APP_VERSION });
    }
});