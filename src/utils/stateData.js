/**
 * @author David Menger
 */
'use strict';

/** @typedef {import('../Request')} Request */
/** @typedef {import('../Responder')} Responder */

const { dateToISO8601String, zeroHourDate } = require('./datetime');

/**
 * @typedef {object} IStateRequest
 * @prop {string} [senderId]
 * @prop {string} [pageId]
 * @prop {object} [state]
 * @prop {object} [configuration]
 * @prop {Function} text
 * @prop {Function} [actionData]
 * @prop {Function} [isConfidentInput]
 */

/**
 *
 * @param {IStateRequest} [req]
 * @param {Responder} [res]
 * @param {object} [configuration]
 * @param {object} [stateOverride]
 * @returns {object}
 */
module.exports = function stateData (
    req = null,
    res = null,
    configuration = null,
    stateOverride = {}
) {
    const c = configuration || (req && req.configuration) || (res && res._configuration);

    const $this = req ? req.text() : '';

    const now = new Date();

    const $now = dateToISO8601String(now, true);
    const $today = dateToISO8601String(zeroHourDate(now), true);
    now.setDate(now.getDate() + 1);
    const $tomorrow = dateToISO8601String(zeroHourDate(now), true);
    now.setDate(now.getDate() - 2);
    const $yesterday = dateToISO8601String(zeroHourDate(now), true);

    const {
        senderId,
        pageId,
        state
    } = req || {
        senderId: res._senderId,
        pageId: res._pageId,
        state: res.options.state
    };

    return {
        senderId,
        pageId,
        c,
        configuration: c,
        ...state,
        ...(res ? res.newState : {}),
        ...stateOverride,
        $this,
        $now,
        $today,
        $tomorrow,
        $yesterday,
        $llmResult: res?.llm?.lastResult?.content,
        // yes - res because of circular dependency
        ...(res && req && req.actionData()),
        ...(res ? res.data : {}),
        $input: $this
    };
};
