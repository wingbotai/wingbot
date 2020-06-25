/*
 * @author David Menger
 */
'use strict';

const path = require('path');
const { pathToRegexp } = require('path-to-regexp');

function makeAbsolute (action, contextPath = '') {
    const isAbsolute = !action || action.match(/^\//);
    return isAbsolute ? action : (path.posix || path).join(contextPath, action);
}

function actionMatches (route, requestedPath) {
    const isAbsolute = requestedPath.match(/^\//);
    if (route === requestedPath) {
        return true;
    }
    if (isAbsolute) {
        return !!pathToRegexp(route.replace(/\*/g, '(.*)'))
            .exec(requestedPath);
    }
    const expectedPos = route.length - requestedPath.length;
    return route.lastIndexOf(requestedPath) === expectedPos && expectedPos !== -1;
}

function parseActionPayload (object, needRawData = false) {
    let action;
    let data = {};
    let setState = null;
    if (typeof object === 'string') {
        action = object;
    } else if (typeof object.action === 'string') {
        action = object.action; // eslint-disable-line prefer-destructuring
        data = object.data || data;
        if (typeof object.setState === 'object') {
            setState = object.setState || null;
        }
    } else {
        let payload = object.payload || object;
        let isObject = typeof payload === 'object' && payload !== null;

        if (typeof payload === 'string' && payload.match(/^\s*\{.*\}\s*$/)) {
            payload = JSON.parse(payload);
            isObject = true;
        }

        if (isObject) {
            data = payload.data || payload;
            action = payload.action; // eslint-disable-line prefer-destructuring
            if (typeof payload.setState === 'object') {
                setState = payload.setState || null;
            }
        } else {
            action = payload;
        }
    }
    if (action && !`${action}`.match(/^[A-Za-z0-9\-/_]+$/)) {
        action = null;
    }
    if (!action && !needRawData) {
        return null;
    }
    return { action, data, setState };
}

module.exports = {
    makeAbsolute,
    actionMatches,
    parseActionPayload
};
