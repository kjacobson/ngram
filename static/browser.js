const EventEmitter = require('emittery');
const BrowserAdapter = require('./browser-adapter');
const index = require('./index');
// hi!
index.start(EventEmitter, new BrowserAdapter(EventEmitter));

// navigator.serviceWorker && navigator.serviceWorker.register('./sw.js').then(function(registration) {
//       console.log('Excellent, registered with scope: ', registration.scope);
// });
