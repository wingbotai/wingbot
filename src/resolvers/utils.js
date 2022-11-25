/*
 * @author David Menger
 */
'use strict';

const hbs = require('./hbs');
const stateData = require('../utils/stateData');
const getCondition = require('../utils/getCondition');

const ASPECT_SQUARE = 'square';
const ASPECT_HORISONTAL = 'horisontal';

const TYPE_SHARE = 'element_share';
const TYPE_URL = 'web_url';
const TYPE_URL_WITH_EXT = 'web_url_extension';
const TYPE_POSTBACK = 'postback';
const TYPE_ATTACHMENT = 'attachment';

const WEBVIEW_FULL = 'full';
const WEBVIEW_TALL = 'tall';
const WEBVIEW_COMPACT = 'compact';

/**
 * @typedef {Translation[] | Translation | string[] | string} Translations
 */

/**
 * @typedef {object} TextObject
 * @prop {string} t - text
 * @prop {string} l - lang
 * @prop {string|null} p - purpose
 */

/**
 * @typedef Translation
 * @property {string|string[]} t - text alternatives
 * @property {string | null} l - language
 * @property {string|string[]} [p] - purposes
 * null = default + voice
 * t = text
 * v = voice
 * s = ssml
 */

function isArrayOfObjects (translations) {
    return Array.isArray(translations)
        && typeof translations[0] === 'object'
        && translations[0] !== null;
}

function isTextObjectEmpty (text) {
    if (!text || !text.t) {
        return true;
    }
    if (Array.isArray(text.t)) {
        return !text.t.some((t) => !!t);
    }
    return false;
}

/**
 * @param {Translations} translations
 * @param {string} [lang]
 * @param {boolean} [defaultToOtherLang] - if true and translation for language is not found,
 * it will try to find translation for other language
 * @returns {null|string}
 */
function getLanguageText (translations, lang = null, defaultToOtherLang = true) {
    let foundText;

    if (isArrayOfObjects(translations)) {
        if (lang) {
            // @ts-ignore
            foundText = translations.find((t) => t.l === lang);
        }
        if (isTextObjectEmpty(foundText) && defaultToOtherLang) {
            // @ts-ignore
            foundText = translations.find((t) => !isTextObjectEmpty(t));
        }
        foundText = foundText ? foundText.t : null;
    } else {
        foundText = translations;
    }
    if (Array.isArray(foundText)) {
        foundText = foundText.filter((f) => !!f);

        if (foundText.length === 0) {
            return '';
        }
    }
    return foundText || '';
}
/**
 *
 * @param {Translations} translations
 * @param {string} [lang]
 * @returns {TextObject[]}
 */
function getLanguageTextObjects (translations, lang = null) {
    /** @type {{t:string|string[],l?:string,p?:string|string[]}[]} */
    let foundTexts;

    if (!Array.isArray(translations) || typeof translations[0] === 'string') {
        // @ts-ignore
        foundTexts = [{ t: translations, l: lang }];
    } else { // is array of objects
        foundTexts = translations
            // @ts-ignore
            .filter(({ l = null, ...to }) => l === lang && !isTextObjectEmpty(to));

        if (foundTexts.length === 0) {
            const { l: firstNonEmptyLang = null } = translations
                // @ts-ignore
                .find((to) => !isTextObjectEmpty(to)) || {};

            foundTexts = translations
                // @ts-ignore
                .filter(({ l = null, ...to }) => l === firstNonEmptyLang && !isTextObjectEmpty(to));
        }
    }

    return foundTexts
        .reduce((a, to) => {
            if (Array.isArray(to.t)) {
                const purposes = Array.isArray(to.p)
                    ? to.p
                    : [to.p];
                a.push(
                    ...to.t.map((t, i) => ({
                        ...to, t, p: purposes[i] || null
                    }))
                );
            } else {
                a.push(to);
            }
            return a;
        }, [])
        .filter((to) => !!to.t)
        .map(({
            t, l = null, p = null, ...rest
        }) => ({
            t, l, p, ...rest
        }));
}

