// sw.js - Updated for new folder structure and complete URL list
const CACHE_NAME = 'lifestyle-tracker-v2'; // Updated cache name
const URLS_TO_CACHE = [
    '/lifestyle-tracker/',
    '/lifestyle-tracker/index.html',
    '/lifestyle-tracker/manifest.json',
    '/lifestyle-tracker/css/styles.css',
    '/lifestyle-tracker/css/components/forms.css',
    '/lifestyle-tracker/css/components/buttons.css',
    '/lifestyle-tracker/css/components/cards.css',
    '/lifestyle-tracker/css/components/notifications.css',
    '/lifestyle-tracker/css/views/dashboard.css',
    '/lifestyle-tracker/css/views/entries.css',
    '/lifestyle-tracker/css/views/goals.css',
    '/lifestyle-tracker/js/app.js',
    '/lifestyle-tracker/js/db.js',
    '/lifestyle-tracker/js/auth.js',
    '/lifestyle-tracker/js/crypto-utils.js',
    '/lifestyle-tracker/js/views/dashboard.js',
    '/lifestyle-tracker/js/views/entries.js',
    '/lifestyle-tracker/js/views/goals.js',
    '/lifestyle-tracker/js/views/settings.js',
    '/lifestyle-tracker/js/components/calendar.js',
    '/lifestyle-tracker/js/components/charts.js',
    '/lifestyle-tracker/js/components/entry-form.js',
    '/lifestyle-tracker/js/components/goal-tracker.js',
    '/lifestyle-tracker/js/utils/date-utils.js',
    '/lifestyle-tracker/js/utils/notification-utils.js',
    '/lifestyle-tracker/js/utils/validation.js',
    '/lifestyle-tracker/assets/icons/favicon.ico',
    '/lifestyle-tracker/assets/icons/icon-192x192.png',
    '/lifestyle-tracker/assets/icons/icon-512x512.png',
    '/lifestyle-tracker/assets/images/offline-placeholder.svg'
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
                        if (!response || response.status !== 200 || response.type !== 'basic') {
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

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Add notification support (example - you'll need to adapt this)
self.addEventListener('push', event => {
    // Keep the service worker alive until the notification is created.
    event.waitUntil(
        self.registration.showNotification('Lifestyle Tracker', {
            body: 'This is a test notification!',
            icon: '/lifestyle-tracker/assets/icons/icon-192x192.png', // Use correct path
            // badge: '/lifestyle-tracker/assets/icons/badge-72x72.png' // Update if needed
        })
    );
});