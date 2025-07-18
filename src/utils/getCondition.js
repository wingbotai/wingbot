/**
 * @author Vojtech Jedlicka
 */
'use strict';

const customCondition = require('./customCondition');
const customFn = require('./customFn');

/** @typedef {import('../BuildRouter').BotContext} BotContext */
/** @typedef {import('./customCondition').EditableCondition} EditableCondition */

// eslint-disable-next-line max-len
/** @typedef {Pick<BotContext,'configuration'|'allowForbiddenSnippetWords'|'linksMap'|'ai'>} ConditionContext */

/**
 * @typedef {object} ConditionDefinition
 * @prop {boolean} [hasCondition]
 * @prop {string} [conditionFn]
 * @prop {boolean} [hasEditableCondition]
 * @prop {EditableCondition} [editableCondition]
 */

/**
 *
 * @param {ConditionDefinition} params
 * @param {ConditionContext} context
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

    let condition;

    if (hasCondition) {
        if (hasEditableCondition) {
            condition = customCondition(editableCondition, configuration, description);
        } else {
            condition = customFn(conditionFn, description, allowForbiddenSnippetWords);
        }
    } else {
        condition = () => true;
    }
    return condition;
};
