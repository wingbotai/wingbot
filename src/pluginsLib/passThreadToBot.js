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

            let text = req.text();
            const { _senderMeta: sm = {} } = req.action(true);

            if (typeof sm.disambText === 'string') {
                text = sm.disambText;
            }

            if (!text) {
                return true; // continue
            }

            action = { action: null, data: {}, text };
        } else {
            action = { action: targetAction, data: {} };
        }

        res.setState({ _threadPassed: true });
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
