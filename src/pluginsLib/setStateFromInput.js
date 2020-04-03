/**
 * @author David Menger
 */
'use strict';

const { getUpdate } = require('../utils/getUpdate');

/**
 * @param {import('../Request')} req
 * @param {import('../Responder')} res
 */
function setStateFromInput (req, res) {
    if (!req.isText() && !req.isQuickReply()) {
        return;
    }
    const text = req.text();
    const { attr = '' } = req.params;

    const currentState = { ...req.state, ...res.newState };
    res.setState(getUpdate(attr, text, currentState));
}

module.exports = setStateFromInput;
