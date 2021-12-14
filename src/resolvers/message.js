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
const {
    stateData, getLanguageText, getLanguageTextObjects, randomizedCompiler
} = require('./utils');
const {
    // eslint-disable-next-line no-unused-vars
    FEATURE_SSML, FEATURE_TEXT, FEATURE_VOICE, FEATURE_PHRASES
} = require('../features');

/**
 * Returns voice control props from params
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
                ? randomizedCompiler(reply.title)
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

/**
 * @param {import('./utils').Translations} text
 * @param {string[]} features
 * @param {string} lang
 * @returns {{translations: import('./utils').TextObject[],ssmlAlternatives:string[] | null}}
 */
function findSupportedMessages (text, features, lang = null) {
    let translations = getLanguageTextObjects(text, lang);

    const useSSML = features.includes(FEATURE_SSML);
    const useText = features.includes(FEATURE_TEXT);
    const useVoice = features.includes(FEATURE_VOICE);

    let ssmlAlternatives = translations.filter((t) => t.p === 's').map((t) => t.t);
    if (ssmlAlternatives.length === 0 || !useSSML) {
        ssmlAlternatives = null;
    }

    translations = translations.filter((t) => t.p !== 's');

    const textHasSSML = !ssmlAlternatives;

    // filter out unsupported SSML
    if (!useSSML && textHasSSML) {
        translations = translations.filter((t) => t.p !== 's');
    }

    translations = translations.filter((translation) => {
        // always use text+voice
        if (!translation.p) {
            return true;
        }

        // text only
        if (useText && translation.p === 't') {
            return true;
        }

        // voice (& SSML) only
        if (useVoice && translation.p === 'v') {
            return true;
        }

        return false;
    });

    return {
        translations,
        ssmlAlternatives
    };
}

function message (params, {
    // @ts-ignore
    isLastIndex, isLastMessage, linksMap, allowForbiddenSnippetWords
} = {}) {

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
        const data = stateData(req, res);

        const supportedText = findSupportedMessages(
            params.text,
            req.getSupportedFeatures(),
            data.lang
        );

        const textTemplate = randomizedCompiler([{
            l: data.lang,
            t: supportedText.translations.map((x) => x.t)
        }]);

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

        let voiceControl = getVoiceControl(params, data.lang);
        if (supportedText.ssmlAlternatives) {
            if (!voiceControl) {
                voiceControl = {};
            }

            // get SSML alternative
            const ssmlAlternativeTemplate = randomizedCompiler([{
                l: data.lang,
                t: supportedText.ssmlAlternatives
            }]);

            voiceControl.ssml = ssmlAlternativeTemplate(data)
                .trim();
        }

        res.text(text, sendReplies, voiceControl);

        return ret;
    };
}

module.exports = message;
