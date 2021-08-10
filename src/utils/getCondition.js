/**
 * @author Vojtech Jedlicka
 */
'use strict';

const customCondition = require('./customCondition');
const customFn = require('./customFn');

module.exports = (params, description = '', allowForbiddenSnippetWords = false) => {
    const {
        hasCondition = false,
        conditionFn = '() => true',
        hasEditableCondition = false,
        editableCondition = []
    } = params;

    let condition = null;

    if (hasCondition) {
        if (hasEditableCondition) {
            condition = customCondition(editableCondition);
        } else {
            condition = customFn(conditionFn, description, allowForbiddenSnippetWords);
        }
    } else {
        condition = customFn('(req,res)=>true', description, allowForbiddenSnippetWords);
    }
    return condition;
};
