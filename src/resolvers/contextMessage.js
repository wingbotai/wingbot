/*
 * @author Vojtech Jedlicka
 */
'use strict';

const Router = require('../Router');
// eslint-disable-next-line no-unused-vars
const Responder = require('../Responder');
const { getLanguageText } = require('./utils');
const compileWithState = require('../utils/compileWithState');

/** @typedef {import('../BuildRouter').BotContext<any>} BotContext */
/** @typedef {import('../Router').Resolver<any>} Resolver */
/** @typedef {import('./utils').Translations} Translations */

/**
 *
 * @param {object} params
 * @param {Translations} params.context
 * @param {string} [params.type]
 * @param {BotContext} context
 * @returns {Resolver}
 */
// eslint-disable-next-line no-unused-vars
function contextMessage (params, context) {

    return async (req, res) => {
        const translated = getLanguageText(params.context, req.state.lang);
        const translatedText = Array.isArray(translated) ? translated[0] : translated;
        const statefulPrompt = compileWithState(req, res, translatedText);

        res.llmAddSystemPrompt(statefulPrompt, params.type);

        return Router.CONTINUE;
    };
}

module.exports = contextMessage;
