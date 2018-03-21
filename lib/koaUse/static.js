const path = require('path')
const serve = require('koa-static')


module.exports = async function getStatics({ cfg }) {
    return serve(cfg.server.staticFilesPath)
}
