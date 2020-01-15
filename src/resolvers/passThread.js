/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');

let handlebars;
try {
    handlebars = module.require('handlebars');
} catch (er) {
    handlebars = null;
}

function passThread ({ appId }, { isLastIndex }) {

    const appIdTemplate = handlebars
        ? handlebars.compile(appId || '{{defaultPassThreadAppId}}')
        : () => appId;

    const fn = (req, res) => {
        const toAppId = appIdTemplate(req.state);

        let data = null;

        if (Object.keys(res.data).length > 0) {
            data = res.data; // eslint-disable-line prefer-destructuring
        }

        res.setState({ _threadPassed: true });
        res.passThread(toAppId, data);

        return isLastIndex ? Router.END : Router.CONTINUE;
    };

    if (appId && appId.indexOf('{') === -1) {
        fn.globalIntentsMeta = {
            targetAppId: appId,
            targetAction: null
        };
    }

    return fn;
}

module.exports = passThread;
