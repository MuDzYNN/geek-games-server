const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Verify } = require('./libs/jwt');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());
router.use(cors({
    origin: 'http://localhost:3000',
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
        req.user = payload;
        return next();
    }).catch(error => {
        Logger('error', error);
        return res.status(401).json({ error: true, message: 'Unauthorized' });
    });
});

// Private routes
router.get('/fetchUser', (req, res) => {
    console.log(req.user)
    res.json(req.user);
});

router.use('/questions', require('./questions'));

module.exports = router;
