/*
 * @author David Menger
 */
'use strict';

const hbs = require('./hbs');

const ASPECT_SQUARE = 'square';
const ASPECT_HORISONTAL = 'horisontal';

const TYPE_SHARE = 'element_share';
const TYPE_URL = 'web_url';
const TYPE_URL_WITH_EXT = 'web_url_extension';
const TYPE_POSTBACK = 'postback';

const WEBVIEW_FULL = 'full';
const WEBVIEW_TALL = 'tall';
const WEBVIEW_COMPACT = 'compact';

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
 *
 * @param {{t:string,l:string}[]|string} translations
 * @param {string} [lang]
 * @returns {null|string}
 */
function getLanguageText (translations, lang = null) {
    let foundText;
    if (isArrayOfObjects(translations)) {
        if (lang) {
            foundText = translations.find((t) => t.l === lang);
        }
        if (isTextObjectEmpty(foundText)) {
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

function stateData (req, res = null) {
    return {

        ...req.state,
        ...(res ? res.newState : {}),
        ...req.actionData(),
        ...(res ? res.data : {})
    };
}

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

function processButtons (
    buttons,
    state,
    elem,
    linksMap,
    senderId,
    // eslint-disable-next-line no-unused-vars
    linksTranslator = (sndr, defaultText, urlText, isExtUrl, reqState) => urlText
) {
    buttons.forEach(({
        title: btnTitle,
        action: btnAction
    }) => {
        const btnTitleText = getText(btnTitle, state);
        const defaultText = getText(btnTitle, { lang: null });
        const {
            type,
            url,
            webviewHeight = WEBVIEW_TALL,
            targetRouteId
        } = btnAction;

        const isExtUrl = type === TYPE_URL_WITH_EXT;

        switch (type) {
            case TYPE_URL:
            case TYPE_URL_WITH_EXT: {
                const hasExtention = type === TYPE_URL_WITH_EXT;
                let urlText = getText(url, state);
                urlText = linksTranslator(senderId, defaultText, urlText, isExtUrl, state);
                elem.urlButton(btnTitleText, urlText, hasExtention, webviewHeight);
                break;
            }
            case TYPE_POSTBACK: {
                let postbackAction = linksMap.get(targetRouteId);

                if (postbackAction === '/') {
                    postbackAction = './';
                } else if (!postbackAction) {
                    return;
                }

                elem.postBackButton(btnTitleText, postbackAction);
                break;
            }
            case TYPE_SHARE:
                elem.shareButton(btnTitleText);
                break;
            default:
        }
    });
}

module.exports = {
    getLanguageText,
    cachedTranslatedCompilator,
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
