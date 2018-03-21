const favicon = require('koa-favicon');


module.exports = async function getFavicon({ cfg }) {
    return favicon(cfg.server.faviconPath)
}
