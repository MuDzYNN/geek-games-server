const router = require('express').Router();
const Logger = require('../../libs/logger');
const { pool } = require('../../libs/database');

function getCorrectAnswer(questionId) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT answer FROM answers WHERE isCorrect = 1 AND question_id = ? ORDER BY RAND() LIMIT 1;", questionId, (err, response) => {
            resolve(response[0].answer);
        });
    });
};

function getWrongAnswers(questionId) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT answer FROM answers WHERE isCorrect = 0 AND question_id = ? ORDER BY RAND() LIMIT 2;", questionId, (err, response) => {
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

router.get('/fetch', (req, res) => {
    getQuestions().then(questions => res.json(questions));
});

module.exports = router;
