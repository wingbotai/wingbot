/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const { stateData, cachedTranslatedCompilator } = require('./utils');
const { shouldExecuteResolver } = require('./resolverTags');

function media (params, { isLastIndex }) {
    const { type, url } = params;

    const urlString = url || '';

    const urlTemplate = cachedTranslatedCompilator(urlString);

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    if (['image', 'file', 'video'].indexOf(type) === -1) {
        throw new Error(`Unsupported media type: ${type}`);
    }

    const fn = (req, res) => {
        if (!shouldExecuteResolver(req, params)) {
            return ret;
        }
        const data = stateData(req, res);
        const sendUrl = urlTemplate(data);

        res[type](sendUrl, true);

        return ret;
    };

    if (params.resolverTag) {
        fn.globalIntentsMeta = {
            resolverTag: params.resolverTag
        };
    }

    return fn;
}

module.exports = media;
