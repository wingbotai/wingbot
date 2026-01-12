/**
 * @author David Menger
 */
'use strict';

const nodeFetch = require('node-fetch').default;
const util = require('util');
const { PHONE_REGEX, EMAIL_REGEX } = require('./systemEntities/regexps');
const LLM = require('./LLM');

/** @typedef {import('node-fetch').default} Fetch */
/** @typedef {import('./Request')} Request */
/** @typedef {import('./Responder')} Responder */
/** @typedef {import('./Responder').QuickReply} QuickReply */
/** @typedef {import('./LLM').LLMMessage} LLMMessage */
/** @typedef {import('./LLM').LLMProviderOptions} LLMProviderOptions */

/**
 * @typedef {object} Transcript
 * @prop {string} text
 * @prop {boolean} fromBot
 */

/**
 * @typedef {object} GeneralOptions
 * @prop {Fetch} [fetch]
 * @prop {string} [defaultUser]
 * @prop {string} [openAiEndpoint]
 * @prop {string} [apiVersion]
 * @prop {string} [apiKey] // for microsoft services
 * @prop {string} [authorization] // for chat gpt api
 */

/** @typedef {'gpt-3.5-turbo'|'gpt-4'|'gpt-4-32k'|'gpt-3.5-turbo-16k'|string} ChatGPTModel */

/**
 * @typedef {object} DefaultRequestOptions
 * @prop {ChatGPTModel} [model]
 * @prop {'node'|'low'|'medium'|'high'} [reasoningEffort]
 * @prop {number} [presencePenalty=0.0]
 * @prop {number} [requestTokens]
 * @prop {number} [tokensLimit]
 * @prop {number} [temperature=1.0]
 * @prop {number} [transcriptLength=-5]
 */

/**
 * @typedef {object} OptionsExtension
 * @prop {FNAnnotation[]} [functions]
 *
 * @typedef {OptionsExtension & DefaultRequestOptions} RequestOptions
 */

/**
 * @typedef {GeneralOptions & DefaultRequestOptions} ChatGptOptions
 */

/**
 * @typedef {object} Message
 * @prop {'system'|'user'|'assistant'|string} role
 * @prop {string} content
 */

/**
 * @typedef {object} ChatGPTChoice
 * @prop {'stop'|'length'|'tool_calls'|'content_filter'|null} finish_reason
 * @prop {number} index
 * @prop {Message} message
 * @prop {GptToolCall[]} [tool_calls]
 */

/**
 * @typedef {object} ChatGPTUsage
 * @prop {number} completion_tokens
 * @prop {number} prompt_tokens
 * @prop {number} total_tokens
 */

/**
 * @typedef {object} ChatGPTResponse
 * @prop {ChatGPTChoice[]} choices
 * @prop {number} created
 * @prop {ChatGPTModel} model
 * @prop {'text_completion'} object
 * @prop {ChatGPTUsage} usage
 */

/**
 * @typedef {object} Logger
 * @prop {Function} log
 * @prop {Function} error
 */

/**
 * @typedef {object} GptToolCall
 * @prop {string} id
 * @prop {'function'|string} type
 * @prop {object} function
 * @prop {string} function.name
 * @prop {string} function.arguments - JSON string
 */

/**
 * @typedef {object} SlicedAnnotation
 * @prop {boolean} [sliced]
 *
 * @typedef {string[] & SlicedAnnotation} StringArrayWithSliced
 */

/**
 * @typedef {object} ContinueReply
 * @prop {string} title
 * @prop {string} [action]
 */

/**
 * @typedef {object} Persona
 * @prop {string} [profile_pic_url]
 * @prop {string} [name]
 */

/**
 * @typedef {object} ReplyConfiguration
 * @prop {string} [system]
 * @prop {string} [annotation]
 * @prop {ContinueReply|boolean} [continueReply]
 * @prop {string|Persona} [persona]
 * @prop {boolean} [anonymize=true]
 */

/**
 * @typedef {object} FNScalarParam
 * @prop {'string'|'number'|'boolean'} type
 * @prop {string[]} [enum]
 * @prop {string} [description]
 */

/**
 * @typedef {object} FNArrayParam
 * @prop {'array'} type
 * @prop {string} [description]
 * @prop {FNParam} items
 */

/**
 * @typedef {object} FNObjectParam
 * @prop {'object'} type
 * @prop {{ [key: string]: FNParam }} properties
 * @prop {string[]} [required]
 * @prop {string} [description]
 */

/** @typedef {FNScalarParam|FNObjectParam|FNArrayParam} FNParam */

/**
 * @typedef {object} FNAnnotation
 * @prop {string} name
 * @prop {string} description
 * @prop {FNParam} parameters
 */

/**
 * @class ChatGpt
 */
class ChatGpt {

