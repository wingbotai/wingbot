/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const customFn = require('../utils/customFn');
const { cachedTranslatedCompilator, stateData } = require('./utils');

function parseReplies (replies, linksMap) {
    return replies.map((reply) => {

        const condition = reply.hasCondition
            ? eval(reply.conditionFn) // eslint-disable-line no-eval
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

        const replyData = Object.assign({}, reply);

        if (action) {
            delete replyData.action;
        } else {
            action = linksMap.get(reply.targetRouteId);
            delete replyData.targetRouteId;

            if (action === '/') {
                action = './';
            }
        }

        if (reply.trackAsNegative) {
            Object.assign(replyData, { _trackAsNegative: true });
        }

        const title = cachedTranslatedCompilator(replyData.title);

        return Object.assign(replyData, {
            action,
            condition,
            title
        });
    });
}


function message (params, { isLastIndex, linksMap, allowForbiddenSnippetWords }) {
    if (typeof params.text !== 'string' && !Array.isArray(params.text)) {
        throw new Error('Message should be a text!');
    }

    const textTemplate = cachedTranslatedCompilator(params.text);

    let replies = null;

    if (params.replies && !Array.isArray(params.replies)) {
        throw new Error('Replies should be an array');
    } else if (params.replies && params.replies.length > 0) {
        replies = parseReplies(params.replies, linksMap);
    }

    let condition = null;

    if (params.hasCondition) {
        condition = customFn(params.conditionFn, '', allowForbiddenSnippetWords);
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

        if (replies) {
            const sendReplies = replies
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
            const sendReplies = isLastIndex ? [] : undefined;
            res.text(text, sendReplies);
        }

        return ret;
    };
}

module.exports = message;
