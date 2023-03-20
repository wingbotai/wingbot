/*
 * @author Vojtech Jedlicka
 */
'use strict';

const { webalize } = require('webalize');
const compileWithState = require('./compileWithState');
const { getValue } = require('./getUpdate');
const stateData = require('./stateData');

const ConditionOperators = {
    'is false': 'if',
    'is true': 'it',

    // eslint-disable-next-line quote-props
    'contains': 'c',
    'not contains': 'nc',

    'matches regexp': 'mr',
    'not matches regexp': 'nmr',

    '<': 'st',
    '>': 'gt',
    '<=': 'set',
    '>=': 'get',

    '==': 'eq',
    '!=': 'neq'
};

const isSimpleWord = (string) => {
    const word = string.replace(/\s+/g, ' ');
    return webalize(word).length === word.trim().length;
};

// wingbot.ai - sharedLib/editor/validator/validateVariableCondition
/**
 *
 * @param {string} string - number
 * @returns {boolean}
 */
const isStringNumber = (string) => {
    if (typeof string !== 'string') return false;
    if (string.length === 0) return false;
    return !!/^([0-9]*[, ]{0,1})*[., ]{0,1}[0-9]*$/
        .test((string).replace(/\s+/g, ''));
};

/**
 *
 * @param {string} string
 * @returns {number}
 */
const stringToNumber = (string) => {
    if (typeof string !== 'string') return string;
    if (!isStringNumber(string)) throw new Error('String not a number');
    let trimmed;
    if (/^[^,.]+,[^,.]+$/.test(string)) {
        trimmed = string.replace(',', '.');
    } else {
        trimmed = string.replace(/(\s|,)+/g, '').replace(',', '.');
    }
    return trimmed.includes('.') ? Number.parseFloat(trimmed) : Number.parseInt(trimmed, 10);
};

const toNumber = (value) => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    if (Array.isArray(value)) return value.length;
    return (isStringNumber(value) ? stringToNumber(value) : Number.parseFloat(value));
};

const ARRAY_LENGTH_OPERATORS = [
    ConditionOperators['<='],
    ConditionOperators['>='],
    ConditionOperators['<'],
    ConditionOperators['>']
];

/**
 *
 * @param {string|object|number} variable - Variable VALUE
 * @param {string} operator
 * @param {string|number} value
 * @returns {boolean}
 */
// eslint-disable-next-line import/prefer-default-export
const compare = (variable, operator, value = undefined) => {
    const isArrayLengthCompare = ARRAY_LENGTH_OPERATORS.includes(operator);
    if (Array.isArray(variable) && !isArrayLengthCompare) {
        if ((operator === ConditionOperators['=='] || operator === ConditionOperators['!='])
            && (typeof value === 'number' || isStringNumber(value))) {

            const numeric = toNumber(value);
            return operator === ConditionOperators['==']
                ? numeric === variable.length
                : numeric !== variable.length;
        }

        if (operator === ConditionOperators['not contains']) {
            return variable
                .every((variableElement) => !compare(variableElement, ConditionOperators['=='], value));
        }

        const useOperator = operator === ConditionOperators.contains
            ? ConditionOperators['==']
            : operator;

        return variable.some((variableElement) => compare(variableElement, useOperator, value));
    }

    if (variable && typeof variable === 'object' && !isArrayLengthCompare) {
        switch (operator) {
            case ConditionOperators['is true']:
                return Object.keys(variable).length !== 0;
            case ConditionOperators['is false']:
                return Object.keys(variable).length === 0;
            default:
                return Object.values(variable)
                    .some((variableElement) => compare(variableElement, operator, value));
        }
    }

    switch (operator) {
        case ConditionOperators['is true']:
            return isStringNumber(variable) ? !!toNumber(variable) : !!variable;
        case ConditionOperators['is false']:
            return isStringNumber(variable) ? !toNumber(variable) : !variable;
        case ConditionOperators.contains:
            if (typeof variable === 'string') {
                if (isSimpleWord(value)) {
                    return webalize(variable).includes(webalize(`${value}`));
                }
                return variable.toLocaleLowerCase().includes(`${value}`.toLocaleLowerCase());
            }

            if (variable === null || variable === undefined) {
                return value === null || value === undefined || value === '';
            }

            return `${variable}`.includes(`${value}`);

        case ConditionOperators['not contains']:
            return !compare(variable, ConditionOperators.contains, value);

        case ConditionOperators['matches regexp']:
            return new RegExp(`${unescape(`${value}`)}`, 'i').test(variable);

        case ConditionOperators['not matches regexp']:
            return !compare(variable, ConditionOperators['matches regexp'], value);

        case ConditionOperators['==']:
            if (typeof value === 'number' || isStringNumber(value)) {
                return toNumber(variable) === toNumber(value);
            }
            return variable === value;

        case ConditionOperators['!=']:
            return !compare(variable, ConditionOperators['=='], value);

        case ConditionOperators['>']:
            return toNumber(variable) > toNumber(value);

        case ConditionOperators['<']:
            return toNumber(variable) < toNumber(value);

        case ConditionOperators['>=']:
            return toNumber(variable) >= toNumber(value);

        case ConditionOperators['<=']:
            return toNumber(variable) <= toNumber(value);

        default:
            throw new Error('Invalid operator');
    }
};

/**
 *
 * @param {{value:string, operator:string, variable:string}[][]} condition
 * @param {object} configuration
 * @param {string} description
 */
function customCondition (condition, configuration, description = '') {
    if (typeof condition !== 'object' || !Array.isArray(condition)) {
        throw new Error(`Invalid condition (${description}) type`);
    }

    const resolver = (req, res) => condition.some((condList) => condList.every((cond) => {
        const data = stateData(req, res, configuration);
        const variableValue = getValue(cond.variable, data);
        const isRegExp = [
            ConditionOperators['matches regexp'],
            ConditionOperators['not matches regexp'],
            ConditionOperators['is true'],
            ConditionOperators['is false']
        ].includes(cond.operator);
        const value = isRegExp ? cond.value : compileWithState(req, res, cond.value);
        return compare(variableValue, cond.operator, value);
    }));

    return resolver;
}

module.exports = customCondition;
module.exports.ConditionOperators = ConditionOperators;
module.exports.compare = compare;
module.exports.isSimpleWord = isSimpleWord;
module.exports.isStringNumber = isStringNumber;
module.exports.toNumber = toNumber;
module.exports.stringToNumber = stringToNumber;
