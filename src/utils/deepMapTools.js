/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');

/* eslint-disable no-param-reassign */

function deepEqual (left, right) {
    if (left === right) {
        return true;
    }
    if (left === null || typeof left !== 'object') {
        return false;
    }
    try {
        // @ts-ignore
        assert.deepStrictEqual(left, right);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * @callback Mapper
 * @param {string} key
 * @param {any} val
 * @param {object} lastObj
 * @param {string|null} lastKey
 * @returns {any}
 */

/**
 *
 * @param {Mapper} [otherMapper]
 * @returns {Mapper}
 */
function defaultMapperFactory (otherMapper = null) {
    return (k, v, o, lk) => {
        const useV = otherMapper
            ? otherMapper(k, v, o, lk)
            : v;

        if (useV instanceof Date) {
            return v.toISOString();
        }
        return useV;
    };
}

/**
 *
 * @template T
 * @param {T} obj
 * @param {Mapper} mapFn
 * @returns {T}
 */
function mapObject (obj, mapFn) {
    let lastKey = null;
    let lastObj = obj;

    const str = JSON.stringify(obj, (key, val) => {
        const ret = mapFn(key, val, lastObj, lastKey);

        if (val && typeof val === 'object') {
            lastObj = val;
            lastKey = key || null;
        }

        return ret;
    });

    return JSON.parse(str);
}

function apiTextOutputFilter (obj, callback, prevKey = '') {
    let useKey;
    if (Array.isArray(obj)) {
        const len = obj.length;
        for (let i = 0; i < len; i++) {
            const v = obj[i];
            if (typeof v === 'string') {
                obj[i] = callback(v, prevKey);
            } else if (typeof v === 'object' && v !== null) {
                if (v instanceof Date) {
                    obj[i] = v.toISOString();
                } else {
                    obj[i] = apiTextOutputFilter(v, callback, prevKey);
                }
            }
        }
    } else {
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const key in obj) {
            const v = obj[key];
            useKey = prevKey ? `${prevKey}.${key}` : key;
            if (typeof v === 'string') {
                obj[key] = callback(v, useKey);
            } else if (typeof v === 'object' && v !== null) {
                if (v instanceof Date) {
                    obj[key] = v.toISOString();
                } else {
                    obj[key] = apiTextOutputFilter(v, callback, useKey);
                }
            }
        }
    }

    return obj;
}

module.exports = {
    apiTextOutputFilter, deepEqual, mapObject, defaultMapperFactory
};
