/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router');
const {
    getText,
    stateData,
    processButtons,
    ASPECT_HORISONTAL,
    ASPECT_SQUARE,
    WEBVIEW_TALL,
    TYPE_POSTBACK,
    TYPE_URL,
    TYPE_SHARE,
    TYPE_URL_WITH_EXT
} = require('./utils');
const { shouldExecuteResolver } = require('./resolverTags');

function carousel (params, { isLastIndex, linksMap, linksTranslator = (a, b, c) => c }) {
    const {
        items = [],
        shareable = false,
        imageAspect = ASPECT_HORISONTAL
    } = params;

    const ret = isLastIndex ? Router.END : Router.CONTINUE;

    const fn = (req, res) => {
        if (items.length === 0) {
            return ret;
        }
        if (!shouldExecuteResolver(req, params)) {
            return ret;
        }

        const state = stateData(req, res);
        const isSquare = imageAspect === ASPECT_SQUARE;
        const tpl = res.genericTemplate(shareable, isSquare);

        items.forEach(({
            image,
            title,
            subtitle,
            buttons = [],
            action = null
        }) => {
            const titleText = getText(title, state);
            const subtitleText = getText(subtitle, state);

            const elem = tpl.addElement(titleText, subtitleText || null, true);

            if (image) {
                const imageUrl = getText(image, state);
                elem.setElementImage(imageUrl);
            }

            const { senderId } = req;

            if (action && typeof action === 'object') {
                const {
                    type, webviewHeight = WEBVIEW_TALL, url, targetRouteId
                } = action;

                const isExtUrl = type === TYPE_URL_WITH_EXT;

                switch (type) {
                    case TYPE_URL:
                    case TYPE_URL_WITH_EXT: {
                        const hasExtension = type === TYPE_URL_WITH_EXT;
                        const textLabel = titleText || subtitleText;
                        let urlText = getText(url, state);
                        urlText = linksTranslator(senderId, textLabel, urlText, isExtUrl, state);
                        elem.setElementAction(urlText, hasExtension, webviewHeight);
                        break;
                    }
                    case TYPE_POSTBACK: {
                        let postbackAction = linksMap.get(targetRouteId);

                        if (postbackAction === '/') {
                            postbackAction = './';
                        } else if (!postbackAction) {
                            return;
                        }

                        elem.setElementActionPostback(postbackAction);
                        break;
                    }
                    case TYPE_SHARE:
                        res.setElementActionShare();
                        break;
                    default:
                }
            }

            processButtons(buttons, state, elem, linksMap, senderId, linksTranslator);
        });

        tpl.send();

        return ret;
    };

    if (params.resolverTag) {
        fn.globalIntentsMeta = {
            resolverTag: params.resolverTag
        };
    }

    return fn;
}

module.exports = carousel;
