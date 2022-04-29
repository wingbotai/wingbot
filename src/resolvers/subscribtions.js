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
function subscribtions (params, context) {
    const {
        tags = [],
        unsetTag = false
    } = params;

    const condition = getCondition(params, context, 'subscribtions');

    const ret = context.isLastIndex ? Router.END : Router.CONTINUE;
    const method = unsetTag ? 'unsubscribe' : 'subscribe';

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

        if (typeof res[method] !== 'function') {
            return ret;
        }

        if (tags.length === 0 && unsetTag) {
            // @ts-ignore
            res.unsubscribe();
        }

        tags.forEach((tag) => res[method](tag));

        return ret;
    };
}

module.exports = subscribtions;
