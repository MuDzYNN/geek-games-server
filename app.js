import express from "express";
import { createConnection } from "mysql";
import { config } from "dotenv"

config();
const
    HOST = process.env.HOST || "127.0.0.1",
    PORT = process.env.PORT || 80,
    DB_HOST = process.env.DB_HOST || "127.0.0.1",
    DB_PORT = process.env.DB_PORT || 3306,
    DB_USER = process.env.DB_USER || "root",
    DB_PASSWORD = process.env.DB_PASSWORD || "",
    DB_NAME = process.env.DB_NAME || "game";


const app = express();
const conn = createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
});
conn.connect();

function getCorrectAnswer(questionId) {
    return new Promise((resolve, reject) => {
        conn.query("SELECT answer FROM answers WHERE isCorrect = 1 AND question_id = ? ORDER BY RAND() LIMIT 1;", questionId, (err, response) => {
            resolve(response[0].answer);
        })
    })
}

function getWrongAnswers(questionId) {
    return new Promise((resolve, reject) => {
        conn.query("SELECT answer FROM answers WHERE isCorrect = 0 AND question_id = ? ORDER BY RAND() LIMIT 2;", questionId, (err, response) => {
            resolve(response.map((row) => row.answer));
        })
    })
}

function getAnswers(questionId) {
    return new Promise(async (resolve, reject) => {
        const correctAnswer = await getCorrectAnswer(questionId),
            wrongAnswers = await getWrongAnswers(questionId);
        let i = Math.floor(Math.random()*3)+1;
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
        resolve({answers, correctAnswer: i});
    })
}

function getQuestions() {
    return new Promise((resolve, reject) => {
        conn.query("SELECT id, question FROM questions ORDER BY RAND() LIMIT 10;", (err, response) => {
            Promise.allSettled(response.map((question) => getAnswers(question.id)))
                .then((answers) => answers.map((answer, index) => {
                    return {
                        question: response[index].question,
                        answers: answer.value.answers,
                        correctAnswer: answer.value.correctAnswer
                    }
                }))
                .then(resolve);
        })
    })
}


app.get("/api/getQuestions", (req, res) => {
    getQuestions().then((questions) => {
        res.json(questions);
    });
})
app.get("/api", (req, res) => {
    getQuestions().then((questions) => {
        res.json(questions);
    });
})


app.listen(PORT, HOST);
