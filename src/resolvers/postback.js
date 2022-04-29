/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const getCondition = require('../utils/getCondition');
const { shouldExecuteResolver } = require('./resolverTags');

/** @typedef {import('../BuildRouter').BotContext} BotContext */
/** @typedef {import('../Router').Resolver} Resolver */

/**
 *
 * @param {object} params
 * @param {BotContext} context
 * @returns {Resolver}
 */
function postback (params, context) {
    const { linksMap, isLastIndex } = context;
    const {
        routeId,
        postBack: staticAction
    } = params;
    let action = staticAction;

    if (!action && routeId) {
        action = linksMap.get(routeId);

        if (action === '/') {
            action = './';
        }
    }

    const condition = getCondition(params, context, 'postback');

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    return (req, res, postBack) => {
        if (!action || !shouldExecuteResolver(req, params)) {
            return ret;
        }

        let data = {};

        if (condition !== null) {
            const condRes = condition(req, res);

            if (!condRes) {
                return ret;
            }

            if (condRes instanceof Promise || typeof condRes === 'object') {
                data = condRes;
            }
        }

        const text = req.text();
        const request = {
            sender: { id: req.senderId },
            postback: {
                action: routeId ? res.toAbsoluteAction(action) : action,
                data: data || {}
            }
        };

        if (text) {
            Object.assign(request, { message: { text } });
        }

        postBack(request);

        return routeId ? Router.END : ret;
    };
}

module.exports = postback;
