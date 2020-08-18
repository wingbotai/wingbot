const { getUpdate } = require('../../src/utils/getUpdate');

/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
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
