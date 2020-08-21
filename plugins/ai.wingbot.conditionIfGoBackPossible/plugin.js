/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 */
module.exports = (req, res) => {
    const { lastInteraction: l, beforeLastInteraction: b } = req.state;
    const c = l === res.data.lastInteractionSet ? b : l;
    return !!c && c !== '/*';
};
