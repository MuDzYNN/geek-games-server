const { createPool } = require('mysql2');
const Logger = require('./logger');

let serverReady = false;

const pool = createPool({
    trace: false,
    supportBigNumbers: true,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

pool.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED', error => {
    if (error) return Logger('error', `Unable to establish a connection to the database!\n${error}`);
    Logger('success', 'Database server connection established!');
    serverReady = true;
});

module.exports = { pool, serverReady };
