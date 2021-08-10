/*
 * @author Vojtech Jedlicka
 */
'use strict';

const { webalize } = require('webalize');

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

// TODO better regex
// wingbot.ai - sharedLib/editor/validator/validateVariableCondition
/**
 *
 * @param {string} string - number
 * @returns {boolean}
 */
const isStringNumber = (string) => {
    if (typeof string !== 'string') return false;
    if (string.length === 0) return false;
    return !!new RegExp(/^([0-9]*[, ]{0,1})*[., ]{0,1}[0-9]*$/)
        .test((string).replace(/\s+/g, ''));
};

/**
 *
 * @param {string} string
 * @returns {number}
 */
// TODO čárka a tečka
const stringToNumber = (string) => {
    if (typeof string !== 'string') return string;
    if (!isStringNumber(string)) throw new Error('String not a number');
    let trimmed;
    if (new RegExp(/^[^,.]+,[^,.]+$/).test(string)) {
        trimmed = string.replace(',', '.');
    } else {
        trimmed = string.replace(/(\s|,)+/g, '').replace(',', '.');
    }
    return trimmed.includes('.') ? Number.parseFloat(trimmed) : Number.parseInt(trimmed, 10);
};

const toNumber = (value) => {
    if (value === undefined) return 0;
    if (typeof value === 'number') return value;
    return (isStringNumber(value) ? stringToNumber(value) : Number.parseFloat(value));
};

/**
 *
 * @param {string|object|number} variable - Variable VALUE
 * @param {string} operator
 * @param {string|number} value
 * @returns {boolean}
 */
// eslint-disable-next-line import/prefer-default-export
const compare = (variable, operator, value = undefined) => {
    if (Array.isArray(variable)) {
        return variable.some((variableElement) => compare(variableElement, operator, value));
    }

    if (typeof variable === 'object') {
        return Object.values(variable)
            .some((variableElement) => compare(variableElement, operator, value));
    }

    switch (operator) {
        case ConditionOperators['is true']:
            return isStringNumber(variable) ? !!toNumber(variable) : !!variable;
        case ConditionOperators['is false']:
            return isStringNumber(variable) ? !toNumber(variable) : !variable;
        case ConditionOperators.contains:
            if (typeof variable === 'string') {
                if (isSimpleWord(value)) return webalize(variable).includes(webalize(`${value}`));
                return variable.toLocaleLowerCase().includes(value.toString().toLocaleLowerCase());
            }

            return variable.toString().includes(value.toString());

        case ConditionOperators['not contains']:
            return !compare(variable, ConditionOperators.contains, value);

        case ConditionOperators['matches regexp']:
            return new RegExp(`${value}`, 'gi').test(variable);

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

function getVariableValue (variable, req) {
    // path to object props or array elements
    if (variable.includes('.')) {
        const split = variable.split('.');
        let pointer = req.state;
        split.forEach((path) => {
            if (!Number.isNaN(+path)) {
                pointer = pointer[+path];
            } else {
                pointer = pointer[path];
            }
        });
        return pointer;
    }

    return req.state[variable];
}

/**
 *
 * @param {{value:string, operator:string, variable:string}[][]} condition
 * @param {string} description
 */
function customCondition (condition, description = '') {
    if (typeof condition !== 'object' || !Array.isArray(condition)) {
        throw new Error(`Invalid condition (${description}) type`);
    }

    // @ts-ignore
    // eslint-disable-next-line no-unused-vars
    const resolver = (req, res) => condition.some((condList) => condList.every((cond) => {
        const variableValue = getVariableValue(cond.variable, req);
        return compare(variableValue, cond.operator, cond.value);
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
