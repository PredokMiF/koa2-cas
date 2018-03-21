const bodyParser = require('koa-bodyparser');


module.exports = async function getBodyParser() {
    return bodyParser()
}
