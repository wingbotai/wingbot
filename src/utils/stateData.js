/**
 * @author David Menger
 */
'use strict';

/** @typedef {import('../Request')} Request */
/** @typedef {import('../Responder')} Responder */

const { dateToISO8601String, zeroHourDate } = require('./datetime');

/**
 * @typedef {object} IStateRequest
 * @prop {object} [state]
 * @prop {object} [configuration]
 * @prop {Function} text
 * @prop {Function} [actionData]
 */

/**
 *
 * @param {IStateRequest} req
 * @param {Responder} res
 * @param {object} configuration
 * @param {object} [stateOverride]
 * @returns {object}
 */
module.exports = function stateData (req, res = null, configuration = null, stateOverride = {}) {
    const c = configuration || req.configuration;

    const $this = req.text();

    const now = new Date();

    const $now = dateToISO8601String(now, true);
    const $today = dateToISO8601String(zeroHourDate(now), true);
    now.setDate(now.getDate() + 1);
    const $tomorrow = dateToISO8601String(zeroHourDate(now), true);
    now.setDate(now.getDate() - 2);
    const $yesterday = dateToISO8601String(zeroHourDate(now), true);

    return {
        c,
        configuration: c,
        ...req.state,
        ...(res ? res.newState : {}),
        ...stateOverride,
        $this,
        $now,
        $today,
        $tomorrow,
        $yesterday,
        // yes - res because of circular dependency
        ...(res && req.actionData()),
        ...(res ? res.data : {}),
        $input: $this
    };
};
