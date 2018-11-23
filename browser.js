const EventEmitter = require('emittery');
const BrowserAdapter = require('./browser-adapter');
const index = require('./index');

index.start(EventEmitter, new BrowserAdapter(EventEmitter));

