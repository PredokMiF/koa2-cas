const session = require('koa-session');
const MemoryStore = require('koa-session-memory');

module.exports = async function getSession({ app, cfg }) {
    const store = new MemoryStore();
    return session({ store, ...cfg.session }, app)
}
