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
    stateData,
    getLanguageText,
    getLanguageTextObjects,
    randomizedCompiler,
    cachedTranslatedCompilator
} = require('./utils');
const {
    FEATURE_SSML, FEATURE_TEXT, FEATURE_VOICE
} = require('../features');

/** @typedef {import('../Responder').VoiceControl} VoiceControl */
/** @typedef {import('./utils').Translations} Translations */
/** @typedef {import('./utils').TextObject} TextObject */
/**
 * Returns voice control props from params
 *
 * @param {any} params
 * @param {string} lang
 * @returns {null | VoiceControl}
 */
function getVoiceControlFromParams (params, lang = null) {
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

function parseReplies (replies, linksMap, context) {
    return replies.map((reply) => {

        const condition = getCondition(reply, context, 'Quick reply condition');

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

        if (!action) {
            return null;
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
    })
        .filter((r) => r !== null);
}

/**
 * @param {Translations} text
 * @param {string[]} features
 * @param {string} lang
 * @returns {{translations:TextObject[],ssmlAlternatives:string[] | null}}
 */
function findSupportedMessages (text, features, lang = null) {
    let translations = getLanguageTextObjects(text, lang);

    const useSSML = features.includes(FEATURE_SSML);
    const useText = features.includes(FEATURE_TEXT);
    const useVoice = features.includes(FEATURE_VOICE);

    // filter out SSML alternatives - they will be used in voice control
    let ssmlAlternatives = translations.filter((t) => t.p === 's').map((t) => t.t);
    if (ssmlAlternatives.length === 0 || !useSSML) {
        ssmlAlternatives = null;
    }

    translations = translations.filter((t) => t.p !== 's');

    // find supported text alternatives
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

/** @typedef {import('../BuildRouter').BotContext} BotContext */
/** @typedef {import('../Router').Resolver} Resolver */

/**
 *
 * @param {object} params
 * @param {BotContext} context
 * @returns {Resolver}
 */
function message (params, context = {}) {
    const {
        // @ts-ignore
        isLastIndex, isLastMessage, linksMap, configuration
    } = context;
    if (typeof params.text !== 'string' && !Array.isArray(params.text)) {
        throw new Error('Message should be a text!');
    }

    // parse quick replies
    let quickReplies = null;
    if (params.replies && !Array.isArray(params.replies)) {
        throw new Error('Replies should be an array');
    } else if (params.replies && params.replies.length > 0) {
        quickReplies = parseReplies(params.replies, linksMap, context);
    }

    // compile condition
    const condition = getCondition(params, context, 'Message condition');

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    /**
     * @param {Request} req
     * @param {Responder} res
     */
    return (req, res) => {
        const data = stateData(req, res, configuration);

        // filter supported messages
        const supportedText = findSupportedMessages(
            params.text,
            req.features,
            data.lang
        );

        // find random alternative
        const textTemplate = randomizedCompiler([{
            l: data.lang,
            t: supportedText.translations.map((x) => x.t)
        }]);

        const text = textTemplate(data)
            .trim();

        res.setData({ $this: text });
        if (condition && !condition(req, res)) {
            res.setData({ $this: null });
            return ret;
        }
        res.setData({ $this: null });

        let sendReplies;
        if (quickReplies) {
            sendReplies = quickReplies
                .filter((reply) => reply.title
                    || reply.isLocation
                    || reply.isEmail
                    || reply.isPhone)
                .map((reply) => {
                    let $this = null;
                    let rep;

                    if (reply.isLocation || reply.isEmail || reply.isPhone) {
                        rep = { ...reply };
                    } else {
                        const title = reply.title(data);
                        $this = title;
                        rep = { ...reply, title };
                    }

                    if (typeof rep.condition !== 'function') {
                        return rep;
                    }

                    res.setData({ $this });
                    if (!rep.condition(req, res)) {
                        res.setData({ $this: null });
                        return null;
                    }
                    res.setData({ $this: null });

                    delete rep.condition;

                    return rep;
                })
                .filter((rep) => rep !== null);

            quickReplies
                .filter((reply) => !reply.title && reply.match && reply.condition(req, res))
                .forEach(({
                    match, action, data: replyData, setState, aiTitle
                }) => {
                    res.expectedIntent(match, action, replyData, setState, aiTitle);
                });
        } else {
            // replies on last index will be present, so the addQuickReply will be working
            sendReplies = isLastMessage ? [] : undefined;
        }

        // generate voice control
        let voiceControl = getVoiceControlFromParams(params, data.lang);
        if (supportedText.ssmlAlternatives) {
            // find SSML alternative
            const ssmlAlternativeTemplate = randomizedCompiler([{
                l: data.lang,
                t: supportedText.ssmlAlternatives
            }]);

            voiceControl = {
                ...voiceControl,
                ssml: ssmlAlternativeTemplate(data)
                    .trim()
            };
        }

        res.text(text, sendReplies, voiceControl);

        if (isLastMessage && !req.actionData()._resolverTag) {
            res.finalMessageSent = true;
        }

        return ret;
    };
}

module.exports = message;
