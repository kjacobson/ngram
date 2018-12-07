const EventEmitter = require('emittery');
const BrowserAdapter = require('./browser-adapter');
const index = require('./index');

index.start(EventEmitter, new BrowserAdapter(EventEmitter));

/* --------------HI THERE------------------ */
navigator.serviceWorker && navigator.serviceWorker.register('./public/sw.js', { scope : '/' }).then(function(registration) {
      console.log('Excellent, registered with scope: ', registration.scope);
});
