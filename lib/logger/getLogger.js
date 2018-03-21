const _ = require('lodash')
const Joi = require('joi')
const fse = require('fs-extra')

const getBaseLogger = require('./getBaseLogger')
const wrapLogger = require('./wrapLogger')


const KB = 1024
const MB = 1024 * KB

const LOGGER_CFG_SCHEMA = Joi.object().keys({

    logLevel: Joi.any().allow('debug', 'info', 'warn', 'error').required(),

    logDir: Joi.string().min(1).required(),

    maxsize: Joi.number().min(KB).max(10*MB).required(),

    consolelog: Joi.boolean().required(),

}).required()

async function getLogger(cfg = {}) {

    await fse.ensureDir(cfg.logDir)

    if (!_.isPlainObject(cfg)) {
        throw new Error('Неверная конфигурация логгера')
    }

    let {
        logLevel = 'debug',
        logDir = 'logs',
        maxsize = MB,
        consolelog = true,
    } = (cfg || {})

    cfg = { logLevel, logDir, maxsize, consolelog }

    await new Promise((resolve, reject) => {
        Joi.validate(cfg, LOGGER_CFG_SCHEMA, function (err, value) {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        });
    })


    const baseLogger = getBaseLogger(cfg)
    return wrapLogger(baseLogger)
}

module.exports = getLogger
