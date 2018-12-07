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
const errorPage = (error) => {
    return new Response(`<html lang="en"><head><meta charset="utf8" /></head><body><h1>Error: ${error}</h1></body></html>`);
};

const fromNetwork = (request, timeout) => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(reject, timeout);
        fetch(request).then((response) => {
            console.log("Retrieved " + request.url + " from network");
            clearTimeout(timeoutId);
            resolve(response);
        }, reject);
    });
};
const fromCache = (request) => {
    return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((matching) => {
            console.log("Retrieved " + request.url + " from cache");
            return matching || Promise.reject('Requested resource not found in service worker cache.');
        });
    });
};

self.addEventListener('fetch', (event) => {
    const path = new URL(event.request.url).pathname;
    if (['/', '/index', '/index.html'].indexOf(path) > -1) {
        event.respondWith(
            fromNetwork(event.request, 3000).catch(() => {
                return fromCache(event.request);
            }).catch(errorPage)
        );
    } else {
        event.respondWith(
            fromCache(event.request).catch(() => {
                return fromNetwork(event.request, 3000);
            }).catch(errorPage)
        );
    }
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
