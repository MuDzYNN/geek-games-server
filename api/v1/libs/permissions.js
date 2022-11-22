const { pool } = require("./database");

const FetchAll = () => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT permission FROM permissions', (err, result) => {
            if (err) return reject(err);
            resolve(result.map(v => v.permission));
        });
    });
};

const CheckPermissionMiddleware = permission => {
    return (req, res, next) => {
        if (!req.user.permissions.includes(permission)) return res.json({ error: true, message: 'You are not permitted to do that!' });
        next();
    };
};

module.exports = { FetchAll, CheckPermissionMiddleware };
