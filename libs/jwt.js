const jwt = require('jsonwebtoken');

const Sign = payload => {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, process.env.JWT_SECRET, (error, token) => {
            if (error) return reject(error);
            resolve(token);
        });
    });
};

const Verify = token => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (error, payload) => {
            if (error) return reject(error);
            resolve(payload);
        });
    });
};

module.exports = { Sign, Verify };
