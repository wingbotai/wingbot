/**
 * @author David Menger
 */
'use strict';

const stateData = require('./stateData');

let handlebars;
try {
    // @ts-ignore
    handlebars = module.require('handlebars');
} catch (er) {
    handlebars = { compile: (text) => () => text };
}

const ATTR_REGEX = /^([^.+]*)\.?(.+)?$/;
const SCALAR_TYPES = ['string', 'number', 'boolean'];
const SUBSCRIBE = '_$subscribe';
const UNSUBSCRIBE = '_$unsubscribe';

function getUpdate (attr, value, currentState = {}) {
    let param;
    let rest = attr;
    let state = currentState;
    const ret = {};
    let up = ret;

    do {
        [, param, rest = null] = `${rest}`.match(ATTR_REGEX);

        let set;

        if (rest) {
            state = state[param] && typeof state[param] === 'object'
                ? state[param]
                : {};

            set = {
                ...state
            };
        } else {
            set = value;
        }

        Object.assign(up, {
            [param]: set
        });
        up = up[param];
    } while (rest);

    return ret;
}

function getValue (attr, currentState = {}) {
    let param;
    let rest = attr;
    let state = currentState;

    do {
        if (!state || typeof state !== 'object') {
            break;
        }

        [, param, rest = null] = `${rest}`.match(ATTR_REGEX);

        state = state[param];
    } while (rest);

    return rest ? undefined : state;
}

function isEmpty (val) {
    return val === null
        || val === undefined
        || `${val}`.trim() === '';
}

function toArray (previousValue) {
    if (Array.isArray(previousValue)) {
        return previousValue.slice();
    }
    if (isEmpty(previousValue)) {
        return [];
    }
    return [previousValue];
}

const ENTITY_HBS_REGEXP = /^\s*\{\{\[?@([^@[\]{}\s]+)(\])?\}\}\s*$/;
const VARIABLE_HBS_REGEXP = /^\s*\{\{\[?([^@[\]{}\s]+)\]?\}\}\s*$/;

function getSetState (setState = {}, req, res = null, useState = null) {

    const keys = Object.keys(setState)
        .filter((k) => k !== '_');

    let obj = {};
    let state = {
        ...req.state,
        ...(res ? res.newState : {}),
        ...(useState || {})
    };

    keys.forEach((k) => {
        const val = setState[k];
        let set;

        if (k === SUBSCRIBE && Array.isArray(val)) {
            if (res && typeof res.subscribe === 'function') {
                val.forEach((v) => res.subscribe(v));
            } else {
                set = val;
            }
        } else if (k === UNSUBSCRIBE && Array.isArray(val)) {
            if (res && typeof res.unsubscribe === 'function') {
                val.forEach((v) => res.unsubscribe(v));
            } else {
                set = val;
            }
        } else if (val && typeof val === 'object') {
            if (val._$textInput) {
                set = req.text();
            } else if (val._$entity) {
                set = typeof val._$ev !== 'undefined'
                    ? val._$ev
                    : req.entity(val._$entity, 0, state);
                const cleanEntityName = `${val._$entity}`.replace(/^@/, '');
                const key = `@${cleanEntityName}`;

                if (set === null
                    && typeof req.state[key] !== 'undefined'
                    && (!res || res.newState[key] !== null)) {

                    set = req.state[key];
                }
            } else if (typeof val._$inc !== 'undefined') {
                let previousValue = getValue(k, state);
                const incremet = typeof val._$inc === 'number' && !Number.isNaN(val._$inc)
                    ? val._$inc
                    : (parseInt(`${val._$inc}`, 10) || 0);

                if (typeof previousValue === 'string') {
                    previousValue = parseInt(previousValue, 10);
                }

                if (typeof previousValue !== 'number' || Number.isNaN(previousValue)) {
                    previousValue = 0;
                }

                set = incremet + previousValue;
            } else if (val._$shift || val._$pop
                || typeof val._$push !== 'undefined'
                || typeof val._$add !== 'undefined'
                || typeof val._$rem !== 'undefined'
                || typeof val._$set !== 'undefined') {

                let valAsArray = toArray(getValue(k, state));

                if (val._$shift) {
                    valAsArray.shift();
                } else if (val._$pop) {
                    valAsArray.pop();
                } else {
                    const value = val._$add || val._$rem || val._$push || val._$set;
                    const [, entity, rear] = `${value}`.match(ENTITY_HBS_REGEXP) || [];
                    const [, variable] = `${value}`.match(VARIABLE_HBS_REGEXP) || [];

                    let values;
                    if (entity && (!rear || req.entities.some((e) => e.entity === entity))) {
                        values = req.entities.filter((e) => e.entity === entity)
                            .map((e) => e.value);
                    } else if (variable) {
                        values = toArray(getValue(variable, state));
                    } else {
                        const useValue = typeof value === 'string'
                            ? handlebars.compile(value)(stateData(req, res))
                                .split(/(?<!\\),/g)
                                .map((v) => v.trim())
                            : value;
                        values = toArray(useValue);
                    }

                    if (typeof val._$push !== 'undefined') {
                        valAsArray.push(...values);
                    } else if (typeof val._$add !== 'undefined') {
                        const unique = Array.from(new Set(values).values());
                        valAsArray.push(...unique.filter((v) => !valAsArray.includes(v)));
                    } else if (typeof val._$rem !== 'undefined') {
                        valAsArray = valAsArray
                            .filter((v) => !values.includes(v));
                    } else if (typeof val._$set !== 'undefined') {
                        valAsArray = values;
                    }
                }

                set = valAsArray;
            } else if (k.match(/^(@|_~)/)
                || !Object.keys(val).some((l) => l.match(/^_\$/))) {
                set = val;
            }
        } else if (typeof val === 'string') {
            set = handlebars.compile(val)(stateData(req, res));
        } else if (val === null
            || SCALAR_TYPES.includes(typeof val)) {
            set = val;
        }

        if (typeof set !== 'undefined') {
            const up = getUpdate(k, set, state);
            obj = { ...obj, ...up };
            state = { ...state, ...up };
        }
    });

    return obj;
}

module.exports = { getUpdate, getValue, getSetState };
