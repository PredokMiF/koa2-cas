const noCache = require('koa-no-cache')


module.exports = async function getNoCache() {
    return noCache({ paths: ['/api/'] })
}