const EventEmitter = require('emittery');
const BrowserAdapter = require('./browser-adapter');
const index = require('./index');

index.start(EventEmitter, new BrowserAdapter(EventEmitter));

// navigator.serviceWorker && navigator.serviceWorker.register('./build/sw.js').then(function(registration) {
//       console.log('Excellent, registered with scope: ', registration.scope);
// });