    /**
     *
     * @param {ChatGptOptions} options
     * @param {Logger} log
     */
    constructor (options, log = console) {
        const {
            fetch = nodeFetch,
            defaultUser = null,
            openAiEndpoint = 'https://api.openai.com/v1',
            apiKey,
            authorization,
            ...rest
        } = options;

        this._apiKey = apiKey;
        this._authorization = authorization;

        this._fetch = fetch;

        this._openAiEndpoint = openAiEndpoint;

        this._defaultUser = defaultUser;

        /** @type {Required<DefaultRequestOptions>} */
        this._options = {
            requestTokens: null,
            tokensLimit: null,
            presencePenalty: 0.0, // -2.0-2.0
            temperature: 1.0,
            model: 'gpt-4o-mini',
            transcriptLength: -5,
            reasoningEffort: null,
            ...rest
        };

        this._logger = log;

        this.MSG_REPLACE = '#MSG-REPLACE#';

        this.GPT_FLAG = 'gpt';

        this._anonymizeRegexps = [
            { replacement: '@PHONE', regex: new RegExp(PHONE_REGEX.source, 'g') },
            { replacement: '@EMAIL', regex: new RegExp(EMAIL_REGEX.source, 'g') }
        ];
    }

    _log (msg, ...args) {
        if (this._logger === console) {

            this._logger.log(msg, ...args.map((arg) => util.inspect(arg, {
                showHidden: false, depth: null, colors: true
            })));
        } else {
            this._logger.log(msg, ...args);
        }
    }

    /**
     *
     * @param {Responder} res
     * @param {number} limit
     * @param {boolean} anonymize
     * @returns {Promise<Transcript[]>}
     */
    async getTranscript (
        res,
        limit = this._options.transcriptLength,
        anonymize = true
    ) {
        const onlyFlag = Math.sign(limit) === -1 ? 'gpt' : null;
        const transcript = await res.getTranscript(Math.abs(limit), onlyFlag, true);

        if (!anonymize) {
            return transcript;
        }

        return transcript.map((t) => ({
            ...t,
            text: this._anonymizeRegexps
                .reduce((text, { replacement, regex }) => {
                    const replaced = text.replace(regex, replacement);
                    return replaced;
                }, t.text)
        }));
    }

    /**
     * @param {LLMMessage[]} prompt
     * @param {LLMProviderOptions} [options]
     * @returns {Promise<LLMMessage>}
     */
    async requestChat (prompt, options) {
        const choice = await this._request(prompt, options);

        const { finish_reason: finishReason, message, tool_calls: toolCalls = [] } = choice;

        return {
            finishReason,
            toolCalls: toolCalls.map(({ id, function: { name, arguments: args } }) => ({
                id,
                name,
                args
            })),
            ...message
        };
    }

