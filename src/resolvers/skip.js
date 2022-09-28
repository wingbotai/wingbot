/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const getCondition = require('../utils/getCondition');

/** @typedef {import('../BuildRouter').BotContext} BotContext */
/** @typedef {import('../Router').Resolver} Resolver */

/**
 *
 * @param {object} params
 * @param {BotContext} context
 * @returns {Resolver}
 */
function skip (params, context = {}) {
    const { isLastIndex } = context;
    const { type } = params;

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    if (['skip', 'end', 'intent'].indexOf(type) === -1) {
        throw new Error(`Unsupported skip type: ${type}`);
    }

    const condition = getCondition(params, context, 'Skip condition');

    return (req, res, postBack) => {
        if (condition && !condition(req, res)) {
            return ret;
        }

        switch (type) {
            case 'end':
                return Router.END;
            case 'skip':
                return Router.BREAK;
            case 'intent': {
                let { lastAiActionsIndex = 0 } = req.actionData();
                const actions = req.aiActions();
                lastAiActionsIndex++;
                if (!actions[lastAiActionsIndex] || !actions[lastAiActionsIndex].aboveConfidence) {
                    return Router.BREAK;
                }
                postBack(actions[lastAiActionsIndex].action, { lastAiActionsIndex });
                return Router.END;
            }

            default:
                return ret;
        }
    };
}

module.exports = skip;
