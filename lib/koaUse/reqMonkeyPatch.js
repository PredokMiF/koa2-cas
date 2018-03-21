const uuidv4 = require('uuid/v4')


module.exports = async function getMonkeyPatcher(appCfg) {
    const { logger, db } = appCfg

    return async function reqUuid(ctx, next) {
        ctx.uuid = uuidv4()
        ctx.logger = logger
        ctx.db = db
        ctx.appCfg = appCfg

        await next()
    }
}
