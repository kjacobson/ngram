const path = require('path');
const express = require('express');
const compression = require('compression');
// you can pass the parameter in the command line. e.g. node static_server.js 3000
const port = process.env.PORT || 9000;
const staticServer = express();

staticServer.use(compression());
staticServer.use(express.static(__dirname, {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['html', 'htm'],
    maxAge: '1y',
    setHeaders: (res, path, stat) => {
        res.set('x-timestamp', Date.now())
    }
}));
const serverInstance = staticServer.listen(port, () => {
    console.info(`App listening at ${serverInstance.address().address}:${serverInstance.address().port}`);
});
