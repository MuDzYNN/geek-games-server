const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const Logger = require('../../libs/logger');
const { Hash, Compare } = require('../../libs/bcrypt');
const { pool } = require('../../libs/database');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());
router.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

router.post('/login', (req, res) => {
    const { login, password } = req.body;

    if (!login) return res.json({ error: true, message: 'Uzupełnij pole login' });
    if (!password) return res.json({ error: true, message: 'Uzupełnij pole hasło' });

    pool.query('SELECT * FROM users WHERE login=?', [login], (error, result) => {
        if (error) {
            Logger('error', error);
            return res.json({ error: true, message: 'An error occured while fetching data from database' });
        }
        if (!result[0]) return res.json({ error: true, message: 'Nieprawidłowy login' });

        Compare(password, result[0].password).then(result => {
            if (!result) return res.json({ error: true, message: 'Nieprawidłowe hasło' });

            return res.json({ error: false, message: 'Zalogowano', data: { loggedIn: true, user: 'admin' } });
        }).catch(error => {
            Logger('error', error);
            return res.json({ error: true, message: 'An error occured while comparing passwords' });
        });
    });
});

router.post('/hash', (req, res) => {
    const { password } = req.body;

    Hash(password).then(hash => {
        res.send(hash);
    }).catch(error => {
        Logger('error', error);
        res.send("Error occured while hashing password");
    });
});

module.exports = router;
