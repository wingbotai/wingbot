/**
 * @author David Menger
 */
'use strict';

const LLM = require('./LLM');

/** @typedef {import('./LLM').LLMChatProvider} LLMChatProvider */
/** @typedef {import('./LLM').LLMMessage} LLMMessage */
/** @typedef {import('./LLM').LLMProviderOptions} LLMProviderOptions */

/**
 * @class LLMMockProvider
 * @implements {LLMChatProvider}
 */
class LLMMockProvider {

    static DEFAULT_MODEL = 'mockmodel';

    constructor () {
        this._index = 0;
        this._sequence = [
            'lorem',
            'ipsum',
            'dolor',
            'sit',
            'amet'
        ];
    }

    /**
     * @param {LLMMessage[]} prompt
     * @param {LLMProviderOptions} [options]
     * @returns {Promise<LLMMessage>}
     */
    // eslint-disable-next-line no-unused-vars
    async requestChat (prompt, options) {
        if (prompt.length === 0) {
            throw new Error('Empty prompt');
        }
        // const stats = prompt.reduce((o, m) => Object.assign(o, {
        //    [m.role]: (o[m.role] || 0) + 1
        // }), { system: 0, assistant: 0, user: 0 });
        //
        // const statsText = JSON.stringify(stats)
        //    .replace(/"/g, '');
        //
        /// / const message = this._sequence[this._index];
        /// / this._index = (this._index + 1) % this._sequence.length;
        //
        // return {
        //    role: LLM.ROLE_ASSISTANT,
        //    finishReason: 'length',
        // eslint-disable-next-line max-len
        //    content: `${statsText} > ${LLMMockProvider.DEFAULT_MODEL}: ${prompt.map((m) => m.content).join(' ')}`
        // };

        return {
            role: LLM.ROLE_ASSISTANT,
            finishReason: 'length',
            content: `${options.model || LLMMockProvider.DEFAULT_MODEL}:${prompt.map((m) => m.content).join(' ')}`
        };
    }

}

module.exports = LLMMockProvider;
