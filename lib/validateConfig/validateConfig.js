const Joi = require('joi')
const bluebird = require('bluebird')

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const CFG_SCHEMA = Joi.object().keys({

    logger: Joi.any(),

    db: Joi.object().keys({

        cfg: Joi.object().keys({
            host: Joi.string().min(1),
            port: Joi.number().integer(),
            user: Joi.string().min(1).required(),
            password: Joi.string().required(),
            database: Joi.string().min(1).required(),
        }),

        schema: Joi.string().min(1).required(),
        tablePrefix: Joi.string().min(1).required(),
        dbUpdaterTaskDir: Joi.string().min(1).required(),
        dbUpdaterTableName: Joi.string().min(1).required(),

    }).required(),

    server: Joi.object().keys({
        basePath: Joi.string().min(1).required(),
        port: Joi.number().integer().required(),
        koa_app_keys: Joi.array().min(1).items(Joi.string().min(1)).required(),
        faviconPath: Joi.string().min(1).required(),
        staticFilesPath: Joi.string().min(1).required(),
    }).required(),

    session: Joi.object().keys({
        key: Joi.string().min(1).required(),
        maxAge: Joi.alternatives().try(
            Joi.any().allow('session'),
            Joi.number().integer().min(1).default(DAY),
        ),
        overwrite: Joi.boolean().default(true),
        httpOnly: Joi.boolean().default(true),
        signed: Joi.boolean().default(true),
        rolling: Joi.boolean().default(false),
        renew: Joi.boolean().default(false),
    }).required(),

    cas: Joi.object().keys({
        protocol: Joi.string().min(1).default('https'),
        host: Joi.string(),     // <hostname>:<port>
        hostname: Joi.string(), // <hostname>
        port: Joi.number().integer().min(1).default(443),
        paths: Joi.object().keys({
            serviceValidate: Joi.string().min(1).default('/cas/serviceValidate'),
            login: Joi.string().min(1).default('/cas/login'),
            logout: Joi.string().min(1).default('/cas/logout'),
        }).required(),
    }).or('host', 'hostname'),

}).required()

module.exports = async function validateConfig({ cfg, logger }) {
    const validate = bluebird.promisify(Joi.validate)

    cfg = await validate(cfg, CFG_SCHEMA, { abortEarly : true })

    logger.info('Конфигурация загружена', { cfg })
    return cfg
}
