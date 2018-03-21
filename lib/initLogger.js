const _ = require('lodash')


module.exports = async function initLogger(baseConfig = {}) {

    const { cfgPath } = baseConfig

    let cfg
    try {
        cfg = require(cfgPath)
    } catch (e) {
        throw new Error(`Файл "${cfgPath}.js" не найден (${e})`)
    }

    if (!_.isPlainObject(cfg)) {
        throw new Error(`Файл "${cfgPath}.js" должен возвращать простой объект, например так: module.exports = {};`)
    }

    let logger
    try {
        logger = await require('./logger/getLogger')(cfg.logger)
    } catch (e) {
        throw new Error(`Ошибка инициализации логгера: ${e.stack}`)
    }

    return { baseConfig, cfg, logger }
}