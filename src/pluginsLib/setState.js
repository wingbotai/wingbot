/**
 * @author David Menger
 */
'use strict';

const { getUpdate } = require('../utils/getUpdate');

/**
 * @param {import('../Request')} req
 * @param {import('../Responder')} res
 */
function setState (req, res) {
    const { attr = '', value = '' } = req.params;

    const currentState = { ...req.state, ...res.newState };
    res.setState(getUpdate(attr, value, currentState));
}

module.exports = setState;
