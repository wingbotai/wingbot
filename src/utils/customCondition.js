/*
 * @author Vojtech Jedlicka
 */
'use strict';

const { webalize } = require('webalize');
const Router = require('../Router'); // eslint-disable-line
const ai = require('../Ai'); // eslint-disable-line
const fetch = require('node-fetch'); // eslint-disable-line
const Request = require('../Request'); // eslint-disable-line

let request;
try {
    // @ts-ignore
    request = module.require('request-promise-native');
} catch (e) {
    // eslint-disable-next-line no-unused-vars
    request = () => { throw new Error('To use request, you have to manually install request-promise-native into your bot.'); };
}
let axios;
try {
    // @ts-ignore
    axios = module.require('axios');
} catch (e) {
    // eslint-disable-next-line no-unused-vars
    const errfn = () => { throw new Error('To use axios, you have to manually install it into your bot.'); };
    axios = errfn;

    // @ts-ignore
    axios.get = errfn;
    // @ts-ignore
    axios.request = errfn;
    // @ts-ignore
    axios.post = errfn;
    // @ts-ignore
    axios.put = errfn;
    // @ts-ignore
    axios.delete = errfn;
    // @ts-ignore
    axios.head = errfn;
    // @ts-ignore
    axios.options = errfn;
    // @ts-ignore
    axios.patch = errfn;
    // @ts-ignore
    axios.getUri = errfn;
    // @ts-ignore
    axios.create = errfn;
}

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

/**
  *
  * @param {*} operator
  * @returns {"number"|"boolean"|"text"} operator type
  */
// eslint-disable-next-line no-unused-vars
const getConditionOperatorType = (operator) => {
    if (['if', 'it'].includes(operator)) return 'boolean';
    if (['st', 'gt', 'set', 'get'].includes(operator)) return 'number';
    return 'text';
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
const isStringNumber = (string) => !!new RegExp(/^[0-9,.]*$/).test((string || '').replace(/\s+/g, ''));

/**
 *
 * @param {string} string
 * @returns {number}
 */
// TODO čárka a tečka
const stringToNumber = (string) => {
    if (!isStringNumber(string)) throw new Error('String not a number');
    const trimmed = string.replace(/(\s|,)+/g, '');
    return trimmed.includes(',') ? Number.parseFloat(trimmed) : Number.parseInt(trimmed, 10);
};

const toNumber = (value) => {
    if (value === undefined) return 0;
    if (typeof value === 'number') return value;
    return (isStringNumber(value) ? stringToNumber(value) : value);
};

/**
 *
 * @param {string|object|number} variable - Variable VALUE
 * @param {string} operator
 * @param {string|number} value
 * @returns {boolean}
 */
// eslint-disable-next-line import/prefer-default-export
const compare = (variable, operator, value) => {
    if (Array.isArray(variable)) {
        return variable.some((variableElement) => compare(variableElement, operator, value));
    }

    switch (operator) {
        case ConditionOperators['is true']:
            return typeof value === 'string' ? !!toNumber(variable) : !!variable;
        case ConditionOperators['is false']:
            return typeof value === 'string' ? !toNumber(variable) : !variable;
        case ConditionOperators.contains:
            if (typeof variable === 'string') {
                if (isSimpleWord(value)) return webalize(variable).includes(webalize(`${value}`));
                return variable.toLocaleLowerCase().includes(value.toString().toLocaleLowerCase());
            }
            if (typeof variable === 'object') {
                if (Array.isArray(variable)) {
                    return variable.includes(value.toString().toLocaleLowerCase());
                }
                let contains = false;
                Object.keys(variable).forEach((key) => {
                    if (contains) return;
                    if (!['number', 'string'].includes(typeof key) && compare(key, operator, value)) { contains = true; }
                    if (key.toLocaleLowerCase().includes(value.toString().toLocaleLowerCase())) {
                        contains = true;
                    }
                });
                return contains;
            }
            return false;

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
            throw new Error('Condition operator not fount.');
    }
};

/**
 *
 * @param {string} variable
 * @param {Request} req
 */
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

    const resolver = (req, res) => condition.some((condList) => condList.every((cond) => {
        const variableValue = getVariableValue(cond.variable, req);
        return compare(variableValue, cond.operator, cond.value);
    }));

    return resolver;
}

module.exports = customCondition;
