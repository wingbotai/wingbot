/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const asserts = require('./asserts');

const { ex } = asserts;

/** @typedef {import('../LLM').PromptInfo} PromptInfo */
/** @typedef {import('../LLM').LLMMessage} LLMMessage */
/** @typedef {import('../LLM').LLMRole} LLMRole */

/**
 * @class PromptAssert
 */
class PromptAssert {

    /**
     *
     * @param {PromptInfo[]} prompts
     */
    constructor (prompts) {
        this._prompts = prompts;
    }

    /**
     * Check if recent instruction contains selected string
     *
     * @param {string} search
     * @returns {this}
     */
    instructionContains (search) {
        const messages = this._flatPrompt((m) => m.role === 'system');
        this._promptContains(search, messages, false, 'of role "system"');
        return this;
    }

    /**
     * Check if recent prompt input contains selected string
     *
     * @param {string} search
     * @returns {this}
     */
    promptContains (search) {
        this._promptContains(search, this._flatPrompt());
        return this;
    }

    /**
     * Check if recent results contains selected string
     *
     * @param {string} search
     * @returns {this}
     */
    resultContains (search) {
        this._promptContains(search, this._flatResults());
        return this;
    }

    /**
     *
     * @param {(value: LLMMessage, index: number, array: LLMMessage[]) => unknown} filter
     * @returns {LLMMessage[]}
     */
    _flatPrompt (filter = () => true) {
        return this._prompts
            .flatMap((prompt) => prompt.prompt
                .filter(filter));
    }

    /**
     *
     * @returns {LLMMessage[]}
     */
    _flatResults () {
        return this._prompts
            .map((prompt) => prompt.result);
    }

    _promptContains (search, messages, notContains = false, addMessage = 'No LLM message found') {
        if (messages.length === 0) {
            PromptAssert.debug(this._prompts, true);
            assert.fail(ex(`No LLM message ${addMessage}`, search));
        }

        const found = messages.some((m) => asserts.llmContains(m, search, false));
        // console.log({ found, messages, notContains });
        if (notContains === found) {
            PromptAssert.debug(this._prompts, true);
            assert.fail(ex(
                `Text${notContains ? '' : ' not'} found in LLM messages ${addMessage}`,
                search
            ));
        }
    }

    /**
     *
     * @param {LLMMessage[]} prompt
     * @returns {string}
     */
    static promptStats (prompt) {
        const stats = prompt.reduce((o, m) => Object.assign(o, {
            [m.role]: (o[m.role] || 0) + 1
        }), {
            system: 0, assistant: 0, user: 0, tool: 0
        });

        return `[ ${Object.entries(stats).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' ')} ]`;
    }

    /**
     *
     * @param {LLMRole} role
     * @return {string}
     */
    static _marker (role) {
        switch (role) {
            case 'user':
                return '>';
            case 'system':
                return '*';
            case 'assistant':
                return '<';
            default:
                return '-';
        }
    }

    static _content (msg, full) {
        if (typeof msg.content !== 'string') {
            return msg.content === null ? '<null>' : typeof msg.content;
        }
        const txt = msg.content.replace(/\n+/g, ' ').replace(/\s\s+/g, ' ');
        return `'${txt.length <= 100 || full ? txt : `${txt.substring(0, 100)}...`}'`;
    }

    /**
     *
     * @param {PromptInfo[]} prompts
     * @param {boolean} [full=false]
     * @param {boolean} [silent=false]
     * @returns {string[]}
     */
    static debug (prompts, full = false, silent = false) {
        let out;
        if (prompts.length === 0) {
            out = ['no LLM prompts occured'];
        } else {
            out = prompts.map((p, i) => {
                const lastIndexOfUser = full
                    ? 0
                    : p.prompt.reduce((li, m, c) => (m.role === 'user' ? c : li), 0);

                const prompt = p.prompt.reduce((a, m, c) => {
                    if (['user', 'assistant'].includes(m.role) && c < lastIndexOfUser) {
                        const prev = a[a.length - 1];
                        if (prev === '...') {
                            return a;
                        }
                        return [...a, '...'];
                    }
                    return [...a, `${PromptAssert._marker(m.role)} ${PromptAssert._content(m, full)}`];
                }, []);

                return [
                    `${i + 1}) ${PromptAssert.promptStats(p.prompt)}`,
                    `${prompt.join('\n   ')}`,
                    `# ${PromptAssert._content(p.result)}`
                ].join('\n   ');
            });
        }
        if (!silent) {
            // eslint-disable-next-line no-console
            console.log(...out);
        }
        return out;
    }

}

module.exports = PromptAssert;
