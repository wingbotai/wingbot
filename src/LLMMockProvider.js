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

        if (prompt.some((p) => p?.content?.includes('THROW EXCEPTION'))) {
            throw new Error('THROW EXCEPTION');
        }

        if (prompt.some((p) => p.toolCallId)) {
            return {
                role: LLM.ROLE_ASSISTANT,
                content: 'got tool call id'
            };
        }

        if (prompt.some((p) => p?.content?.includes('CALL MOCK TOOL'))) {
            return {
                role: LLM.ROLE_ASSISTANT,
                toolCalls: [
                    {
                        id: `${Date.now()}${Math.floor(Math.random() * 10)}`,
                        type: 'function',
                        name: 'mock',
                        args: JSON.stringify({ mock: true })
                    }
                ]
            };
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
