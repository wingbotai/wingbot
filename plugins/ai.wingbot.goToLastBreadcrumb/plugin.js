/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 * @param {Function} postback
 */
module.exports = function (req, res, postback) {
    let { breadcrumbs = [] } = req.state;
    let shift = req.state.breadcrumbAction === req.state._lastAction
        ? 2
        : 1;

    if (breadcrumbs.length < shift) {
        postback('/start');
        return null;
    }

    breadcrumbs = breadcrumbs.slice();
    let go;
    while (shift-- > 0) {
        go = breadcrumbs.shift();
    }

    res.setState({ breadcrumbs });

    postback(go);
    return null;
};
