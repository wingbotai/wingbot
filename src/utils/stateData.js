/**
 * @author David Menger
 */
'use strict';

/** @typedef {import('../Request')} Request */
/** @typedef {import('../Responder')} Responder */

/**
 *
 * @param {Request} req
 * @param {Responder} res
 * @param {object} configuration
 * @param {object} [stateOverride]
 * @returns {object}
 */
module.exports = function stateData (req, res = null, configuration = null, stateOverride = {}) {
    const c = configuration || req.configuration;

    const $this = req.text();

    return {
        c,
        configuration: c,
        ...req.state,
        ...(res ? res.newState : {}),
        ...stateOverride,
        $this,
        ...req.actionData(),
        ...(res ? res.data : {}),
        $input: $this
    };
};
