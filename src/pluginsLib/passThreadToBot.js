/**
 * @author David Menger
 */
'use strict';

function passThreadToBotFactory (params) {

    const {
        targetAppId = '',
        targetAction = '' // empty target action means - pass as text
    } = params;

    /**
    * @param {import('../Request')} req
    * @param {import('../Responder')} res
    */
    const fn = async (req, res) => {
        let action;
        if (!targetAction) {

            const text = req.text();

            if (!text) {
                return true; // continue
            }

            action = { action: null, data: {}, text };
        } else {
            action = { action: targetAction, data: {} };
        }

        res.passThread(targetAppId, action);

        return null; // finish
    };

    fn.globalIntentsMeta = {
        targetAppId,
        targetAction: targetAction || null
    };

    return fn;
}

module.exports = passThreadToBotFactory;
