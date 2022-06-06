/**
 * @author David Menger
 */
'use strict';

/**
 * @enum {string}
 */
const BOUNCE_ALLOW = {
    NOT_ALLOWED: null,
    ALLOWED_TO_FAQ: 'faq',
    ALLOWED: 'allow'
};

/**
 * @enum {string}
 */
const BOUNCE_RETURN = {
    HERE: 'here',
    INTERACTION: 'inta',
    NO_RETURN: 'not',
    IF_POSSIBLE: 'ifpos'
};

/** @typedef {import('../BuildRouter').Route} Route */

/** @typedef {BOUNCE_RETURN} BounceReturn */
/** @typedef {BOUNCE_ALLOW} BounceAllow */

/**
 *
 *
 * @param {Route} route
 * @param {boolean} nextRouteIsSameResponder
 * @param {string} [referredRoutePath]
 * @returns {Function|null}
 */
function bounce (route, nextRouteIsSameResponder, referredRoutePath = null) {
    if (!route.bounceAllowedTo) {
        return null;
    }

    /**
     * @param {import('../Request')} req
     * @param {import('../Responder')} res
     * @param {Function} postback
     */
    async function responder (req, res, postback) {
        const winner = req.aiActionsWinner();

        if (!winner) {
            // eslint-disable-next-line no-unneeded-ternary
            return nextRouteIsSameResponder ? false : true; // continue
        }

        const actionIsFaq = winner.meta.resolverTag === 'faq';

        const bounceAllowed = route.bounceAllowedTo === BOUNCE_ALLOW.ALLOWED
            || (route.bounceAllowedTo === BOUNCE_ALLOW.ALLOWED_TO_FAQ && actionIsFaq);

        if (!bounceAllowed) {
            // eslint-disable-next-line no-unneeded-ternary
            return nextRouteIsSameResponder ? false : true; // continue
        }

        let resolverTagData = {};

        if (actionIsFaq && route.bounceReturn !== BOUNCE_RETURN.NO_RETURN) {
            resolverTagData = {
                _resolverTag: 'faq'
            };
        }

        // do the setstate
        if (winner.setState) {
            Object.assign(req.state, winner.setState);
            res.setState(winner.setState);
        }

        await postback(winner.action, resolverTagData, true);

        switch (route.bounceReturn) {
            case BOUNCE_RETURN.NO_RETURN:
                return -1; // Router.ENDED_PREVIOUSLY
            case BOUNCE_RETURN.INTERACTION:
                if (referredRoutePath) {
                    postback(referredRoutePath);
                }
                return null;
            case BOUNCE_RETURN.IF_POSSIBLE:
                return actionIsFaq ? true : -1; // Router.ENDED_PREVIOUSLY
            case BOUNCE_RETURN.HERE:
            default:
                return true;
        }
    }

    return responder;
}

module.exports = bounce;
