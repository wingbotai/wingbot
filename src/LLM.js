/**
 * @author David Menger
 */
'use strict';

const { PHONE_REGEX, EMAIL_REGEX } = require('./systemEntities/regexps');

/** @typedef {import('./Responder')} Responder */
/** @typedef {import('./Responder').Persona} Persona */
/** @typedef {import('./Router').BaseConfiguration} BaseConfiguration */
/** @typedef {import('./LLMSession').LLMMessage} LLMMessage */
/** @typedef {import('./LLMSession').LLMRole} LLMRole */
/** @typedef {import('./LLMSession')} LLMSession */
/** @typedef {import('./transcript/transcriptFromHistory').Transcript} Transcript */

/**
 * @callback LLMChatProviderPrompt
 * @param {LLMMessage[]} prompt
 * @param {LLMProviderOptions} [options]
 * @returns {Promise<LLMMessage>}
 */

/**
 * @typedef {object} LLMProviderOptions
 * @prop {string} [model]
 */

/**
 * @typedef {object} LLMChatProvider
 * @prop {LLMChatProviderPrompt} requestChat
 */

/** @typedef {import('node-fetch').default} Fetch */

/**
 * @typedef {object} LLMConfiguration
 * @prop {LLMChatProvider} provider
 * @prop {string} [model]
 * @prop {number} [transcriptLength=-5]
 * @prop {'gpt'|string} [transcriptFlag]
 * @prop {boolean} [transcriptAnonymize]
 * @prop {Persona|string|null} [persona]
 */

/**
 * @typedef {object} AnonymizeRegexp
 * @prop {string} [replacement]
 * @prop {RegExp} regex
 */

/**
 * @class LLM
 */
class LLM {

    /** @type {LLMRole} */
    static ROLE_USER = 'user';

    /** @type {LLMRole} */
    static ROLE_ASSISTANT = 'assistant';

    /** @type {LLMRole} */
    static ROLE_SYSTEM = 'system';

    static GPT_FLAG = 'gpt';

    /** @type {AnonymizeRegexp[]} */
    static anonymizeRegexps = [
        { replacement: '@PHONE', regex: new RegExp(PHONE_REGEX.source, 'g') },
        { replacement: '@EMAIL', regex: new RegExp(EMAIL_REGEX.source, 'g') }
    ];

    /**
     *
     * @param {LLMConfiguration} configuration
     */
    constructor (configuration) {
        const { provider, ...rest } = configuration;

        this._configuration = {
            transcriptFlag: 'gpt',
            transcriptLength: 5,
            provider: null,
            ...rest
        };

        /** @type {LLMChatProvider} */
        this._provider = provider;
    }

    /**
     * @returns {Omit<LLMConfiguration, 'provider'>}
     */
    get configuration () {
        return this._configuration;
    }

    /**
     *
     * @param {Transcript[]} chat
     * @param {boolean} [transcriptAnonymize]
     * @returns {LLMMessage[]}
     */
    static anonymizeTranscript (chat, transcriptAnonymize) {
        return chat.map((c) => ({
            role: c.fromBot ? LLM.ROLE_ASSISTANT : LLM.ROLE_USER,
            content: transcriptAnonymize
                ? LLM.anonymizeRegexps
                    .reduce((text, { replacement, regex }) => {
                        const replaced = text.replace(regex, replacement);
                        return replaced;
                    }, c.text)
                : c.text
        }));
    }

    /**
     *
     * @param {LLMSession} session
     * @param {LLMProviderOptions} [options={}]
     * @returns {Promise<LLMMessage>}
     */
    async generate (session, options = {}) {
        /** @type {LLMProviderOptions} */
        const opts = {
            model: this._configuration.model,
            ...options
        };

        const prompt = session.toArray();
        const result = await this._provider.requestChat(prompt, opts);

        return result;
    }

    /**
     *
     * @param {LLMMessage} result
     * @returns {LLMMessage[]}
     */
    static toMessages (result) {
        let filtered = result.content
            .replace(/\n\n+/g, '\n')
            .split(/\n+(?!-)/g)
            .map((t) => t.trim())
            .filter((t) => !!t);

        if (result.finishReason === 'length' && filtered.length <= 0) {
            filtered = filtered.slice(0, filtered.length - 1);
        }

        return filtered.map((content) => ({
            content,
            role: result.role
        }));
    }

}

module.exports = LLM;
