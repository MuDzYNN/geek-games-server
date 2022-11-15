const app = require('express')();
const Logger = require('./libs/logger');
require('dotenv').config();

app.get('/', (req, res) => {
    res.send('Hello!');
});

app.use('/', require('./api'));

app.listen(process.env.APP_PORT, () => Logger('warn', `Listening at http://localhost:${process.env.APP_PORT}`));
