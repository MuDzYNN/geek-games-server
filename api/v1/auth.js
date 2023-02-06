const router = require('express').Router();
const { Hash, Compare } = require('./libs/bcrypt');
const { pool } = require('./libs/database');
const { Sign } = require('./libs/jwt');

router.post('/login', (req, res, next) => {
    const { login, password } = req.body;

    if (!login) return res.json({ error: true, message: 'Uzupełnij pole login' });
    if (!password) return res.json({ error: true, message: 'Uzupełnij pole hasło' });

    pool.promise().query('SELECT id, password FROM users WHERE login=?', [login]).then(([result]) => {
        if (!result[0]) return res.json({ error: true, message: 'Nieprawidłowy login' });

        Compare(password, result[0].password).then(isPasswordValid => {
            if (!isPasswordValid) return res.json({ error: true, message: 'Nieprawidłowe hasło' });

            Sign({
                id: result[0].id,
            }).then(token => {
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    maxAge: 10000000,
                });
                return res.json({ error: false, message: 'Zalogowano', data: { loggedIn: true, user: 'admin' } });
            }).catch(next);
        }).catch(next);
    }).catch(next);
});

router.post('/register', (req, res, next) => {
    const { login, email, password } = req.body;

    if (!login) return res.json({ error: true, message: 'Missing body parameter "login"' });
    if (!email) return res.json({ error: true, message: 'Missing body parameter "email"' });
    if (!password) return res.json({ error: true, message: 'Missing body parameter "password"' });
    if (!login.match(/^[a-zA-Z0-9_-]{5,30}$/)) return res.json({ error: true, message: 'Login może zawierać tylko znaki alfanumeryczne, cyfry, znak podłogi, znak minusa oraz mieścić się w przedziale 5-30 znaków' });
    if (!email.match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )) return res.json({ error: true, message: 'Adres email nie jest prawidłowy' });
    if (!password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,55}$/)) return res.json({ error: true, message: 'Hasło musi zawierać jedną duża literę, jedną małą literę, jedną cyfrę oraz mieścić się w przedziale 8-55 znaków' });

    pool.promise().query('SELECT login FROM users WHERE login=? OR email=?', [login, email]).then(([result]) => {
        if (result[0]) return res.json({ error: true, message: `${login === result[0].login ? 'Login' : 'Adres e-mail'} jest już zajęty` });

        Hash(password).then(hash => {
            pool.promise().query('INSERT INTO users (login, email, password, permissions) VALUES (?, ?, ?, ?)', [login, email, hash, '["questions-fetch"]']).then(() => {
                res.json({ error: false, message: "Zarejestrowano pomyślnie. Zaloguj się aby kontynuować" });
            }).catch(next);
        }).catch(next);
    }).catch(next);
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ error: false, message: 'Wylogowano pomyślnie' });
});

module.exports = router;
