/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const getCondition = require('../utils/getCondition');
const {
    stateData,
    cachedTranslatedCompilator,
    processButtons
} = require('./utils');

/** @typedef {import('../BuildRouter').BotContext} BotContext */
/** @typedef {import('../Router').Resolver} Resolver */

/**
 *
 * @param {object} params
 * @param {BotContext} context
 * @returns {Resolver}
 */
function button (params, context) {
    const {
        isLastIndex
    } = context;
    const {
        buttons = [],
        text = null
    } = params;
    const compiledText = cachedTranslatedCompilator(text);

    const condition = getCondition(params, context, 'button');

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    return (req, res) => {
        if (buttons.length === 0) {
            return ret;
        }
        if (condition !== null) {
            if (!condition(req, res)) {
                return ret;
            }
        }

        const state = stateData(req, res, context.configuration);
        const tpl = res.button(compiledText(state));

        processButtons(
            buttons,
            state,
            tpl,
            req.senderId,
            context,
            req,
            res
        );

        tpl.send();

        return ret;
    };
}

module.exports = button;
