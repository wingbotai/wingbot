/**
 * @author David Menger
 */
'use strict';

const DIALOG_CONTEXT = 'd';
const EXPIRES_AFTER = 't';

/** @typedef {import('../Request')} Request */
/** @typedef {import('../Responder')} Responder */

const VAR_TYPES = {
    DIALOG_CONTEXT,
    EXPIRES_AFTER
};

/**
 * @type {object} Helpers for `res.setState()` method
 */
const vars = {

    /**
     * Sets variable, which will be removed, when user leaves the dialogue.
     * **Variable will be available at first interaction of next dialogue.**
     * Then it will be removed.
     *
     * @param {string} key
     * @param {*} value
     * @returns {object}
     * @example
     * const { vars } = require('wingbot');
     * res.setState(vars.dialogContext('myKey', 'foovalue'))
     */
    dialogContext (key, value) {
        return {
            [key]: value,
            [`_~${key}`]: { t: DIALOG_CONTEXT }
        };
    },

    /**
     * Sets variable, which will be removed after specified number of conversation turonovers
     *
     * @param {string} key
     * @param {*} value
     * @param {number} turnovers
     * @returns {object}
     * @example
     * const { vars } = require('wingbot');
     * res.setState(vars.expiresAfter('myKey', 'foovalue', 4))
     */
    expiresAfter (key, value, turnovers) {
        return {
            [key]: value,
            [`_~${key}`]: { t: EXPIRES_AFTER, c: turnovers + 1 }
        };
    },

    /**
     * Sets variable while preserving its metadata
     *
     * @param {string} key
     * @param {*} value
     * @param {object} state
     * @returns {object}
     * @example
     * const { vars } = require('wingbot');
     * res.setState(vars.expiresAfter('myKey', 'foovalue', 4))
     */
    preserveMeta (key, value, state) {
        const meta = {};
        const metaKey = `_~${key}`;

        if (state[metaKey] && typeof state[metaKey].t === 'string') {
            Object.assign(meta, { [metaKey]: state[metaKey] });
        }

        return {
            [key]: value,
            ...meta
        };
    }
};

function checkSetState (setState, newState) {
    // process management state keys
    // eslint-disable-next-line guard-for-in
    for (const key in setState) { // eslint-disable-line no-restricted-syntax
        const match = key.match(/^_~(.+)$/);

        if (!match) {
            const metaKey = `_~${key}`;

            if (typeof setState[metaKey] === 'undefined'
                && newState[metaKey]) {

                delete newState[metaKey]; // eslint-disable-line no-param-reassign
            }
        }

    }
}

/**
 *
 * @private
 * @param {object} previousState
 * @param {Request} req
 * @param {Responder} res
 * @param {{state:object}} senderStateUpdate
 * @param {boolean} firstInTurnover
 * @param {boolean} lastInTurnover
 */
function mergeState (previousState, req, res, senderStateUpdate, firstInTurnover, lastInTurnover) {
    const state = { ...previousState, ...res.newState };

    const isUserEvent = req.isMessage() || req.isPostBack()
        || req.isReferral() || req.isAttachment()
        || req.isTextOrIntent();

    // reset expectations
    if (isUserEvent && !res.newState._expected) {
        state._expected = null;
    }

    // reset expected keywords
    if (isUserEvent && !res.newState._expectedKeywords) {
        state._expectedKeywords = null;
    }

    // process management state keys
    // eslint-disable-next-line guard-for-in
    for (const key in previousState) { // eslint-disable-line no-restricted-syntax
        const match = key.match(/^_~(.+)$/);
        if (!match) {
            continue;
        }
        const value = previousState[key];
        if (typeof value !== 'object' || !value) {
            continue;
        }
        const [, referencedKey] = match;
        if (typeof res.newState[referencedKey] !== 'undefined') {
            // someone tried to set the property from the outside

            // remove the meta, if not set with property
            if (typeof res.newState[key] === 'undefined') {
                delete state[key];
            }
            continue;
        }
        switch (value.t) {
            case DIALOG_CONTEXT:
                if (previousState._lastVisitedPath !== res.newState._lastVisitedPath) {
                    delete state[key];
                    delete state[referencedKey];
                }
                break;
            case EXPIRES_AFTER:
                if (lastInTurnover) {
                    const setTurnovers = (value.c - 1) || 0;
                    if (setTurnovers > 0) {
                        state[key] = { t: EXPIRES_AFTER, c: setTurnovers };
                    } else {
                        delete state[key];
                        delete state[referencedKey];
                    }
                }
                break;
            default:
                // nothing
        }
    }
    // console.log(JSON.stringify({ previousState, newState: res.newState }, null, 2));

    // reset expected confident input
    if (isUserEvent
        && typeof state._expectedConfidentInput !== 'undefined'
        && !res.newState._expectedConfidentInput) {
        state._expectedConfidentInput = false;
    }

    if (senderStateUpdate && senderStateUpdate.state) {
        Object.assign(state, senderStateUpdate.state);
    }

    return state;
}

module.exports = {
    VAR_TYPES,
    mergeState,
    vars,
    checkSetState
};
