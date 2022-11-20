const chalk = require('chalk');

const Levels = {
    'common': chalk.rgb(6, 153, 207),
    'success': chalk.rgb(0, 209, 42),
    'error': chalk.rgb(255, 10, 10).bold,
    'warn': chalk.rgb(255, 172, 18),
}

const Logger = (...message) => {
    let logLevel = Levels.common;
    if (Levels[message[0]]) logLevel = Levels[message.shift()];;

    console.log(logLevel(message.join(' || ')));
};

module.exports = Logger;
