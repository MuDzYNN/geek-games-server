const router = require('express').Router();
const { pool } = require('./libs/database');

router.get('/fetchGamemodes', (req, res, next) => {
    pool.query('SELECT * FROM gamemodes', (err, result) => {
        if (err) return next(err);
        res.json({ error: false, data: result });
    });
});

router.post('/saveResult', (req, res, next) => {
    const { userId, gamemodeId, score } = req.body;

    if (!userId || !gamemodeId || !score) return res.json({ error: false, message: 'Missing body params! Requires params: "userId", "gamemodeId", "score"' });

    pool.query('INSERT INTO games (user_id, gamemode_id, score) VALUES (?, ?, ?)', [userId, gamemodeId, score], (err) => {
        if (err) return next(err);
        res.json({ error: false, message: 'Succesfully saved game!' });
    });
});

module.exports = router;
