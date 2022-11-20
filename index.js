const app = require('express')();
require('dotenv').config();

app.get('/', (req, res) => {
    res.send('Hello!');
});

app.use('/', require('./api'));

app.listen(process.env.APP_PORT, () => console.log(`Listening at http://localhost:${process.env.APP_PORT}`));
