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

        return content[Object.keys(content)[0]];
    });
} catch (er) {
    handlebars = { compile: (text) => () => text };
}

module.exports = handlebars;
