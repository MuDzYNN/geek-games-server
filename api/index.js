const router = require('express').Router();
const Logger = require('../libs/logger');
const { Verify } = require('../libs/jwt');

router.use((req, res, next) => {
    const { token } = req.cookies;

    if (!token) return next(); 

    Verify(token).then(payload => {
        req.user = payload;
        next();
    }).catch(error => {
        Logger('error', error);
        next();
    });
});

router.use('/v1', require('./v1'));

module.exports = router;
