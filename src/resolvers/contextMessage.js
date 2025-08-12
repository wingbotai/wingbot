/*
 * @author Vojtech Jedlicka
 */
'use strict';

const Router = require('../Router');
// eslint-disable-next-line no-unused-vars
const Responder = require('../Responder');
const { getLanguageText } = require('./utils');
const compileWithState = require('../utils/compileWithState');
const LLM = require('../LLM');

/** @typedef {import('../BuildRouter').BotContext<any>} BotContext */
/** @typedef {import('../Router').Resolver<any>} Resolver */
/** @typedef {import('./utils').Translations} Translations */
/** @typedef {import('../LLM').EvaluationRule} EvaluationRule */

/**
 * @typedef {object} ContextMessageParams
 * @property {Translations} context
 * @property {string} [type]
 * @property {EvaluationRule[]} [rules]
 */

/**
 *
 * @param {ContextMessageParams} params
 * @param {BotContext} context
 * @returns {Resolver}
 */
// eslint-disable-next-line no-unused-vars
function contextMessage (params, context) {

    const { rules = [] } = params;
    const preprocessedRules = LLM.preprocessEvaluationRules(rules, context);

    return async (req, res) => {
        res.llmAddInstructions((r) => {
            const translated = getLanguageText(params.context, req.state.lang);
            const translatedText = Array.isArray(translated) ? translated[0] : translated;
            const statefulPrompt = compileWithState(req, r, translatedText);
            return statefulPrompt;
        }, params.type);

        preprocessedRules.forEach((rule) => res.llmAddResultRule(
            rule,
            undefined,
            undefined,
            params.type
        ));

        return Router.CONTINUE;
    };
}

module.exports = contextMessage;
