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
 * @returns {object}
 */
module.exports = function stateData (req, res = null, configuration = null) {
    const c = configuration || req.configuration;

    return {
        ...req.state,
        ...(res ? res.newState : {}),
        ...req.actionData(),
        ...(res ? res.data : {}),
        c,
        configuration: c
    };
};
