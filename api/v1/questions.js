const router = require('express').Router();
const Logger = require('./libs/logger');
const { pool } = require('./libs/database');
const { CheckPermissionMiddleware } = require('./libs/permissions');

function getCorrectAnswer(questionId) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT answer FROM answers WHERE isCorrect = 1 AND question_id = ? ORDER BY RAND() LIMIT 1;", questionId, (err, response) => {
            if (err) return reject(err);
            resolve(response[0].answer);
        });
    });
};

function getWrongAnswers(questionId) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT answer FROM answers WHERE isCorrect = 0 AND question_id = ? ORDER BY RAND() LIMIT 2;", questionId, (err, response) => {
            if (err) return reject(err);
            resolve(response.map((row) => row.answer));
        });
    });
};

function getAnswers(questionId) {
    return new Promise(async (resolve, reject) => {
        const correctAnswer = await getCorrectAnswer(questionId),
            wrongAnswers = await getWrongAnswers(questionId);
        let i = Math.floor(Math.random() * 3) + 1;
        switch (i) {
            case 1:
                var answers = [correctAnswer, ...wrongAnswers];
                break;
            case 2:
                var answers = [wrongAnswers[0], correctAnswer, wrongAnswers[1]];
                break;
            case 3:
                var answers = [...wrongAnswers, correctAnswer];
                break;
            default:
                break;
        }
        resolve({ answers, correctAnswer: i });
    });
};

function getQuestions() {
    return new Promise((resolve, reject) => {
        pool.query("SELECT id, question FROM questions ORDER BY RAND() LIMIT 10;", (err, response) => {
            if (err) return reject(err);

            Promise.allSettled(response.map((question) => getAnswers(question.id)))
                .then((answers) => answers.map((answer, index) => ({
                    question: response[index].question,
                    answers: answer.value.answers,
                    correctAnswer: answer.value.correctAnswer
                })))
                .then(resolve);
        });
    });
};

router.get('/fetch', (req, res, next) => {
    getQuestions().then(questions => res.json(questions)).catch(next);
});

router.get('/getAmmount', CheckPermissionMiddleware('questions-list'), (req, res, next) => {
    pool.promise().query('SELECT COUNT(*) FROM questions').then(([result]) => {
        res.json({ error: false, data: { amountOfQuestion: result[0]['COUNT(*)'] } });
    }).catch(next);
});

router.post('/fetchQuetions', CheckPermissionMiddleware('questions-list'), (req, res, next) => {
    const { from, limit } = req.body;

    pool.promise().query('SELECT * FROM questions LIMIT ?, ?', [from, limit]).then(([result]) => {
        res.json({ error: false, data: result });
    }).catch(next);
});

router.get('/fetchAnswers', CheckPermissionMiddleware('questions-list'), (req, res, next) => {
    const { question } = req.query;

    pool.promise().query('SELECT answer, isCorrect FROM answers WHERE question_id = ?', [question]).then(([result]) => {
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

router.post('/add', CheckPermissionMiddleware('questions-add'), (req, res, next) => {
    if (!req.body.question) return res.json({ error: true, message: 'Missing body parameter "question"' });
    if (!req.body.goodAnswers) return res.json({ error: true, message: 'Missing body parameter "goodAnswers"' });
    if (!req.body.wrongAnswers) return res.json({ error: true, message: 'Missing body parameter "wrongAnswers"' });

    pool.promise().query('INSERT INTO questions (question) VALUES (?)', [req.body.question]).then(([result]) => {
        const questionId = result.insertId;
        const goodAnswers = req.body.goodAnswers.map(v => [questionId, v, 1]);
        const wrongAnswers = req.body.wrongAnswers.map(v => [questionId, v, 0]);

        pool.promise().query('INSERT INTO answers (question_id, answer, isCorrect) VALUES ?', [[...goodAnswers, ...wrongAnswers]]).then(() => {
            res.json({ error: false, message: 'Dodano pytanie do bazy danych' });
        }).catch(next);
    }).catch(next);
});

module.exports = router;
