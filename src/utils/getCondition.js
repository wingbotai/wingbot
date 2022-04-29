/**
 * @author Vojtech Jedlicka
 */
'use strict';

const customCondition = require('./customCondition');
const customFn = require('./customFn');

/** @typedef {import('../BuildRouter').BotContext} BotContext */

/**
 *
 * @param {object} params
 * @param {BotContext} context
 * @param {string} description
 * @returns {Function}
 */
module.exports = function getCondition (params, context, description = '') {
    const {
        allowForbiddenSnippetWords = false,
        configuration
    } = context;
    const {
        hasCondition = false,
        conditionFn = '() => true',
        hasEditableCondition = false,
        editableCondition = []
    } = params;

    let condition = null;

    if (hasCondition) {
        if (hasEditableCondition) {
            condition = customCondition(editableCondition, configuration, description);
        } else {
            condition = customFn(conditionFn, description, allowForbiddenSnippetWords);
        }
    } else {
        condition = customFn('(req,res)=>true', description, allowForbiddenSnippetWords);
    }
    return condition;
};
