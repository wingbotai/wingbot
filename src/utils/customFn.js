/*
 * @author David Menger
 */
'use strict';

const Router = require('../Router'); // eslint-disable-line
const ai = require('../Ai'); // eslint-disable-line
const fetch = require('node-fetch'); // eslint-disable-line
let axios;
try {
    // @ts-ignore
    axios = module.require('axios');
} catch (e) {
    // eslint-disable-next-line no-unused-vars
    const errfn = () => { throw new Error('To use axios, you have to manually install it into your bot.'); };
    axios = errfn;

    // @ts-ignore
    axios.get = errfn;
    // @ts-ignore
    axios.request = errfn;
    // @ts-ignore
    axios.post = errfn;
    // @ts-ignore
    axios.put = errfn;
    // @ts-ignore
    axios.delete = errfn;
    // @ts-ignore
    axios.head = errfn;
    // @ts-ignore
    axios.options = errfn;
    // @ts-ignore
    axios.patch = errfn;
    // @ts-ignore
    axios.getUri = errfn;
    // @ts-ignore
    axios.create = errfn;
}

const FORBIDDEN = /([^a-zA-Z0-9]|^)(this|process|require|module|console|global|eval)([^a-zA-Z0-9]|$)/;

function customFn (code, description = '', allowForbiddenSnippetWords = false) {
    if (typeof code !== 'string') {
        throw new Error(`Inline code '${description}' has empty code`);
    }

    if (code.match(FORBIDDEN) && !allowForbiddenSnippetWords) {
        throw new Error('Code contains a forbidden word (this,process,require,module,console,global,eval)');
    }

    let resolver;

    try {
        resolver = eval(code); // eslint-disable-line
    } catch (e) {
        throw new Error(`Invalid inline code '${description}': ${e.message}`);
    }

    if (typeof resolver !== 'function') {
        throw new Error(`Invalid inline code '${description}': must be a function`);
    }

    return resolver;
}

module.exports = customFn;
