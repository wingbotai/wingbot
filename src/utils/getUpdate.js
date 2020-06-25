/**
 * @author David Menger
 */
'use strict';

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

function getSetState (setState = {}, req, res = null) {

    const keys = Object.keys(setState)
        .filter((k) => k !== '_');

    let obj = {};
    let state = {
        ...req.state,
        ...(res ? res.newState : {})
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
                set = req.entity(val._$entity);
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
            }
        } else if (val === null || SCALAR_TYPES.includes(typeof val)) {
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
