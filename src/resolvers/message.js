/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const customFn = require('../utils/customFn');
const { cachedTranslatedCompilator, stateData } = require('./utils');

function parseReplies (replies, linksMap, allowForbiddenSnippetWords) {
    return replies.map((reply) => {

        const condition = reply.hasCondition
            ? customFn(reply.conditionFn, 'Quick reply condition', allowForbiddenSnippetWords)
            : () => true;

        if (reply.isLocation) {
            return {
                isLocation: true,
                condition
            };
        }
        if (reply.isEmail) {
            return {
                isEmail: true,
                condition
            };
        }
        if (reply.isPhone) {
            return {
                isPhone: true,
                condition
            };
        }

        let { action } = reply;

        if (!action) {
            action = linksMap.get(reply.targetRouteId);

            if (action === '/') {
                action = './';
            }
        }

        const ret = {
            action,
            condition,
            title: reply.title
                ? cachedTranslatedCompilator(reply.title)
                : null,
            data: {}
        };

        if (reply.trackAsNegative) {
            Object.assign(ret.data, { _trackAsNegative: true });
        }

        if (reply.setState) {
            Object.assign(ret, { setState: reply.setState });
        }

        if (reply.aiTags && reply.aiTags.length > 0) {
            Object.assign(ret, { match: reply.aiTags });
        }

        return ret;
    });
}

function message (params, {
    isLastIndex, isLastMessage, linksMap, allowForbiddenSnippetWords
}) {
    if (typeof params.text !== 'string' && !Array.isArray(params.text)) {
        throw new Error('Message should be a text!');
    }

    const textTemplate = cachedTranslatedCompilator(params.text);

    let quickReplies = null;

    if (params.replies && !Array.isArray(params.replies)) {
        throw new Error('Replies should be an array');
    } else if (params.replies && params.replies.length > 0) {
        quickReplies = parseReplies(params.replies, linksMap, allowForbiddenSnippetWords);
    }

    let condition = null;

    if (params.hasCondition) {
        condition = customFn(params.conditionFn, 'Message condition', allowForbiddenSnippetWords);
    }

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    return (req, res) => {
        if (condition !== null) {
            if (!condition(req, res)) {
                return ret;
            }
        }

        const data = stateData(req, res);
        const text = textTemplate(data);

        if (quickReplies) {
            const okQuickReplies = quickReplies
                .filter((reply) => reply.condition(req, res));

            const sendReplies = okQuickReplies
                .filter((reply) => reply.title
                    || reply.isLocation
                    || reply.isEmail
                    || reply.isPhone)
                .map((reply) => {
                    const rep = (reply.isLocation || reply.isEmail || reply.isPhone)
                        ? ({ ...reply })
                        : ({ ...reply, title: reply.title(data) });

                    if (typeof rep.condition === 'function') {
                        delete rep.condition;
                    }

                    return rep;
                });

            res.text(text, sendReplies);

            okQuickReplies
                .filter((reply) => !reply.title && reply.match)
                .forEach((reply) => {
                    res.expectedIntent(reply.match, reply.action, reply.data);
                });
        } else {
            // replies on last index will be present, so the addQuickReply will be working
            const sendReplies = isLastMessage ? [] : undefined;
            res.text(text, sendReplies);
        }

        return ret;
    };
}

module.exports = message;
