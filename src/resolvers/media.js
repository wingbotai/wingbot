/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const getCondition = require('../utils/getCondition');
const { stateData, cachedTranslatedCompilator } = require('./utils');

function media (
    params,
    // @ts-ignore
    { isLastIndex } = {}
) {
    const { type, url } = params;

    const urlString = url || '';

    const urlTemplate = cachedTranslatedCompilator(urlString);

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    if (['image', 'file', 'video'].indexOf(type) === -1) {
        throw new Error(`Unsupported media type: ${type}`);
    }

    const condition = getCondition(params, 'Media condition');

    return (req, res) => {
        if (condition && !condition(req, res)) {
            return ret;
        }

        const data = stateData(req, res);
        const sendUrl = urlTemplate(data);

        res[type](sendUrl, true);

        return ret;
    };
}

module.exports = media;
