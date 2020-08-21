/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 */
module.exports = (req, res) => {
    const { action, data = {} } = req.expected() || {};
    const current = res.currentAction();
    if (!data._alreadySeen || action !== current) {
        res.expected(current, { _alreadySeen: true });
    }
};
