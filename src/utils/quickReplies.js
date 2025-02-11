/*
 * @author David Menger
 */
'use strict';

const { makeAbsolute } = require('./pathUtils');
const { tokenize } = require('./tokenizer');
const { ResponseFlag } = require('../analytics/consts');
const { checkSetState } = require('./stateVariables');

/** @typedef {import('../Request')} Request */
/** @typedef {import('../Ai')} Ai */

/**
 * @typedef {object} ExpectedKeyword
 * @prop {string} action
 * @prop {string} title
 * @prop {null|string|string[]} match
 * @prop {object} data
 * @prop {boolean} [hasAiTitle]
 * @prop {object} [setState]
 */

/**
 *
 * @param {string} action
 * @param {string} title
 * @param {RegExp|string|string[]} [matcher]
 * @param {object} [payloadData]
 * @param {object} [setState]
 * @param {string} [aiTitle]
 * @returns {ExpectedKeyword}
 */
function makeExpectedKeyword (
    action,
    title,
    matcher = null,
    payloadData = {},
    setState = null,
    aiTitle = null
) {
    let match = null;

    if (Array.isArray(matcher)) {
        match = matcher;
    } else if (matcher instanceof RegExp) {
        match = `#${matcher.source}#`;
    } else if (typeof matcher === 'string') {
        match = matcher.startsWith('#')
            ? matcher
            : `#${tokenize(matcher)}`;
    } else {
        // make matcher from title
        match = `#${tokenize(title)}`;
    }

    const ret = {
        action,
        title,
        match,
        data: payloadData
    };

    if (setState) Object.assign(ret, { setState });
    if (aiTitle) Object.assign(ret, { title: aiTitle, hasAiTitle: true });

    return ret;
}

/** @typedef {import('../Responder').QuickReply} QuickReply */

const THIS_REGEX = /\{\{\$this\}\}/g;

function hasThis (val) {
    return typeof val === 'string' && val.match(THIS_REGEX);
}

function replaceThis (val, title) {
    return val.replace(THIS_REGEX, title);
}

/**
 *
 * @ignore
 * @param {object|QuickReply[]|null} replies
 * @param {string} [path]
 * @param {Function} [translate=w => w]
 * @param {object[]} [quickReplyCollector]
 * @param {Ai} ai
 * @param {string} [currentAction]
 * @returns {{quickReplies: object[], expectedKeywords: object[], disambiguationIntents: string[]}}
 */
function makeQuickReplies (replies, path = '', translate = (w) => w, quickReplyCollector = [], ai = null, currentAction = null) {

    const expectedKeywords = [];
    const disambiguationIntents = [];

    let iterate = replies;

    // if there are no replies and quickReplyCollector collector
    // has only "_justToExisting" items, skip it
    if (!iterate
        && quickReplyCollector.every((q) => q._justToExisting)) {

        return { quickReplies: [], expectedKeywords, disambiguationIntents };
    }

    if (!iterate) {
        iterate = [];
    } else if (!Array.isArray(iterate)) {
        iterate = Object.keys(replies)
            .map((action) => {
                const value = replies[action];

                if (typeof value === 'object') {
                    return { ...value, action };
                }

                return { title: value, action };
            });
    }

    let unshift = 0;
    quickReplyCollector.forEach((reply) => {
        if (reply._justToExisting) {
            delete reply._justToExisting; // eslint-disable-line no-param-reassign
        }
        if (reply._prepend) {
            delete reply._prepend; // eslint-disable-line no-param-reassign
            iterate.splice(unshift++, 0, reply);
        } else {
            iterate.push(reply);
        }
    });

    const quickReplies = iterate
        .map((reply) => {
            const {
                title,
                aiTitle = null,
                action,
                match,
                data = {},
                isLocation = false,
                isEmail = false,
                isPhone = false,
                useCa = currentAction
            } = reply;
            let {
                setState = null
            } = reply;

            if (isLocation) {
                return {
                    content_type: 'location'
                };
            }

            if (isPhone) {
                return {
                    content_type: 'user_phone_number'
                };
            }

            if (isEmail) {
                return {
                    content_type: 'user_email'
                };
            }

            let absoluteAction = null;

            if (action) {
                absoluteAction = makeAbsolute(action, path);
            }

            let payload = absoluteAction;

            if (match && ai) {
                const rule = ai.matcher.preprocessRule(match);
                const entitiesSetState = ai.matcher.getSetStateForEntityRules(rule);

                if (Object.keys(entitiesSetState).length !== 0) {
                    if (!setState) {
                        setState = entitiesSetState;
                    } else {
                        checkSetState(setState, entitiesSetState);
                        // all entities within setState should be removed
                        setState = Object.keys(setState)
                            .reduce((o, k) => {
                                const setStateEntity = k.startsWith('@')
                                    && setState[k]
                                    && setState[k]
                                    && setState[k]._$entity;
                                const cleanEntityName = setStateEntity
                                    && `${setStateEntity}`.replace(/^@/, '');

                                if (setStateEntity
                                    && typeof entitiesSetState[`@${cleanEntityName}`] === 'string') {
                                    Object.assign(o, {
                                        [k]: {
                                            ...setState[k],
                                            _$ev: entitiesSetState[`@${cleanEntityName}`]
                                        }
                                    });
                                } else {
                                    Object.assign(o, { [k]: setState[k] });
                                }
                                return o;
                            }, {});

                        setState = {
                            ...entitiesSetState,
                            ...setState
                        };
                    }
                }
            }

            const hasData = Object.keys(data).length !== 0;
            const hasSetState = setState && Object.keys(setState).length !== 0;
            const translatedTitle = translate(title, { quickReply: true });

            if (hasSetState) {
                // replace {{this}}
                Object.entries(setState)
                    .forEach(([key, val]) => {
                        if (typeof val === 'object' && val) {
                            Object.entries(val)
                                .forEach(([k, v]) => {
                                    if (k.match(/^_\$/) && hasThis(v)) {
                                        // eslint-disable-next-line no-param-reassign
                                        val[k] = replaceThis(v, translatedTitle);
                                    }
                                });
                        } else if (hasThis(val)) {
                            setState[key] = replaceThis(val, translatedTitle);
                        }
                    });
            }

            if (data._senderMeta
                && data._senderMeta.flag === ResponseFlag.DISAMBIGUATION_SELECTED) {

                const { likelyIntent } = data._senderMeta;
                disambiguationIntents.push(likelyIntent);
            }

            if (payload || hasData || hasSetState) {
                payload = {
                    action: absoluteAction,
                    data: {
                        _ca: useCa,
                        ...data
                    }
                };
                if (hasSetState) Object.assign(payload, { setState });

                payload = JSON.stringify(payload);
            }

            const translatedAiTitle = typeof aiTitle === 'string' ? translate(aiTitle) : aiTitle;
            const expect = makeExpectedKeyword(
                absoluteAction,
                translatedTitle,
                match,
                data,
                setState,
                translatedAiTitle
            );
            expectedKeywords.push(expect);

            const res = {
                content_type: 'text',
                title: translatedTitle
            };

            if (payload) {
                Object.assign(res, {
                    payload
                });
            }

            return res;
        });

    return {
        quickReplies, expectedKeywords, disambiguationIntents
    };
}

