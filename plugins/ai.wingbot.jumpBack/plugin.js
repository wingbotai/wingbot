/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 * @param {Function} postback
 */
module.exports = function (req, res, postback) {
    let { jumpPluginStack = [] } = {
        ...req.state,
        ...res.newState
    };

    const [current, ...rest] = jumpPluginStack;
    jumpPluginStack = rest;
    res.setState({ jumpPluginStack });

    if (current) {
        postback(current.b);
        return null;
    }
    return undefined;
};
