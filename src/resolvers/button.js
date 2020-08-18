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
const { shouldExecuteResolver } = require('./resolverTags');

function button (params, {
    isLastIndex,
    linksMap,
    linksTranslator,
    allowForbiddenSnippetWords
}) {
    const {
        buttons = [],
        text = null,
        hasCondition,
        conditionFn
    } = params;
    const compiledText = cachedTranslatedCompilator(text);

    let condition = null;

    if (hasCondition) {
        condition = customFn(conditionFn, '', allowForbiddenSnippetWords);
    }

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    const fn = (req, res) => {
        if (buttons.length === 0) {
            return ret;
        }
        if (!shouldExecuteResolver(req, params)) {
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

    if (params.resolverTag) {
        fn.globalIntentsMeta = {
            resolverTag: params.resolverTag
        };
    }

    return fn;
}

module.exports = button;
