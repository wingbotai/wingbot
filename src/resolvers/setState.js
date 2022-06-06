/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const Ai = require('../Ai');
const { getSetState } = require('../utils/getUpdate');
const getCondition = require('../utils/getCondition');

/** @typedef {import('../BuildRouter').BotContext} BotContext */
/** @typedef {import('../Router').Resolver} Resolver */

/**
 *
 * @param {object} params
 * @param {BotContext} context
 * @returns {Resolver}
 */
function setState (params, context) {

    const condition = getCondition(params, context, 'setState');

    const ret = context.isLastIndex ? Router.END : Router.CONTINUE;

    return async (req, res) => {
        if (condition !== null) {
            let condRes = condition(req, res);

            if (condRes instanceof Promise) {
                condRes = await condRes;
            }

            if (!condRes) {
                return ret;
            }
        }

        const obj = getSetState(params.setState, req, res);
        await Ai.ai.processSetStateEntities(req, setState);
        res.setState(obj);

        return ret;
    };
}

module.exports = setState;
