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
        if (!reply.title) {
            return null;
        }

        let { action } = reply;

        const replyData = {};

        if (!action) {
            action = linksMap.get(reply.targetRouteId);

            if (action === '/') {
                action = './';
            }
        }

        if (reply.trackAsNegative) {
            Object.assign(replyData, { _trackAsNegative: true });
        }

        if (reply.setState) {
            Object.assign(replyData, { _ss: reply.setState });
        }

        const title = cachedTranslatedCompilator(reply.title);

        return Object.assign(replyData, {
            action,
            condition,
            title
        });
    })
        .filter(r => r !== null);
}


function message (params, {
    isLastIndex, isLastMessage, linksMap, allowForbiddenSnippetWords, replies
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

    if (replies) {
        const repliesWithSuggestions = parseReplies(replies, linksMap, allowForbiddenSnippetWords);

        if (repliesWithSuggestions.length > 0) {
            quickReplies = [...(quickReplies || []), ...repliesWithSuggestions];
        }
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
            const sendReplies = quickReplies
                .filter(reply => reply.condition(req, res))
                .map((reply) => {
                    const rep = (reply.isLocation || reply.isEmail || reply.isPhone)
                        ? Object.assign({}, reply)
                        : Object.assign({}, reply, {
                            title: reply.title(data)
                        });

                    if (typeof rep.condition === 'function') {
                        delete rep.condition;
                    }

                    return rep;
                });

            res.text(text, sendReplies);
        } else {
            // replies on last index will be present, so the addQuickReply will be working
            const sendReplies = isLastMessage ? [] : undefined;
            res.text(text, sendReplies);
        }

        return ret;
    };
}

module.exports = message;
