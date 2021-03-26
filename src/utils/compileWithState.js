/**
 * @author David Menger
 */
'use strict';

let handlebars;
try {
    // @ts-ignore
    handlebars = module.require('handlebars');
} catch (er) {
    handlebars = { compile: (text) => () => text };
}
const stateData = require('./stateData');

/** @typedef {import('../Request')} Request */
/** @typedef {import('../Responder')} Responder */

/**
 * Utility, which helps to render handlebars syntax with all variables within conversations state
 *
 * @param {Request} req
 * @param {Responder} res
 * @param {string} template
 * @example
 *
 * const { compileWithState } = require('wingbot');
 *
 * function myPluginFactory (params) {
 *
 *     return (req, res) => {
 *         const text = compileWithState(req, res, params.text);
 *         res.text(text);
 *     };
 * }
 */
function compileWithState (req, res, template) {
    const data = stateData(req, res);

    return handlebars.compile(`${template}`)(data);
}

module.exports = compileWithState;
