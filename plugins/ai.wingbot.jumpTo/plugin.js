/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 * @param {Function} postback
 */
module.exports = (req, res, postback) => {
    const {
        whereToJump,
        whereToJumpBack
    } = req.params;

    if (!whereToJump) return undefined;

    let { jumpPluginStack = [] } = {
        ...req.state,
        ...res.newState
    };

    jumpPluginStack = [
        {
            b: whereToJumpBack
        },
        ...jumpPluginStack
    ];

    res.setState({ jumpPluginStack });
    postback(whereToJump);
    return null;
};
