/*
 * @author David Menger
 */
'use strict';

const { makeAbsolute } = require('./pathUtils');
const { tokenize } = require('./tokenizer');
const { FLAG_DISAMBIGUATION_SELECTED } = require('../flags');

function makeExpectedKeyword (action, title, matcher = null, payloadData = {}) {
    let match = null;

    if (matcher instanceof RegExp) {
        match = matcher.toString().replace(/^\/|\/$/g, '');
    } else if (typeof matcher === 'string') {
        match = `^${tokenize(matcher)}$`;
    } else {
        // make matcher from title
        match = `^${tokenize(title)}$`;
    }

    return {
        action,
        title,
        match,
        data: payloadData
    };
}

/**
 *
 * @ignore
 * @param {Object|Object[]|null} replies
 * @param {string} [path]
 * @param {Function} [translate=w => w]
 * @param {Object[]} [quickReplyCollector]
 * @returns {{quickReplies:Object[],expectedKeywords:Object[],disambiguationIntents:string[]}}
 */
function makeQuickReplies (replies, path = '', translate = w => w, quickReplyCollector = []) {

    const expectedKeywords = [];
    const disambiguationIntents = [];

    let iterate = replies;

    // if there are no replies and quickReplyCollector collector
    // has only "_justToExisting" items, skip it
    if (!iterate
        && quickReplyCollector.every(q => q._justToExisting)) {

        return { quickReplies: [], expectedKeywords, disambiguationIntents };
    }


    if (!Array.isArray(iterate)) {
        iterate = Object.keys(replies)
            .map((action) => {
                const value = replies[action];

                if (typeof value === 'object') {
                    return Object.assign({}, value, { action });
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
                action,
                match,
                isLocation = false,
                isEmail = false,
                isPhone = false
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
            const data = Object.assign({}, reply);

            delete data.title;
            delete data.action;
            delete data.match;

            if (Object.keys(data).length > 0) {
                if (data._senderMeta
                    && data._senderMeta.flag === FLAG_DISAMBIGUATION_SELECTED) {

                    const { likelyIntent } = data._senderMeta;
                    disambiguationIntents.push(likelyIntent);
                }

                payload = {
                    action: absoluteAction,
                    data
                };
                payload = JSON.stringify(payload);
            }

            const translatedTitle = translate(title);
            const expect = makeExpectedKeyword(absoluteAction, translatedTitle, match, data);
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

/**
 *
 * @ignore
 * @param {Object[]} expectedKeywords
 * @param {string} normalizedText
 * @param {string} text
 * @returns {null|Object}
 */
function quickReplyAction (expectedKeywords, normalizedText, text) {
    if (!text) {
        return null;
    }

    const exactMatch = expectedKeywords
        .filter(keyword => keyword.title === text);

    if (exactMatch.length === 1) {
        return exactMatch[0];
    }

    if (!normalizedText) {
        return null;
    }

    const found = expectedKeywords
        .filter(keyword => normalizedText.match(new RegExp(keyword.match)));

    if (found.length !== 1) {
        return null;
    }

    return found[0] || null;
}

/**
 * Create a disambiguation quick reply
 *
 * @param {string} title - quick reply title
 * @param {string} likelyIntent - possible intent
 * @param {string} disambText - users text input
 * @param {string} action - action to process the disambbiguation
 * @param {Object} data - optional data
 */
function disambiguationQuickReply (title, likelyIntent, disambText, action, data = {}) {
    return {
        ...data,
        title,
        action,
        _senderMeta: {
            flag: FLAG_DISAMBIGUATION_SELECTED,
            likelyIntent,
            disambText
        }
    };
}

module.exports = {
    makeQuickReplies,
    quickReplyAction,
    disambiguationQuickReply
};
