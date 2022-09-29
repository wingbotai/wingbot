/*
 * @author David Menger
 */
'use strict';

let handlebars;
try {
    // @ts-ignore
    handlebars = module.require('handlebars');

    handlebars.registerHelper('lang', function langHelper (content) {
        if (typeof content !== 'object' || !content) {
            return content;
        }

        if (content.name === 'lang'
            && typeof content.loc === 'object'
            && typeof content.data === 'object'
            && content.data
            && typeof content.data.root === 'object') {

            return this.lang || '';
        }

        const { lang } = this;

        if (content[lang]) {
            return content[lang];
        }

        if (Array.isArray(content)) {
            const entry = content.find((c) => c
                && (!lang || c.l === lang || c.lang === lang) && (c.t || c.text));

            if (entry) {
                return entry.text || entry.t;
            }
        }

        const res = content[Object.keys(content)[0]];

        return res && typeof res === 'object'
            ? (res.text || res.t || '')
            : (res || '');
    });
} catch (er) {
    handlebars = { compile: (text) => () => text };
}

module.exports = handlebars;