function randomizedCompiler (text, lang) {
    const texts = getLanguageText(text, lang);

    if (!Array.isArray(texts)) {
        return hbs.compile(texts);
    }
    if (texts.length === 1) {
        return hbs.compile(texts[0]);
    }

    return (...args) => {
        const [data = {}] = args;

        if (data._expandRandomTexts) {
            return texts
                .map((t, i) => {
                    let compiled;
                    if (typeof t !== 'function') {
                        compiled = hbs.compile(t);
                        texts[i] = compiled;
                    } else {
                        compiled = t;
                    }
                    return compiled(...args);
                })
                .join(' ');
        }

        const index = Math.floor(Math.random() * texts.length);
        if (typeof texts[index] !== 'function') {
            texts[index] = hbs.compile(texts[index]);
        }
        return texts[index](...args);
    };
}

/**
 * l - language
 * t - alternatives
 *
 * @param {{l:string,t:string[]}[] | string} text
 * @returns {(state:any)=>string}
 */
function cachedTranslatedCompilator (text) {
    const cache = new Map();

    return (state) => {
        const { lang: key = '-', lang } = state;
        let renderer = cache.get(key);
        if (!renderer) {
            renderer = randomizedCompiler(text, lang);
            cache.set(key, renderer);
        }
        return renderer(state);
    };
}

function getText (text, state) {
    const renderer = randomizedCompiler(text, state.lang);
    return renderer(state);
}

// eslint-disable-next-line no-unused-vars
const DEFAULT_LINK_TRANSLATOR = (senderId, text, url, isExtUrl, state, pageId) => url;

/** @typedef {import('../BuildRouter').BotContext} BotContext */

function processButtons (
    buttons,
    state,
    elem,
    senderId,
    context,
    req,
    res
) {
    const translateLinks = context.linksTranslator || DEFAULT_LINK_TRANSLATOR;

    buttons.forEach(({
        title: btnTitle,
        action: btnAction,
        hasCondition,
        conditionFn,
        hasEditableCondition,
        editableCondition,
        setState
    }) => {

        if (hasCondition) {
            const condition = getCondition({
                hasCondition, conditionFn, hasEditableCondition, editableCondition
            }, context, 'Button condition');

            if (!condition(req, res)) {
                return;
            }
        }

        const btnTitleText = getText(btnTitle, state);
        const defaultText = getText(btnTitle, { lang: null });
        const {
            type,
            url,
            webviewHeight = WEBVIEW_TALL,
            targetRouteId,
            action,
            payload
        } = btnAction;

        const isExtUrl = type === TYPE_URL_WITH_EXT;

        switch (type) {
            case TYPE_URL:
            case TYPE_URL_WITH_EXT: {
                const hasExtention = type === TYPE_URL_WITH_EXT;
                let urlText = getText(url, state);
                urlText = translateLinks(
                    senderId,
                    defaultText,
                    urlText,
                    isExtUrl,
                    state,
                    req.pageId
                );
                elem.urlButton(btnTitleText, urlText, hasExtention, webviewHeight);
                break;
            }
            case TYPE_POSTBACK: {
                let postbackAction = context.linksMap.get(targetRouteId) || action;

                if (postbackAction === '/') {
                    postbackAction = './';
                } else if (!postbackAction) {
                    return;
                }

                elem.postBackButton(btnTitleText, postbackAction, {}, setState);
                break;
            }
            case TYPE_SHARE:
                elem.shareButton(btnTitleText);
                break;
            case TYPE_ATTACHMENT:
                elem.attachmentButton(btnTitleText, payload);
                break;
            default:
        }
    });
}

module.exports = {
    getLanguageText,
    getLanguageTextObjects,
    cachedTranslatedCompilator,
    randomizedCompiler,
    getText,
    stateData,

    ASPECT_SQUARE,
    ASPECT_HORISONTAL,

    TYPE_SHARE,
    TYPE_URL,
    TYPE_URL_WITH_EXT,
    TYPE_POSTBACK,

    WEBVIEW_FULL,
    WEBVIEW_TALL,
    WEBVIEW_COMPACT,

    processButtons
};
