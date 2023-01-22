const ws = require('ws');
const wsServer = new ws.Server({
    noServer: true,
    cookie: true,
});

module.exports = wsServer;