/*
 * @author David Menger
 */
'use strict';

/**
 * @typedef {object} TemplateContext
 * @prop {string} [appUrl]
 * @prop {string} [token]
 * @prop {string} [senderId]
 * @prop {Function} [translator]
 */

/**
 * @class
 */
class BaseTemplate {

    /**
     * Creates an instance of BaseTemplate.
     *
     * @param {Function} onDone
     * @param {TemplateContext} [context]
     */
    constructor (onDone, context = {}) {
        this.onDone = onDone;

        this.context = {
            appUrl: '',
            token: '',
            senderId: '',
            translator: (w) => w,
            path: ''
        };

        Object.assign(this.context, context);

        this._t = this.context.translator;
    }

    getTemplate () {
        throw new Error('NOT IMPLEMENTED!');
    }

    send () {
        this.onDone(this.getTemplate());
    }

    _imageUrl (image) {
        return image.match(/^https?:/)
            ? image
            : `${this.context.appUrl}${image}`;
    }

}

module.exports = BaseTemplate;
