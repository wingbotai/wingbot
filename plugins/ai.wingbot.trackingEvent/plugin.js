const { compileWithState } = require('../../src/utils');

/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 */
function trackingEvent (req, res) {
    const {
        category = '',
        action = '',
        label = '',
        value = '',
        type
    } = req.params;

    const c = compileWithState(req, res, category);
    const a = compileWithState(req, res, action);
    const l = compileWithState(req, res, label);
    const v = parseFloat(compileWithState(req, res, value)
        .replace(/[^0-9.]+/, '')) || 0;

    res.trackEvent(type || 'report', c, a, l, v);
}

module.exports = trackingEvent;
