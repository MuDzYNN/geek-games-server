const router = require('express').Router();
const Logger = require('../../libs/logger');
const { Hash, Compare } = require('../../libs/bcrypt');
const { pool } = require('../../libs/database');
const { Verify, Sign } = require('../../libs/jwt');

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

            Sign({
                ...result[0],
            }).then(token => {
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    maxAge: 10000,
                });
                return res.json({ error: false, message: 'Zalogowano', data: { loggedIn: true, user: 'admin' } });
            }).catch(error => {
                Logger('error', error);
                return res.json({ error: true, message: 'An error occured while generating access token' });
            });
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

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ error: false, message: 'Wylogowano pomyślnie' });
});

module.exports = router;
