/**
 * @author David Menger
 */
'use strict';

/* eslint-disable no-param-reassign */

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

module.exports = { apiTextOutputFilter };
