module.exports = async function init(appCfg) {

    appCfg.cfg = await require('./validateConfig/validateConfig')(appCfg)
    appCfg.db = await require('./db/db')(appCfg)

}
