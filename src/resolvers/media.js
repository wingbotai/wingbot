/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const { stateData, cachedTranslatedCompilator } = require('./utils');

function media ({ type, url }, { isLastIndex }) {

    const urlString = url || '';

    const urlTemplate = cachedTranslatedCompilator(urlString);

    if (['image', 'file', 'video'].indexOf(type) === -1) {
        throw new Error(`Unsupported media type: ${type}`);
    }

    return (req, res) => {
        const data = stateData(req, res);
        const sendUrl = urlTemplate(data);

        res[type](sendUrl, true);

        return isLastIndex ? Router.END : Router.CONTINUE;
    };
}

module.exports = media;
