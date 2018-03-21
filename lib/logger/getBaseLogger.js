const path = require('path')
const winston = require('winston')


const LOG_LEVELS = ['debug', 'info', 'warn', 'error']

function getBaseLogger({ logLevel, logDir, maxsize, consolelog }) {
    const transports = []

    if (LOG_LEVELS.indexOf(logLevel) <= 0) { // DEBUG
        transports.push(new (winston.transports.File)({
            level: 'debug',
            name: 'debug',
            filename: path.join(logDir, '1-debug.log'),
            maxsize,
            maxFiles: 10,
        }))
    }

    if (LOG_LEVELS.indexOf(logLevel) <= 1) { // INFO
        transports.push(new (winston.transports.File)({
            level: 'info',
            name: 'info',
            filename: path.join(logDir, '2-info.log'),
            maxsize,
            maxFiles: 10,
        }))
    }

    if (LOG_LEVELS.indexOf(logLevel) <= 2) { // WARN
        transports.push(new (winston.transports.File)({
            level: 'warn',
            name: 'warn',
            filename: path.join(logDir, '3-warn.log'),
            maxsize,
        }))
    }

    if (LOG_LEVELS.indexOf(logLevel) <= 3) { // ERROR
        transports.push(new (winston.transports.File)({
            level: 'error',
            name: 'error',
            filename: path.join(logDir, '4-error.log'),
            maxsize,
        }))
    }

    if (consolelog) {
        transports.push(new (winston.transports.Console)({
            level: (logLevel.includes('debug') ? 'debug' : (logLevel.includes('info') ? 'info' : (logLevel.includes('warn') ? 'warn' : 'error'))),
            json: true,
            stringify: true,
            prettyPrint: true,
            humanReadableUnhandledException: true,
            showLevel: true
        }))
    }

    return new (winston.Logger)({ transports: transports })
}

module.exports = getBaseLogger
