const router = require('express').Router();
const axios = require('axios');
const { pool } = require('./libs/database');
const { CheckPermissionMiddleware } = require('./libs/permissions');

router.get('/getAmmount', CheckPermissionMiddleware('questions-propositions'), (req, res, next) => {
    pool.promise().query('SELECT COUNT(*) FROM questions_propositions').then(([result]) => {
        res.json({ error: false, data: { amountOfQuestion: result[0]['COUNT(*)'] } });
    }).catch(next);
});

router.get('/accept', CheckPermissionMiddleware('questions-propositions'), (req, res, next) => {
    const { question } = req.query;

    pool.promise().query('').then(([result]) => {
        res.json({ error: false });
    }).catch(next);
});

router.get('/delete', CheckPermissionMiddleware('questions-propositions'), (req, res, next) => {
    const { question } = req.query;
});

router.post('/fetchQuetions', CheckPermissionMiddleware('questions-propositions'), (req, res, next) => {
    const { from, limit } = req.body;

    pool.promise().query('SELECT * FROM questions_propositions LIMIT ?, ?', [from, limit]).then(([result]) => {
        res.json({ error: false, data: result });
    }).catch(next);
});

router.get('/fetchAnswers', CheckPermissionMiddleware('questions-propositions'), (req, res, next) => {
    const { question } = req.query;

    pool.promise().query('SELECT answer, isCorrect FROM answers_propositions WHERE question_id = ?', [question]).then(([result]) => {
        const answers = {
            wrongAnswers: [],
            goodAnswers: [],
        };

        result.forEach(data => {
            answers[data.isCorrect ? 'goodAnswers' : 'wrongAnswers'].push(data.answer)
        });

        res.json({ error: false, data: answers });
    }).catch(next);
});

router.post('/add', (req, res, next) => {
    if (!req.body.question) return res.json({ error: true, message: 'Missing body parameter "question"' });
    if (!req.body.goodAnswers) return res.json({ error: true, message: 'Missing body parameter "goodAnswers"' });
    if (!req.body.wrongAnswers) return res.json({ error: true, message: 'Missing body parameter "wrongAnswers"' });
    if (!req.body.captchaToken) return res.json({ error: true, message: 'Aby dodać propozycję, musisz przejść captche!' });
    const question = req.body.question.charAt(0).toUpperCase() + req.body.question.slice(1);

    axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRET_KEY}&response=${req.body.captchaToken}`).then(captcha => {
        if (captcha?.status?.success) return res.json({ error: true, message: 'Spróbuj jeszcze raz z captcha.' });
        pool.promise().query('INSERT INTO questions_propositions	 (question) VALUES (?)', [question]).then(([result]) => {
            const questionId = result.insertId;
            const goodAnswers = req.body.goodAnswers.map(v => [questionId, v, 1]);
            const wrongAnswers = req.body.wrongAnswers.map(v => [questionId, v, 0]);

            pool.promise().query('INSERT INTO answers_propositions	 (question_id, answer, isCorrect) VALUES ?', [[...goodAnswers, ...wrongAnswers]]).then(() => {
                res.json({ error: false, message: 'Twoja propozycja trafiła do nas :)' });
            }).catch(next);
        }).catch(next);
    });
});

module.exports = router;
