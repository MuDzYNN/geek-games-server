const router = require('express').Router();
const Logger = require('../libs/logger');
const { Verify } = require('../libs/jwt');

router.use('/v1', require('./v1'));

module.exports = router;
