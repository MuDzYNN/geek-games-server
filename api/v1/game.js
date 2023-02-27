const router = require('express').Router();
const { pool } = require('./libs/database');

router.get('/fetchGamemodes', (req, res, next) => {
    pool.query('SELECT * FROM gamemodes', (err, result) => {
        if (err) return next(err);
        res.json({ error: false, data: result });
    });
});

router.post('/fetchBest', (req, res, next) => {
    const gamemode = req?.body?.gamemode ?? 'ANY';

    pool.query('SELECT games.score, games.duration, UNIX_TIMESTAMP(games.timestamp) * 1000 AS timestamp, users.login FROM games INNER JOIN users ON games.user_id=users.id WHERE games.gamemode_id = ? ORDER BY games.score DESC LIMIT 10', [gamemode], (err, result) => {
        if (err) return next(err);
        res.json({ error: false, data: result });
    });
});

router.post('/fetchOneBest', (req, res, next) => {
    const userId = req?.body?.userId ?? 'ANY';
    const gamemodeId = req?.body?.gamemode ?? 'ANY';

    pool.query('SELECT MAX(score) AS score FROM games WHERE user_id = ? AND gamemode_id = ?', [userId, gamemodeId], (err, result) => {
        if (err) return next(err);
        res.json({ error: false, data: result[0] });
    });
});

router.post('/fetchHistory', (req, res, next) => {
    pool.query('SELECT games.score, UNIX_TIMESTAMP(games.timestamp) * 1000 AS timestamp, games.duration, gamemodes.name, gamemodes.label FROM games INNER JOIN gamemodes ON games.gamemode_id = gamemodes.id WHERE games.user_id = ? ORDER BY games.id DESC LIMIT 10', [req.user.id], (err, result) => {
        if (err) return next(result);
        res.json({ error: false, data: result });
    });
});

router.post('/saveResult', (req, res, next) => {
    const { userId, gamemodeId, score, duration } = req.body;

    if (!userId || !gamemodeId || !score || !duration) return res.json({ error: false, message: 'Missing body params! Requires params: "userId", "gamemodeId", "score", "duration"' });

    pool.query('INSERT INTO games (user_id, gamemode_id, score, duration) VALUES (?, ?, ?, ?)', [userId, gamemodeId, score, duration], (err) => {
        if (err) return next(err);
        res.json({ error: false, message: 'Succesfully saved game!' });
    });
});

module.exports = router;
