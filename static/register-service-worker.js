navigator.serviceWorker && navigator.serviceWorker.register('./public/sw.js', { scope : '/' }).then((registration) => {
    console.log('Service worker registered with scope: ', registration.scope);
}).catch(err => {
    console.error('Error installing service worker: ', err);
});
