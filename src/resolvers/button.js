/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const {
    stateData,
    cachedTranslatedCompilator,
    processButtons,
    customFn
} = require('./utils');

function button ({
    buttons = [],
    text = null,
    hasCondition,
    conditionFn
}, { isLastIndex, linksMap, linksTranslator }) {

    const compiledText = cachedTranslatedCompilator(text);

    let condition = null;

    if (hasCondition) {
        condition = customFn(conditionFn);
    }

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    return async (req, res) => {
        if (buttons.length === 0) {
            return ret;
        }

        if (condition !== null) {
            let condRes = condition(req, res);

            if (condRes instanceof Promise) {
                condRes = await condRes;
            }

            if (!condRes) {
                return ret;
            }
        }

        const state = stateData(req, res);
        const tpl = res.button(compiledText(state));

        processButtons(buttons, state, tpl, linksMap, req.senderId, linksTranslator);

        tpl.send();

        return ret;
    };
}

module.exports = button;
