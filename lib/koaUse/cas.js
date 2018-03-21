const _ = require('lodash');
const parseUrl = require('url').parse;
const formatUrl = require('url').format;
const bluebird = require('bluebird');
const request = require('request-promise');
const qs = require('querystring');
const xml2js = bluebird.promisify(require('xml2js').parseString);
const stripPrefix = require('xml2js/lib/processors').stripPrefix;


class Cas {

    constructor(options = {}) {
        this.options = _.cloneDeep(options);
    }

    /**
     * Получить копию конфига
     * @returns {*}
     */
    getConfig() {
        return _.cloneDeep(this.options)
    }

    /**
     * Проверка входных параметров на предмет наличия ticket
     * Не авторизует, а только обрабатывает ответ (возврат с CAS`а)
     * @param overrides
     * @returns {Function}
     */
    serviceValidate(overrides = {}) {
        const options = _.extend(this.getConfig(), overrides);

        return async function (ctx, next) {
            if (!options.host && !options.hostname) {
                throw new Error('no CAS host specified');
            }

            const url = parseUrl(ctx.url, true);
            const ticket = (url.query && url.query.ticket) ? url.query.ticket : null;

            if (!ticket || ctx.session.st === ticket) {
                await next();
                return;
            }

            options.query = options.query || {};
            // options.query.service = options.service || origin(ctx);
            options.query.service = options.service || ctx.appCfg.cfg.server.basePath + url.pathname;
            options.query.ticket = ticket;
            options.pathname = options.paths.serviceValidate;

            const casResponseBody = await request.get(formatUrl(options));
            await validateCasResponse(ctx, ticket, casResponseBody, options, next);

            // if (ctx.method === 'OPTIONS') {
            //     //ctx.method = 'GET'
            //     ctx.redirect(formatUrl(url));
            //     return
            // }

            await next()
        }
    }

    /**
     * Предотвращает проход дальше неавторизованному пользователю
     * Неавторизованного перекидывает на страницу авторизации
     * @param overrides
     * @returns {Function}
     */
    authenticate(overrides = {}) {
        const options = _.extend(this.getConfig(), overrides);

        return async function (ctx, next) {
            if (ctx.session && ctx.session.st) {
                await next();
                return;
            }

            const url = parseUrl(ctx.url, true);
            options.pathname = options.paths.login;
            options.query = options.query || {};
            // options.query.service = options.service || origin(ctx);
            options.query.service = options.service || ctx.appCfg.cfg.server.basePath + url.pathname;

            ctx.redirect(formatUrl(options));
        };
    }

    logout(overrides = {}) {
        const options = _.extend(this.getConfig(), overrides);

        return async function (ctx, next) {
            ctx.session = null

            options.pathname = options.paths.logout;
            ctx.redirect(formatUrl(options));
        };
    }

}

// function origin(ctx) {
//     const query = ctx.query;
//     if (query.ticket) delete query.ticket;
//     const querystring = qs.stringify(query);
//     return ctx.protocol + '://' + ctx.host + parseUrl(ctx.originalUrl).pathname + (querystring ? '?' + querystring : '');
// }

async function validateCasResponse(ctx, ticket, casBody) {
    const serviceResponse = await xml2js(casBody, { explicitRoot: false, tagNameProcessors: [stripPrefix] });
    const success = serviceResponse && serviceResponse.authenticationSuccess && serviceResponse.authenticationSuccess[0];

    if (!serviceResponse) {
        throw 'Invalid CAS server response.'
    }

    if (!success) {
        return;
    }
    ctx.session.st = ticket;
    ctx.session.cas = noArrayInXml(success);

    const user = await ctx.db.one(
        'SELECT id FROM public.sec_user WHERE login = ${login};',
        { login: ctx.session.cas.user }
    )
    ctx.session.user = {
        id: user.id,
        login: ctx.session.cas.user
    }
}

function noArrayInXml(object) {
    const out = {}

    Object.keys(object).forEach(key => {
        out[key] = object[key][0]

        if (_.isObject(out[key])) {
            out[key] = noArrayInXml(out[key])
        }
    })

    return out
}

module.exports = async function getCas(appCfg) {
    const { cfg } = appCfg

    const cas = new Cas(cfg.cas);
    appCfg.cas = cas

    return cas.serviceValidate()
}
