const Koa = require('koa')

module.exports = async function initServer(appCfg, getRoutes) {

    const { cfg, logger } = appCfg
    const { port, koa_app_keys } = cfg.server

    const app = new Koa()
    appCfg.app = app
    app.proxy = true
    app.keys = koa_app_keys

    // Static files
    app.use(await require('./koaUse/favicon')(appCfg))
    app.use(await require('./koaUse/static')(appCfg))

    // Err handle
    app.use(await require('./koaUse/errHandler')(appCfg))

    app.use(await require('./koaUse/reqMonkeyPatch')(appCfg))
    app.use(await require('./koaUse/bodyParser')(appCfg))

    // Session
    app.use(await require('./koaUse/cookie')(appCfg))
    app.use(await require('./koaUse/session')(appCfg))

    // Auth
    app.use(await require('./koaUse/cas')(appCfg))

    // Routes
    app.use(await require('./koaUse/noCache')(appCfg));
    await getRoutes(app, appCfg);

    // 404
    app.use(await require('./koaUse/pageNotFound')(appCfg))

    const server = app.listen(port)

    server.on('error', function (err) {
        logger.error('server on error', err);
    })

    logger.info(`Сервер запустился на порту ${port}`)

    appCfg.server = server

}
