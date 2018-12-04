'use strict'
const awsServerlessExpress = require('aws-serverless-express')
const app = require('./static-server')
const binaryMimeTypes = [
    'application/javascript',
	'application/octet-stream',
	'image/jpeg',
	'image/png',
	'image/svg+xml',
    'text/html',
    'text/json'
]
const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes);
exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context)
