const CACHE_NAME = 'topwords-cache';
const CACHED_FILES = [
    '../build/site.webmanifest',
    '../build/browser.js',
    '../build/sw.js',
    '../build/ngrams/3-letters.json',
    '../build/ngrams/2-letters.json',
    '../build/images/gear.svg',
    '../build/images/android-chrome-192x192.png',
    '../build/images/favicon-32x32.png',
    '../build/images/mstile-310x150.png',
    '../build/images/spinning-top.svg',
    '../build/images/android-chrome-512x512.png',
    '../build/images/mstile-310x310.png',
    '../build/images/apple-touch-icon.png',
    '../build/images/mstile-144x144.png',
    '../build/images/mstile-70x70.png',
    '../build/images/favicon-16x16.png',
    '../build/images/mstile-150x150.png',
    '../build/images/safari-pinned-tab.svg',
    '../build/images/skip.svg'
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
            if (response) {
                return response;
            }
        })
    );
});


self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            let uncachedFiles = [];
            return Promise.all(
                CACHED_FILES.map((url) => {
                    return caches.match(url).then((response) => {
                        if (response) {
                            return cache.put(url, response);
                        } else {
                            uncachedFiles.push(url);
                            return Promise.resolve();
                        }
                    });
                })
            ).then(() => {
                return cache.addAll(uncachedFiles);
            });
        }, (err) => {})
    );
});


const deleteOldCache = (cacheName) => {
    if (CACHE_NAME !== cacheName && cacheName.startsWith('topwords')) {
        return caches.delete(cacheName);
    }
};
    
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map(deleteOldCache)
            );
        })
    );
});
