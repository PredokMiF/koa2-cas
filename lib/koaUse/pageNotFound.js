module.exports = async function getPageNotFound() {
    return async function pageNotFound(ctx) {
        ctx.status = 404

        switch (ctx.accepts('html', 'json')) {
            case 'html':
                ctx.type = 'html'
                ctx.body = '<p>Page Not Found</p>'
                break
            case 'json':
                ctx.body = {
                    message: 'Page Not Found'
                }
                break
            default:
                ctx.type = 'text'
                ctx.body = 'Page Not Found'
        }

        ctx.logger.warn('Страница не найдена', {
            uuid: ctx.uuid,
            method: ctx.request.method,
            status: ctx.status,
            href: ctx.request.href,
            url: ctx.request.url,
            originalUrl: ctx.request.originalUrl,
            header: ctx.request.header,
        })
    }
}
