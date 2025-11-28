/**
 * @author David Menger
 */
'use strict';

/**
 * @typedef {object} ILogger
 * @prop {Function} log
 * @prop {Function} warn
 * @prop {Function} error
 */

/**
 *
 * @param {ILogger} logger
 * @param {boolean|keyof ILogger} setting
 * @param {string} message
 * @param {...*} args
 * @returns {void}
 */
function canaryLog (logger, setting, message, ...args) {
    if (setting) {
        const key = typeof setting === 'boolean'
            ? 'error'
            : setting;
        (logger || console)[key](`#CANARY: ${message}`, ...args);
    }
}

module.exports = canaryLog;
