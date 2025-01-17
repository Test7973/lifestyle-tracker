// sw.js need to chnage as folderstructure changed 
const CACHE_NAME = 'lifestyle-tracker-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/crypto-utils.js',
    '/db.js',
    '/auth.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    response => {
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

// Add notification support
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
    };

    event.waitUntil(
        self.registration.showNotification('Lifestyle Tracker', options)
    );
});