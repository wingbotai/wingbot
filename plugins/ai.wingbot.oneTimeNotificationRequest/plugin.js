/**
 * @param {import('../../src/Request')} req
 * @param {import('../../src/Responder')} res
 */
module.exports = (req, res) => {
    const { action, tag, title = '' } = req.params;
    res.oneTimeNotificationRequest(`${title}`.substr(0, 60), action, tag);
};
