const _ = require('lodash')
const cleanStack = require('./clean-stack')


function getErrorText (msg) {
    if (_.isString(msg)) {
        return msg
    } else if (msg instanceof Error) {
        return msg.toString() + '\n' + cleanStack(msg.stack, { pretty: true })
    } else if (_.isPlainObject(msg)) {
        return JSON.stringify(msg)
    } else {
        return msg
    }
}

function getErrorCmnData(cmn) {
    if (_.isString(cmn)) {
        return { text: cmn }
    } else if (cmn instanceof Error) {
        return { err: cmn.toString(), stack: cleanStack(cmn.stack, { pretty: true }) }
    } else if (_.isPlainObject(cmn)) {
        return cmn
    } else {
        return cmn
    }
}

/**
 *
 * @param logger
 * @returns {{debug: debug, info: info, warn: warn, error: error}}
 */
function wrapLogger(logger) {
    return {
        debug: function (msg, cmn = {}) {
            logger.log('debug', getErrorText(msg), getErrorCmnData(cmn))
        },

        info: function (msg, cmn = {}) {
            logger.log('info', getErrorText(msg), getErrorCmnData(cmn))
        },

        warn: function (msg, cmn = {}) {
            logger.log('warn', getErrorText(msg), getErrorCmnData(cmn))
        },

        error: function (msg, cmn = {}, cmn2 = {}) {
            logger.log('error', getErrorText(msg), Object.assign({}, getErrorCmnData(cmn), getErrorCmnData(cmn2)))
        }
    }
}

module.exports = wrapLogger
