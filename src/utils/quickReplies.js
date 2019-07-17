/*
 * @author David Menger
 */
'use strict';

const { makeAbsolute } = require('./pathUtils');
const { tokenize } = require('./tokenizer');

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
 *
 * @param {Object|Object[]|null} replies
 * @param {string} [path]
 * @param {Function} [translate=w => w]
 * @param {Object[]} [quickReplyCollector]
 * @returns {{ quickReplies: Object[], expectedKeywords: Object[] }}
 */
function makeQuickReplies (replies, path = '', translate = w => w, quickReplyCollector = []) {

    const expectedKeywords = [];

    let iterate = replies;

    // if there are no replies and quickReplyCollector collector
    // has only "_justToExisting" items, skip it
    if (!iterate
        && quickReplyCollector.every(q => q._justToExisting)) {

        return { quickReplies: [], expectedKeywords };
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

            const absoluteAction = makeAbsolute(action, path);

            let payload = absoluteAction;
            const data = Object.assign({}, reply);

            delete data.title;
            delete data.action;
            delete data.match;

            if (Object.keys(data).length > 0) {
                payload = {
                    action: absoluteAction,
                    data
                };
                payload = JSON.stringify(payload);
            }

            const translatedTitle = translate(title);
            const expect = makeExpectedKeyword(absoluteAction, translatedTitle, match, data);
            expectedKeywords.push(expect);

            return {
                content_type: 'text',
                title: translatedTitle,
                payload
            };
        });

    return { quickReplies, expectedKeywords };
}

/**
 *
 *
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

module.exports = {
    makeQuickReplies,
    quickReplyAction
};
