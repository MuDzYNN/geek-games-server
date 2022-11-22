const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Verify } = require('./libs/jwt');
const { pool } = require('./libs/database');
const Logger = require('./libs/logger');
const { FetchAll } = require('./libs/permissions');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());
router.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Public routes
router.use('/auth', require('./auth'));
router.use('/ping', (req, res) => {
    res.send("Pong!");
});

// Auth middleware
router.use((req, res, next) => {
    const { token } = req.cookies;

    if (!token) return res.status(401).json({ error: true, message: 'Unauthorized' });

    Verify(token).then(payload => {
        pool.promise().query('SELECT id, login, role, permissions FROM users WHERE id=?', [payload.id]).then(async ([result]) => {
            const user = result[0];
            user.permissions = JSON.parse(result[0].permissions);
            if (user.permissions[0] == '*') user.permissions = await FetchAll();
            req.user = user;
            next();
        }).catch(error => {
            Logger('error', error);
            res.status(401).json({ error: true, message: 'Unauthorized' });
        });
    }).catch(error => {
        Logger('error', error);
        res.status(401).json({ error: true, message: 'Unauthorized' });
    });
});

// Private routes
router.get('/fetchUser', (req, res) => {
    res.json(req.user);
});

router.use('/questions', require('./questions'));

module.exports = router;
