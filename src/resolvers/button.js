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

function button (params, {
    isLastIndex,
    linksMap,
    linksTranslator,
    allowForbiddenSnippetWords
}) {
    const {
        buttons = [],
        text = null
    } = params;
    const compiledText = cachedTranslatedCompilator(text);

    const condition = getCondition(params, '', allowForbiddenSnippetWords);

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

        processButtons(
            buttons,
            state,
            tpl,
            linksMap,
            req.senderId,
            linksTranslator,
            allowForbiddenSnippetWords,
            req,
            res
        );

        tpl.send();

        return ret;
    };
}

module.exports = button;
