const CACHE_NAME = 'topwords-cache';
const CACHED_FILES = [
    './build/site.webmanifest',
    './build/browser.js',
    './build/sw.js',
    './build/ngrams/3-letters.json',
    './build/ngrams/2-letters.json',
    './images/gear.svg',
    './images/android-chrome-192x192.png',
    './images/favicon-32x32.png',
    './images/mstile-310x150.png',
    './images/spinning-top.svg',
    './images/android-chrome-512x512.png',
    './images/mstile-310x310.png',
    './images/apple-touch-icon.png',
    './images/mstile-144x144.png',
    './images/mstile-70x70.png',
    './images/favicon-16x16.png',
    './images/mstile-150x150.png',
    './images/safari-pinned-tab.svg',
    './images/skip.svg'
];

self.addEventListener('fetch', (event) => {
    // if (event.request.url === '') {
    //     event.respondWith(fetch(event.request).catch(function(e) {
    //       let foo = {};
    //       return new Response(JSON.stringify(foo));
    //     }));
    //  }
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CACHED_FILES);
        })
    );
});
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (CACHE_NAME !== cacheName && cacheName.startsWith('topwords')) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
