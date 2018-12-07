const CACHE_NAME = 'topwords-cache';
const CACHED_FILES = [
    './public/site.webmanifest',
    './public/browser.js',
    './public/browser.js.map',
    './public/sw.js',
    './public/ngrams/3-letters.json',
    './public/ngrams/2-letters.json',
    './public/images/gear.svg',
    './public/images/android-chrome-192x192.png',
    './public/images/favicon-32x32.png',
    './public/images/mstile-310x150.png',
    './public/images/spinning-top.svg',
    './public/images/android-chrome-512x512.png',
    './public/images/mstile-310x310.png',
    './public/images/apple-touch-icon.png',
    './public/images/mstile-144x144.png',
    './public/images/mstile-70x70.png',
    './public/images/favicon-16x16.png',
    './public/images/mstile-150x150.png',
    './public/images/safari-pinned-tab.svg',
    './public/images/skip.svg'
];
/* -------------------- */

self.addEventListener('fetch', (event) => {
    // if (event.request.url === '') {
    //     event.respondWith(fetch(event.request).catch(function(e) {
    //       let foo = {};
    //       return new Response(JSON.stringify(foo));
    //     }));
    //  }
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((response) => {
                cache.put(event.request, response.clone());
                return response;
            }).catch((error) => {
                return new Response('<html lang="en"><head><meta charset="utf8" /></head><body><h1>Error</h1></body></html>');
            });
        })
    );
});


self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            let uncachedFiles = [
                '/',
                '/index.html'
            ];
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
