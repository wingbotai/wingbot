/*
 * @author David Menger
 */
'use strict';

const BaseTemplate = require('./BaseTemplate');
const { makeAbsolute } = require('../utils');

/**
 * @typedef MarkdownPayload
 * @prop {"text/markdown"} contentType
 * @prop {string} content
 * @prop {string} [className]
 */

/**
 * Designer payload type
 *
 * @typedef {MarkdownPayload} Payload
 */

/**
 * @typedef EncodedPayload
 * @prop {string} content
 * @prop {"text/markdown"} content_type
 * @prop {string} [class_name]
 */

/**
 * Encodes different types of payloads from designer snapshot to payload for chat
 * Content is Base64 encoded.
 *
 * @param {Payload} payload
 * @returns {EncodedPayload}
 */
function encodePayload ({ content, contentType, className }) {
    return {
        content: Buffer.from(content).toString('base64'),
        content_type: contentType,
        ...(className && { class_name: className })
    };
}

/**
 * Helps with creating of button template
 * Instance of button template is returned by {Responder}
 *
 * @class
 * @extends BaseTemplate
 */
class ButtonTemplate extends BaseTemplate {

    constructor (onDone, context, text) {
        super(onDone, context);

        this.text = text;
        this.buttons = [];
    }

    _makeExtensionUrl (url, hasExtension) {
        if (hasExtension && !`${url}`.match(/#.+/)) {
            const hash = [
                `token=${encodeURIComponent(this.context.token)}`,
                `senderId=${encodeURIComponent(this.context.senderId)}`
            ];
            const ret = `${url}#${hash.join('&')}`;

            // prepend url only when url does not contain sheme
            if (ret.match(/^https?:\/\//) || !this.context.appUrl) {
                return ret;
            }

            return `${this.context.appUrl}${ret}`;
        }
        return url;
    }

    /**
     * Adds button. When `hasExtension` is set to `true`, url will contain hash like:
     * `#token=foo&senderId=23344`
     *
     * @param {string} title - button text
     * @param {string} linkUrl - button url
     * @param {boolean} hasExtension - includes token in url
     * @param {string} [webviewHeight=null] - compact|tall|full
     * @param {string} [onCloseAction] - close action for webview
     * @param {object} [onCloseData] - data
     * @returns {this}
     *
     * @memberOf ButtonTemplate
     */
    urlButton (
        title,
        linkUrl,
        hasExtension = false,
        webviewHeight = null,
        onCloseAction = null,
        onCloseData = {}
    ) {
        const btn = {
            type: 'web_url',
            title: this._t(title),
            url: this._makeExtensionUrl(linkUrl, hasExtension),
            webview_height_ratio: webviewHeight || (hasExtension ? 'tall' : 'full'),
            messenger_extensions: hasExtension
        };
        // on_close_payload
        if (onCloseAction) {
            Object.assign(btn, {
                on_close_payload: this._createPayload(onCloseAction, onCloseData)
            });
        }

        this.buttons.push(btn);
        return this;
    }

    /**
     * Adds button, which makes another action
     *
     * @param {string} title - Button title
     * @param {string} action - Button action (can be absolute or relative)
     * @param {object} [data={}] - Action data
     * @param {object} [setState] - SetState data
     * @returns {this}
     *
     * @memberOf ButtonTemplate
     */
    postBackButton (title, action, data = {}, setState = null) {
        this.buttons.push({
            type: 'postback',
            title: this._t(title),
            payload: this._createPayload(action, data, setState)
        });
        return this;
    }

    _createPayload (action, data, setState = null) {
        const hasSetState = setState && Object.keys(setState).length !== 0;

        return JSON.stringify({
            action: makeAbsolute(action, this.context.path),
            data: {
                _ca: this.context.currentAction,
                ...data
            },
            ...(hasSetState ? { setState } : {})
        });
    }

    /**
     * Adds button, which opens a popup with content on click.
     *
     * @param {string} title
     * @param {Payload} payload
     * @returns {this}
     *
     * @example
     * res.button('text')
     *  .attachmentButton('button title', {
     *      content: '# Heading 1',
     *      contentType: 'text/markdown',
     *      className: 'my-class-for-markdown'
     *   })
     *  .send();
     *
     */
    attachmentButton (title, payload) {
        this.buttons.push({
            type: 'attachment',
            title: this._t(title),
            payload: encodePayload(payload)
        });
        return this;
    }

    /**
     *
     * @returns {this}
     *
     * @memberOf ButtonTemplate
     */
    shareButton () {
        this.buttons.push({
            type: 'element_share'
        });
        return this;
    }

    getTemplate () {
        const res = {
            template_type: 'button',
            text: this._t(this.text),
            buttons: this.buttons
        };
        return res;
    }

}

module.exports = ButtonTemplate;
