const express = require('express');
const router = express.Router();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Verify, Sign } = require('./libs/jwt');
const { pool } = require('./libs/database');
const Logger = require('./libs/logger');
const { FetchAll } = require('./libs/permissions');
require('./websocket');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());
router.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Get information from token
router.use((req, res, next) => {
    const token = req?.cookies?.token ?? req?.body?.token;

    if (token) {
        req.token = token;
        Verify(req.token).then(payload => {
            if (payload.id === null) {
                req.user = payload
                return next();
            };
            pool.promise().query('SELECT id, login, role, permissions FROM users WHERE id=?', [payload.id]).then(async ([result]) => {
                const user = result[0];
                user.permissions = JSON.parse(result[0].permissions);
                if (user.permissions[0] == '*') user.permissions = await FetchAll();
                req.user = user;
                next();
            }).catch(error => {
                Logger('error', error);
                next();
            });
        }).catch(error => {
            Logger('error', error);
            next();
        });
    } else {
        next();
    }
});

// Public routes
router.use('/auth', require('./auth'));
router.use('/ping', (req, res) => {
    console.log(req.user)
    res.send("Pong!");
});

router.use('/websocket', require('./websocket'));
router.get('/generateToken', (req, res, next) => {
    Sign({
        id: null,
        login: 'Gość',
        role: 'guest',
        permissions: 'questions-fetch',
    }).then(token => {
        res.json({ error: false, data: { token } });
    }).catch(next);
});

// Private routes middlware
router.use((req, res, next) => {
    if (!req.user) {
        if (req?.cookies?.token) res.clearCookie('token');
        return res.status(401).json({ error: true, message: 'Unauthorized' })
    };
    next();
});

// Private routes
router.get('/fetchUser', (req, res) => {
    res.json({ error: false, data: { user: req.user } });
});

router.use('/questions', require('./questions'));
router.use('/game', require('./game'));

module.exports = router;
