const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const clients = new Map();
const registerSystem = {};
const registerCodes = {};

const GenerateCode = () => {
    const min = 100000;
    const max = 999999;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;

    return code;
};

const GetCodeFromId = id => {
    const code = Object.entries(registerCodes).find(([code, userId]) => userId === id);
    return code ? code[1] : null;
}


const AuthSystemRegister = ws => {
    const metadata = clients.get(ws);

    if (registerSystem[metadata.id]) return;
    if (!metadata.user) return ws.send(JSON.stringify({ error: true, message: 'Unauthorized' }));

    const refreshCode = () => {
        const code = GenerateCode();
        registerSystem[metadata.id].code = code;
        ws.send(JSON.stringify({
            action: 'LOGIN_SYSTEM_UPDATE_CODE',
            code,
        }));
    };

    registerSystem[metadata.id] = {
        ws,
        interval: setInterval(refreshCode, 60 * 1000),
        close() {
            clearInterval(this.interval);
        }
    };

    refreshCode();
};

const AuthSystemUnregister = ws => {
    const metadata = clients.get(ws);
    if (!metadata) return;
    if (!registerSystem[metadata.id]) return;
    registerSystem[metadata.id].close();
    delete registerSystem[metadata.id];
};

const AuthSystemCodeCheck = (ws, userCode) => {
    const userData = Object.values(registerSystem).find(({ code }) => code == userCode);
    if (!userData) return ws.send(JSON.stringify({ action: 'LOGIN_SYSTEM_DISPLAY_MESSAGE', error: true, message: 'Nieprawidłowy kod!' }));
    const userId = Object.keys(registerSystem).find(key => registerSystem[key] === userData);

    registerSystem[userId].gameWs = ws;

    ws.send(JSON.stringify({ action: 'LOGIN_SYSTEM_DISPLAY_MESSAGE', error: false, message: 'Zaakceptuj logowanie w przeglądarce' }));
    userData.ws.send(JSON.stringify({
        action: 'LOGIN_SYSTEM_ASK_LOGIN',
        error: false,
        message: 'Nowe logowanie',
        data: {
            location: null,
            ip: ws._socket.remoteAddress,
        },
    }));
}

const AuthSystemCodeResponse = (ws, state) => {
    const metadata = clients.get(ws);

    if (!registerSystem[metadata.id]) return;
    if (!state) return registerSystem[metadata.id].gameWs.send(JSON.stringify({ action: 'LOGIN_SYSTEM_CODE_FINALLY', error: true, message: 'Odrzucono prośbe logowania!' }));

    registerSystem[metadata.id].gameWs.send(JSON.stringify({
        action: 'LOGIN_SYSTEM_CODE_FINALLY',
        error: false,
        message: 'Zalogowano!',
        data: {
            token: metadata.cookies.token,
            ...metadata.user,
        }
    }));

    registerSystem[metadata.id].gameWs.close();
    ws.close();
};

router.ws('/', (ws, req) => {
    clients.set(ws, {
        id: uuidv4(),
        cookies: req.cookies,
        user: req.user,
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            const metadata = clients.get(ws);
            // console.log('New message', message, metadata);

            switch (message.action) {
                case 'LOGIN_SYSTEM_REGISTER':
                    AuthSystemRegister(ws);
                    break;

                case 'LOGIN_SYSTEM_CODE_CHECK':
                    AuthSystemCodeCheck(ws, message.code);
                    break;

                case 'LOGIN_SYSTEM_CODE_RESPONSE':
                    AuthSystemCodeResponse(ws, message.data.state);
                    break;

                default:
                    break;
            }
        } catch (err) {
            console.error(err);
            ws.send(JSON.stringify({ error: true, message: 'Expected string in JSON format' }));
        }
    });

    ws.on('close', () => {
        AuthSystemUnregister(ws);
        clients.delete(ws);
        console.log('Client has disconnected!');
    });
});

module.exports = router;
