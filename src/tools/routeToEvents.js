/**
 * @author {David Menger}
 */
'use strict';

const Responder = require('../Responder');
const Request = require('../Request');
const ReturnSender = require('../ReturnSender');
const BuildRouter = require('../BuildRouter');

/**
 * @typedef {object} Resolver
 * @prop {string} type
 * @prop {object} params
 */

/**
 * @typedef {object} Result
 * @prop {object[]} events
 * @prop {object} setState
 * @prop {string[]} subscribe
 * @prop {string[]} unsubscribe
 */

/**
 *
 * @param {string} pageId
 * @param {string} senderId
 * @param {object} state
 * @param {Resolver[]} resolvers
 * @returns {Promise<Result>}
 */
async function routeToEvents (pageId, senderId, state, resolvers) {
    const event = Request.postBack(senderId, '/notification');
    const returnSender = new ReturnSender({}, senderId, event);

    const subscribe = [];
    const unsubscribe = [];

    const req = new Request(event, state, pageId);
    const res = new Responder(senderId, returnSender);

    Object.assign(res, {
        subscribe (tag) { subscribe.push(tag); },
        unsubscribe (tag) { unsubscribe.push(tag); }
    });

    // @ts-ignore
    const router = new BuildRouter({
        // @ts-ignore
        routes: [
            {
                path: 'notification',
                resolvers
            }
        ]
    });

    await router.reduce(req, res);
    await returnSender.finished(req, res);

    delete res.newState._lastAction;
    delete res.newState._lastVisitedPath;
    delete res.newState.lastAction;

    return {
        events: returnSender.responses,
        setState: res.newState,
        subscribe,
        unsubscribe
    };
}

module.exports = routeToEvents;
