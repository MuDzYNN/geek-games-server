const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const cors = require('cors');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());
router.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

router.use('/auth', require('./auth'));
router.use('/questions', require('./questions'));

module.exports = router;
