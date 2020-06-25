/**
 * @author David Menger
 */
'use strict';

/**
 * @param {import('../Request')} req
 * @param {import('../Responder')} res
 */
function oneTimeNotificationRequest (req, res) {
    const { action, tag, title = '' } = req.params;
    res.oneTimeNotificationRequest(`${title}`.substr(0, 60), action, tag);
}

module.exports = oneTimeNotificationRequest;
