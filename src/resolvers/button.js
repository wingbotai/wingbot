/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const customFn = require('../utils/customFn');
const {
    stateData,
    cachedTranslatedCompilator,
    processButtons
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

    return (req, res) => {
        if (buttons.length === 0) {
            return ret;
        }

        if (condition !== null) {
            if (!condition(req, res)) {
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
