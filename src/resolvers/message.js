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
    cachedTranslatedCompilator,
    renderMessageText
} = require('./utils');
const {
    FEATURE_SSML, FEATURE_TEXT, FEATURE_VOICE
} = require('../features');
const { vars, VAR_TYPES } = require('../utils/stateVariables');

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

    // @see VoiceControl src/Responder.js
    const voiceControlProps = [
        'voice',
        'language',
        'style',
        'speed',
        'pitch',
        'volume',
        'timeout',
        'minTimeout',
        'endTimeout',
        'recognitionLanguage',
        'recognitionEngine'
    ];

    voiceControlProps.forEach((prop) => {
        if (params[prop]) {
            // for voice control do not default to other languages
            voiceControl[prop] = getLanguageText(params[prop], lang, true);
        }
    });

    // remove empty values ("")
    Object.keys(voiceControl).forEach((key) => {
        if (voiceControl[key] === '') {
            delete voiceControl[key];
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

const MODE_RANDOM = 'r';
const MODE_SEQUENCE = 's';
const MODE_RANDOM_START_SEQUENCE = 'rs';

const ALL_MODES = [MODE_RANDOM, MODE_SEQUENCE, MODE_RANDOM_START_SEQUENCE];

function selectTranslation (resolverId, params, texts, data) {
    const key = `_R_${resolverId}`;
    let { lang, [key]: seqState } = data;

    if (texts.length <= 1) {
        return [
            texts[0] ? renderMessageText(texts[0].t, data) : '',
            seqState && resolverId
                ? vars.expiresAfter(key, null, 1)
                : {}
        ];
    }

    const { mode, persist = null } = params;

    if ((!mode || mode === MODE_RANDOM) && data._expandRandomTexts === true) {
        return [
            texts.map((x) => renderMessageText(x.t, data))
                .join('\n'),
            {}
        ];
    }

    if (!lang) {
        const [firstText = { l: null }] = getLanguageTextObjects(params.text);
        lang = firstText.l || 'X';
    }

    if (mode === MODE_RANDOM || !ALL_MODES.includes(mode)) {
        const index = data._expandRandomTexts
            ? 1
            : Math.floor(Math.random() * texts.length);

        return [
            renderMessageText(texts[index].t, data),
            seqState
                ? vars.expiresAfter(key, null, 1)
                : {}
        ];
    }

    if (!seqState
        || seqState.l !== lang
        || seqState.n > texts.length
        || seqState.i >= texts.length) {

        seqState = {
            l: lang,
            n: texts.length,
            i: mode === MODE_SEQUENCE ? 0 : Math.floor(Math.random() * texts.length)
        };

        if (mode === MODE_RANDOM_START_SEQUENCE && data._expandRandomTexts) {
            seqState.i = 1;
        }
    } else {
        seqState = {
            ...seqState,
            i: (seqState.i + 1) % texts.length
        };
    }

    let setState;

    if (persist === VAR_TYPES.SESSION_CONTEXT) {
        setState = vars.sessionContext(key, seqState);
    } else if (persist === VAR_TYPES.SESSION_DIALOGUE_CONTEXT) {
        setState = vars.sessionContext(key, seqState, null); // same as interaction
    } else if (persist === VAR_TYPES.DIALOG_CONTEXT) {
        setState = vars.dialogContext(key, seqState);
    } else {
        setState = {
            [key]: seqState
        };
    }

    return [
        renderMessageText(texts[seqState.i].t, data),
        setState
    ];
}

/** @typedef {import('../BuildRouter').BotContext<any>} BotContext */
/** @typedef {import('../Router').Resolver<any>} Resolver */

/**
 *
 * @param {object} params
 * @param {any} params.text
 * @param {boolean} [params.hasCondition]
 * @param {string} [params.conditionFn]
 * @param {string} [params.conditionDesc]
 * @param {boolean} [params.hasEditableCondition]
 * @param {any} [params.editableCondition]
 * @param {string} [params.mode]
 * @param {string} [params.persist]
 * @param {any[]} [params.replies]
 * @param {"message" | "prompt"} [params.type]
 * @param {string} [params.llmContextType]
 * @param {BotContext} context
 * @returns {Resolver}
 */
function message (params, context = {}) {
    const {
        // @ts-ignore
        isLastIndex, isLastMessage, linksMap, configuration, resolverId
    } = context;

    if (typeof params.text !== 'string' && !Array.isArray(params.text)) {
        throw new Error('Message should be a text!');
    }

    if (params.type === 'prompt') {
        return async (req, res) => {
            const session = await res.llmSessionWithHistory(params.llmContextType);

            const translatedObject = getLanguageText(params.text, req.lang);
            const translatedText = Array.isArray(translatedObject)
                ? translatedObject[0]
                : translatedObject;

            const response = await session.systemPrompt(translatedText)
                .debug()
                .generate();

            // if (response.finishReason && response.finishReason !== 'length') {
            //    // error maybe?
            //    return Router.END;
            // }

            if (!response.content) {
                // no response?
                return Router.CONTINUE;
            }

            res.text(response.content);

            return Router.CONTINUE;
        };
    }

    // parse quick replies
    let quickReplies;
    if (params.replies && !Array.isArray(params.replies)) {
        throw new Error('Replies should be an array');
    }

    // compile condition
    let condition;

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    /**
     * @param {Request} req
     * @param {Responder} res
     */
    return (req, res) => {
        if (condition === undefined) {
            condition = getCondition(params, context, 'Message condition');
        }
        if (quickReplies === undefined) {
            if (params.replies && params.replies.length > 0) {
                quickReplies = parseReplies(params.replies, linksMap, context);
            } else {
                quickReplies = null;
            }
        }

        const data = stateData(req, res, configuration);

        // filter supported messages
        const supportedText = findSupportedMessages(
            params.text,
            req.features,
            data.lang
        );

        const [text, seqState] = selectTranslation(
            resolverId,
            params,
            supportedText.translations,
            data
        );

        res.setState(seqState);
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
