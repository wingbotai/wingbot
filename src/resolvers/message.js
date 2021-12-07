/*
 * @author David Menger
 */
'use strict';
// eslint-disable-next-line no-unused-vars
const Responder = require('../Responder');
// eslint-disable-next-line no-unused-vars
const Request = require('../Request');
const Router = require('../Router');
const getCondition = require('../utils/getCondition');
const { cachedTranslatedCompilator, stateData, getLanguageText } = require('./utils');
const {
    // eslint-disable-next-line no-unused-vars
    FEATURE_SSML, FEATURE_TEXT, FEATURE_VOICE, FEATURE_PHRASES
} = require('../features');

/**
 * l - lang
 * t - alternatives
 * p - features
 * [null, 't', 'v', 's']
 *
 * @param {{l:string,t:string[],p:string[]} | string} text
 * @param {string} feature
 * @returns {boolean}
 */
function textSupportsFeature (text, feature) {
    if (typeof text === 'string') return feature === FEATURE_TEXT;

    // no purpose - default to text & voice
    if (!text.p || !Array.isArray(text.p)) {
        return feature === FEATURE_TEXT || feature === FEATURE_VOICE;
    }

    // find the short representation
    let featureShortcut;
    if (feature === FEATURE_SSML) { featureShortcut = 's'; }
    if (feature === FEATURE_TEXT) { featureShortcut = 't'; }
    if (feature === FEATURE_VOICE) { featureShortcut = 'v'; }

    return text.p.includes(featureShortcut);
}

/**
 *
 * @param {{l:string,t:string[],p:string[]}[]} text
 * @param {string[]} supportedFeatures
 * @returns {{l:string,t:string[],p:string[]}[]}
 */
function findSupportedMessages (text, supportedFeatures) {
    if (typeof text === 'string' || !Array.isArray(text)) {
        return text;
    }

    const trimmedText = [];

    if (supportedFeatures.includes(FEATURE_SSML)) {
        trimmedText.push(...text.filter((t) => textSupportsFeature(t, FEATURE_SSML)));

        // use just SSML when found
        if (trimmedText.length > 0) {
            return trimmedText;
        }
    }

    if (supportedFeatures.includes(FEATURE_VOICE) || supportedFeatures.includes(FEATURE_SSML)) {
        trimmedText.push(...text.filter((t) => textSupportsFeature(t, FEATURE_VOICE)));

        // SSML is supported, however no SSML messages were found, so use voice
        if (trimmedText.length > 0 && supportedFeatures.includes(FEATURE_SSML)) {
            return trimmedText;
        }
    }

    if (supportedFeatures.includes(FEATURE_TEXT)) {
        trimmedText.push(...text.filter((t) => textSupportsFeature(t, FEATURE_TEXT)));
    }

    return trimmedText;
}

/**
 *
 * @param {any} params
 * @param {string} lang
 * @returns {null | import('../Responder').VoiceControl}
 */
function getVoiceControl (params, lang) {
    const voiceControl = {};

    const voiceControlProps = ['speed', 'pitch', 'volume', 'voice', 'style', 'language'];

    voiceControlProps.forEach((prop) => {
        if (params[prop]) {
            voiceControl[prop] = getLanguageText(params[prop], lang);
        }
    });

    // if voiceControl is empty, return null
    return Object.keys(voiceControl).length > 0 ? voiceControl : null;
}

function parseReplies (replies, linksMap, allowForbiddenSnippetWords) {
    return replies.map((reply) => {

        const condition = getCondition(reply, 'Quick reply condition', allowForbiddenSnippetWords);

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

        if (reply.aiTitle) {
            Object.assign(ret, { aiTitle: reply.aiTitle });
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

    let quickReplies = null;

    if (params.replies && !Array.isArray(params.replies)) {
        throw new Error('Replies should be an array');
    } else if (params.replies && params.replies.length > 0) {
        quickReplies = parseReplies(params.replies, linksMap, allowForbiddenSnippetWords);
    }

    const condition = getCondition(params, 'Message condition', allowForbiddenSnippetWords);

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    /**
     * @param {Request} req
     * @param {Responder} res
     */
    return (req, res) => {
        if (condition && !condition(req, res)) {
            return ret;
        }

        const supportedText = findSupportedMessages(params.text, req.getSupportedFeatures());
        if (supportedText.length === 0) {
            return ret;
        }

        const textTemplate = cachedTranslatedCompilator(supportedText);

        const data = stateData(req, res);
        const text = textTemplate(data)
            .trim();

        let sendReplies;
        if (quickReplies) {
            const okQuickReplies = quickReplies
                .filter((reply) => reply.condition(req, res));

            sendReplies = okQuickReplies
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

            okQuickReplies
                .filter((reply) => !reply.title && reply.match)
                .forEach(({
                    match, action, data: replyData, setState, aiTitle
                }) => {
                    res.expectedIntent(match, action, replyData, setState, aiTitle);
                });
        } else {
            // replies on last index will be present, so the addQuickReply will be working
            sendReplies = isLastMessage ? [] : undefined;
        }

        const voiceControl = getVoiceControl(params, data.lang);
        res.text(text, sendReplies, voiceControl);

        return ret;
    };
}

module.exports = message;
