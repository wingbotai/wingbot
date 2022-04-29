/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const getCondition = require('../utils/getCondition');
const { stateData, cachedTranslatedCompilator } = require('./utils');

/** @typedef {import('../BuildRouter').BotContext} BotContext */
/** @typedef {import('../Router').Resolver} Resolver */

/**
 *
 * @param {object} params
 * @param {BotContext} context
 * @returns {Resolver}
 */
function media (params, context = {}) {
    const { isLastIndex } = context;
    const { type, url } = params;

    const urlString = url || '';

    const urlTemplate = cachedTranslatedCompilator(urlString);

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    if (['image', 'file', 'video'].indexOf(type) === -1) {
        throw new Error(`Unsupported media type: ${type}`);
    }

    const condition = getCondition(params, context, 'Media condition');

    return (req, res) => {
        if (condition && !condition(req, res)) {
            return ret;
        }

        const data = stateData(req, res, context.configuration);
        const sendUrl = urlTemplate(data);

        res[type](sendUrl, true);

        return ret;
    };
}

module.exports = media;