    /**
     *
     * @param {LLMMessage[]} chat
     * @param {RequestOptions} requestOptions
     * @param {string} user
     * @returns {Promise<ChatGPTChoice>}
     */
    async _request (chat, requestOptions, user = null) {
        const {
            requestTokens,
            tokensLimit,
            model,
            presencePenalty,
            temperature,
            reasoningEffort,
            functions = []
        } = {
            ...this._options,
            ...requestOptions
        };

        let messages = chat;

        let body;
        try {
            let lastUserIndex = 0;
            let totalTokens = messages
                .reduce((total, m, i) => {
                    if (m.role === LLM.ROLE_USER) {
                        lastUserIndex = i;
                    }
                    return (m.content ? 0 : m.content.length) + total;
                }, 0);

            if (tokensLimit !== null && totalTokens > tokensLimit) {
                messages = messages.filter((m, i) => {
                    if (m.role === LLM.ROLE_SYSTEM
                        || i >= lastUserIndex
                        || totalTokens <= tokensLimit
                        || !m.content) {

                        return true;
                    }
                    totalTokens -= m.content.length;
                    return false;
                });
            }

            body = {
                model,
                frequency_penalty: 0,
                presence_penalty: presencePenalty,
                ...(requestTokens ? { max_completion_tokens: requestTokens } : {}),
                ...(reasoningEffort ? {
                    reasoning: { effort: reasoningEffort }
                } : {}),
                temperature,
                messages
            };

            if (user) {
                Object.assign(body, { user });
            }

            if (functions.length) {
                Object.assign(body, { functions });
            }

            const apiUrl = `${this._openAiEndpoint}/chat/completions${this._apiKey ? '?api-version=2023-03-15-preview' : ''}`;

            this._log('#GPT request', body);

            const response = await this._fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this._apiKey
                        ? { 'api-key': this._apiKey }
                        : { Authorization: `Bearer ${this._authorization}` })
                },
                body: JSON.stringify(body)
            });

            /** @type {ChatGPTResponse} */
            const data = await response.json();

            if (response.status !== 200
                || !Array.isArray(data.choices)) {
                const { status, statusText } = response;

                this._logger.error('#GPT failed', {
                    status, statusText, data, body
                });
                throw new Error(`Chat GPT ${status}`);
            }

            const [choice] = data.choices;

            this._log('#GPT response', { choice, data });

            return choice;
        } catch (e) {
            this._logger.error('#GPT failed', e, body);
            throw e;
        }
    }

    /**
     *
     * @deprecated
     * @param {string} content
     * @param {string} [system]
     * @param {Transcript[]} [transcript]
     * @param {RequestOptions} [requestOptions]
     * @param {string|Request} [user]
     * @returns {Promise<ChatGPTChoice>}
     */
    async request (content, system = null, transcript = [], requestOptions = {}, user = null) {

        /** @type {Message[]} */
        const messages = [
            ...(system ? [{ role: 'system', content: system }] : []),
            ...transcript.map((t) => ({ role: t.fromBot ? 'assistant' : 'user', content: t.text })),
            { role: 'user', content }
        ];

        let useUser;
        if (typeof user === 'string') {
            useUser = user;
        } else if (user) {
            useUser = `${user.pageId}|${user.senderId}`;
        } else if (this._defaultUser) {
            useUser = this._defaultUser;
        }

        return this._request(messages, requestOptions, useUser);
    }

    /**
     *
     * @param {ChatGPTChoice} choice
     * @param {string} [annotation]
     * @returns {StringArrayWithSliced}
     */
    toMessages (choice, annotation = null) {
        let sliced = choice.finish_reason === 'length';

        let filtered = choice.message.content
            .replace(/\n\n/g, '\n')
            .split(/\n+(?!-)/g)
            .filter((t) => !!t.trim());

        if (sliced && filtered.length > 1) {
            filtered = filtered.slice(0, filtered.length - 1);
            sliced = true;
        }

        filtered = filtered
            .map((t) => {
                let trim = t.trim();

                if (annotation) {
                    // replace the annotation first

                    const replacements = annotation.split(this.MSG_REPLACE);

                    const last = replacements.length > 1
                        ? replacements.length - 1
                        : replacements.length;

                    replacements.forEach((r, i) => {
                        const foundI = trim.indexOf(r.trim(), i === last
                            ? trim.length - r.trim().length
                            : 0);

                        if (foundI === -1
                            || (i === 0 && foundI > 0)
                            || (i === last && (trim.length - foundI - r.length) > 0)) {
                            return;
                        }

                        trim = trim.replace(r.trim(), '').trim();
                    });
                }

                if (annotation && annotation.includes(this.MSG_REPLACE)) {
                    trim = annotation.replace(this.MSG_REPLACE, trim);
                } else if (annotation) {
                    trim = `${annotation} ${trim}`;
                }

                return trim;
            });

        return Object.assign(filtered, { sliced });
    }

    /**
     *
     * @param {Responder} res
     * @param {string[]} messages
     * @param {QuickReply[]} [quickReplies]
     */
    sendMessages (res, messages, quickReplies = null) {
        messages.forEach((text, i) => {
            const addQuickReply = i === (messages.length - 1);
            res.text(text, addQuickReply ? quickReplies : null);
        });
    }

    /**
     *
     * @param {Request} req
     * @param {Responder} res
     * @param {ReplyConfiguration} [replyConfig]
     * @param {RequestOptions} [options]
     */
    async respond (req, res, replyConfig = {}, options = {}) {
        res.setFlag(this.GPT_FLAG);
        res.typingOn();

        const {
            transcriptLength
        } = {
            ...this._options,
            ...options
        };

        const { persona, continueReply, anonymize } = replyConfig;

        const content = req.text();

        const transcript = await this.getTranscript(res, transcriptLength, anonymize);
        const choice = await this.request(content, replyConfig.system, transcript, options);

        const messages = this.toMessages(choice, replyConfig.annotation);

        if (typeof persona === 'string') {
            res.setPersona({ name: persona });
        } else if (persona) {
            res.setPersona(persona);
        }

        const { sliced } = messages;

        let qrs;

        if (!continueReply) {
            qrs = null;
        } else if (continueReply === true) {
            qrs = [];
        } else if (typeof continueReply === 'object') {
            qrs = [{
                title: continueReply.title,
                action: continueReply.action || res.currentAction()
            }];
        }

        if (messages.length === 0) {
            const err = new Error('#GPT nothing to send');
            this._logger.error('#GPT nothing to send', err, { choice, content });
            throw err;
        }

        this.sendMessages(res, messages, qrs);

        if (persona) {
            res.setPersona({ name: null });
        }

        return {
            messages,
            sliced,
            choice
        };
    }

}

module.exports = ChatGpt;
