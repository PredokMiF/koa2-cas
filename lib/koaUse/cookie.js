const cookie = require('koa-cookie');

module.exports = async function getCookie() {
    return cookie.default()
}
