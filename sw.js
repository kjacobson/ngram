/* self.addEventListener('fetch', function(event) {
    // if (event.request.url === '') {
    //     event.respondWith(fetch(event.request).catch(function(e) {
    //       let foo = {};
    //       return new Response(JSON.stringify(foo));
    //     }));
    //  }
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open('topwords-cache').then(function(cache) {
            return cache.addAll([
                '/',
                './index.html',
                './top2.png',
                './manifest.json',
                './build/browser.js',
                './ngram/3-letters.json',
                './ngram/2-letters.json'
            ]);
        })
    );
}); */
