/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 * @param {Function} postback
 */
module.exports = function (req, res, postback) {
    if (req.state.beforeLastInteraction
        && !req.state.beforeLastInteraction.match(/\/\*$/)
        && req.state.beforeLastInteraction !== res.currentAction()) {

        res.setState({ lastInteraction: null, beforeLastInteraction: null });
        postback(req.state.beforeLastInteraction, { fromBack: true });
        return null;
    }
    return true;
};