/** @typedef {import('../Request').Intent} Intent */

/**
 * @typedef {object} QuickReplyAction
 * @prop {boolean} aboveConfidence
 *
 * @prop {string} action
 * @prop {string} title
 * @prop {null|string|string[]} match
 * @prop {object} data
 * @prop {number} score
 * @prop {number} sort
 *
 * @prop {string} [title]
 * @prop {object} [setState]
 *
 * @prop {string[]} [_aiKeys]
 * @prop {Intent} [intent]
 */

/**
 *
 * @ignore
 * @param {ExpectedKeyword[]} expectedKeywords
 * @param {Request} req
 * @param {Ai} ai
 * @returns {QuickReplyAction[]}
 */
function quickReplyAction (expectedKeywords, req, ai) {
    const text = req.text();

    if (text) {
        const lcText = text.toLocaleLowerCase();
        const lowerCaseMatch = expectedKeywords
            .filter((keyword) => keyword.title && keyword.title.toLocaleLowerCase() === lcText);

        if (lowerCaseMatch.length === 1) {
            return [
                {
                    ...lowerCaseMatch[0],
                    score: 1,
                    sort: 1,
                    aboveConfidence: true
                }
            ];
        }

        const exactMatch = expectedKeywords
            .filter((keyword) => keyword.title === text);

        if (exactMatch.length !== 0) {
            return exactMatch
                .map((e) => ({
                    ...e,
                    score: 1,
                    sort: 1,
                    aboveConfidence: true
                }));
        }
    } else if (!req.isTextOrIntent()) {
        return [];
    }

    const found = [];
    expectedKeywords
        .forEach((keyword) => {
            const intent = ai.ruleIsMatching(keyword.match, req, true);
            if (intent) {
                const { score, setState, aboveConfidence } = intent;
                const _aiKeys = Object.keys(setState);

                found.push({
                    ...keyword,
                    intent,
                    score,
                    sort: score,
                    _aiKeys,
                    aboveConfidence,
                    setState: keyword.setState
                        ? { ...keyword.setState, ...setState }
                        : { ...setState }
                });

                for (const alternative of intent.alternatives) {
                    found.push({
                        ...keyword,
                        intent: alternative,
                        score: alternative.score,
                        sort: alternative.score - 0.0001,
                        _aiKeys: Object.keys(alternative.setState),
                        aboveConfidence: alternative.aboveConfidence,
                        setState: keyword.setState
                            ? { ...keyword.setState, ...alternative.setState }
                            : { ...alternative.setState }
                    });
                }
            }
        });

    found.sort(({ sort: a }, { sort: z }) => z - a);

    return found;
}

/**
 * Create a disambiguation quick reply
 *
 * @deprecated
 * @param {string} title - quick reply title
 * @param {string} likelyIntent - possible intent
 * @param {string} disambText - users text input
 * @param {string} action - action to process the disambbiguation
 * @param {object} data - optional data
 */
function disambiguationQuickReply (title, likelyIntent, disambText, action, data = {}) {
    return {
        ...data,
        title,
        action,
        data: {
            ...data,
            _senderMeta: {
                flag: ResponseFlag.DISAMBIGUATION_SELECTED,
                likelyIntent,
                disambText
            }
        }
    };
}

module.exports = {
    makeQuickReplies,
    quickReplyAction,
    disambiguationQuickReply
};
