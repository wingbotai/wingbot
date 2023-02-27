/**
 * @author David Menger
 */
'use strict';

const SESSION_DIALOGUE_CONTEXT = 'sd';
const SESSION_CONTEXT = 's';
const DIALOG_CONTEXT = 'd';
const EXPIRES_AFTER = 't';

/** @typedef {import('../Request')} Request */
/** @typedef {import('../Responder')} Responder */

const VAR_TYPES = {
    DIALOG_CONTEXT,
    EXPIRES_AFTER,
    SESSION_DIALOGUE_CONTEXT,
    SESSION_CONTEXT
};

const DIALOGUE_CONTEXT_TYPES = [DIALOG_CONTEXT, SESSION_DIALOGUE_CONTEXT];

const vars = {

    /**
     * Clears variable with it's metadata
     *
     * @param {string} key
     * @returns {object}
     */
    clear (key) {
        return {
            [key]: null
        };
    },

    /**
     * Sets variable, which will be removed, when user leaves the dialogue.
     * **Variable will be available at first interaction of next dialogue.**
     * Then it will be removed.
     *
     * @param {string} key
     * @param {*} value
     * @param {string|boolean} [path]
     * @returns {object}
     * @example
     * const { vars } = require('wingbot');
     * res.setState(vars.dialogContext('myKey', 'foovalue'))
     */
    dialogContext (key, value, path = null) {
        return {
            [key]: value,
            [`_~${key}`]: {
                t: DIALOG_CONTEXT,
                ...(path && { p: path })
            }
        };
    },

    /**
     * Sets variable, which will be removed, when new session is created.
     * **When `dialoguePath` argument is provided, the variable will NOT expire,
     * when the new session will continue in the same dialogue**
     *
     * @param {string} key
     * @param {*} value
     * @param {string|boolean} [dialoguePath] - keeps context also within a dialogue
     * @returns {object}
     * @example
     * const { vars } = require('wingbot');
     * res.setState(vars.sessionContext('myKey', 'foovalue'))
     */
    sessionContext (key, value, dialoguePath = false) {
        return {
            [key]: value,
            [`_~${key}`]: {
                t: dialoguePath === false ? SESSION_CONTEXT : SESSION_DIALOGUE_CONTEXT,
                ...(dialoguePath && { p: dialoguePath })
            }
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
            [`_~${key}`]: { t: EXPIRES_AFTER, c: turnovers }
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
     * res.setState(vars.preserveMeta('myKey', 'foovalue', req.state))
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
 * @param {Request} req
 * @returns {boolean}
 */
function isUserInteraction (req) {
    return !req.campaign
        && !req.event.pass_thread_control
        && !req.isSetContext()
        && (req.isMessage() || req.isPostBack()
            || req.isReferral() || req.isAttachment()
            || req.isTextOrIntent());
}

function prepareState (state, firstInTurnover, sessionCreated) {
    if (!sessionCreated) {
        return;
    }

    // set right path, when path was set
    // eslint-disable-next-line guard-for-in
    for (const key in state) { // eslint-disable-line no-restricted-syntax
        const match = key.match(/^_~(.+)$/);
        if (!match) {
            continue;
        }
        const value = state[key];
        const [, referencedKey] = match;

        if (value.t === SESSION_CONTEXT) {
            delete state[key]; // eslint-disable-line no-param-reassign
            delete state[referencedKey]; // eslint-disable-line no-param-reassign
        }

        if (value.t === SESSION_DIALOGUE_CONTEXT) {
            if (value.p === state._lastVisitedPath && value.p !== undefined) {
                // context still matches - make it just DIALOGUE_CONTEXT
                state[key] = { // eslint-disable-line no-param-reassign
                    t: DIALOG_CONTEXT,
                    p: value.p
                };
            } else {
                delete state[key]; // eslint-disable-line no-param-reassign
                delete state[referencedKey]; // eslint-disable-line no-param-reassign
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

    const isUserEvent = isUserInteraction(req);

    // reset expectations
    if (isUserEvent && !res.newState._expected) {
        state._expected = null;
    }

    // reset expected keywords
    if (isUserEvent && !res.newState._expectedKeywords) {
        state._expectedKeywords = null;
    }

    // set right path, when path was set
    // eslint-disable-next-line guard-for-in
    for (const key in res.newState) { // eslint-disable-line no-restricted-syntax
        const match = key.match(/^_~(.+)$/);
        if (!match) {
            continue;
        }
        const value = res.newState[key];
        if (DIALOGUE_CONTEXT_TYPES.includes(value.t) && typeof value.p === 'undefined'
            && res.newState._lastVisitedPath !== undefined) {

            Object.assign(value, { p: res.newState._lastVisitedPath });
        }
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
            case SESSION_DIALOGUE_CONTEXT: {
                if (!lastInTurnover || previousState._lastVisitedPath === undefined) {
                    break;
                }
                if (value.p === true) {
                    state[key].p = res.newState._lastVisitedPath;
                }
                break;
            }
            case DIALOG_CONTEXT: {
                // compare state

                if (!lastInTurnover || previousState._lastVisitedPath === undefined) {
                    break;
                }

                if (value.p === true) {
                    state[key].p = res.newState._lastVisitedPath;
                } else if (value.p !== res.newState._lastVisitedPath) {
                    delete state[key];
                    delete state[referencedKey];
                }

                // if (lastInTurnover
                //     && previousState._lastVisitedPath !== undefined
                //     && value.p !== res.newState._lastVisitedPath) {

                //     delete state[key];
                //     delete state[referencedKey];
                // }

                break;
            }

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
    prepareState,
    mergeState,
    vars,
    checkSetState,
    isUserInteraction
};
