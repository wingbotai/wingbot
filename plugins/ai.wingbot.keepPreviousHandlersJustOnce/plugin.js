/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 */
module.exports = (req, res) => {
    res.setState(req.expectedContext(true, true));
};
