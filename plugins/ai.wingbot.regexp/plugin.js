/**
 * @author David Menger
 */
'use strict';

const { replaceDiacritics } = require('webalize');
const { compileWithState } = require('../../src/utils');

/** @typedef {import('../../src/Request')} Request */
/** @typedef {import('../../src/Responder')} Responder */

/**
 *
 * @param {object} params
 * @param {object} params.expression
 * @param {object} params.input
 * @returns {Function}
 */
function regexpCondition ({
    expression,
    input
}) {
    /** @type {RegExp} */
    let regex;
    try {
        const [, value, flags = ''] = `${expression || ''}`
            .trim()
            .match(/^\/?(.*?)(\/[dgimsuy]*)?$/);
        regex = new RegExp(value, flags.replace('/', ''));
    } catch (e) {
        throw new Error(`Can't parse RegExp expression: '${expression}': ${e.message}`);
    }

    /**
     *
     * @param {Request} req
     * @param {Responder} res
     */
    async function regexpConditionPlugin (req, res) {
        const compare = input && input.trim()
            ? compileWithState(req, res, input)
            : req.text();

        const matches = regex.exec(replaceDiacritics(compare));

        if (matches) {
            await res.run('matches');
        } else {
            await res.run('not');
        }
    }

    return regexpConditionPlugin;
}

module.exports = regexpCondition;
