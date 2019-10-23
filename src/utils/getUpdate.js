/**
 * @author David Menger
 */
'use strict';

function getUpdate (attr, value, currentState = {}, nested = false) {
    const [, param, rest = null] = `${attr}`.match(/^([^.+]*)\.?(.+)?$/);

    let prevState = nested && currentState ? currentState : {};

    if (typeof prevState !== 'object') {
        prevState = {};
    }

    return {
        ...prevState,
        [param]: rest ? getUpdate(rest, value, currentState[param], true) : value
    };
}

module.exports = getUpdate;
