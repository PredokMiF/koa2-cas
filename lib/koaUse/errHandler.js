module.exports = async function getErrHandler({ logger }) {
    return async function errHandler(ctx, next) {
        try {
            await next()
        } catch (e) {
            ctx.status = e && e.status || 500

            ctx.body = `Error ${ctx.status}`

            let type = ctx.accepts('html', 'json')
            if (type === 'json') {
                ctx.body = {
                    error: ctx.body
                }
            }

            let errCmnObj

            if (ctx.status === 404 || ctx.status === 401) {
                errCmnObj = {
                    status: ctx.status,
                    uuid: ctx.uuid,
                    method: ctx.request.method,
                    href: ctx.request.href,
                }
            } else {
                errCmnObj = {
                    uuid: ctx.uuid,
                    status: ctx.status,
                    method: ctx.request.method,
                    url: ctx.request.url,
                    originalUrl: ctx.request.originalUrl,
                    href: ctx.request.href,
                    header: ctx.request.header,
                    requestBody: ctx.request.body,
                }
            }

            if (ctx.status === 401) {
                logger.info(`Пользователь не авторизован`, errCmnObj)
            } else {
                logger.error(`Ошибка выполнения REST метода`, e, errCmnObj)
            }
        }

    }

}