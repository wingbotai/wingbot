/**
 * @author David Menger
 */
'use strict';

const {
    FILTER_SCOPE_CONVERSATION, ROLE_ASSISTANT, ROLE_USER, ROLE_SYSTEM
} = require('./LLMConsts');

/** @typedef {import('./Responder').QuickReply} QuickReply */
/** @typedef {import('./LLM').LLMCallPreset} LLMCallPreset */
/** @typedef {import('./LLM')} LLM */
/** @typedef {import('./LLM').LLMLogOptions} LLMLogOptions */

/** @typedef {'user'|'assistant'} LLMChatRole */
/** @typedef {'system'} LLMSystemRole */
/** @typedef {'tool'} LLMToolRole */
/** @typedef {LLMChatRole|LLMSystemRole|LLMToolRole|string} LLMRole */

/** @typedef {LLMRole|'conversation'} FilterScope */

/** @typedef {'stop'|'length'|'tool_calls'|'content_filter'} LLMFinishReason */

/**
 * @typedef {object} ToolCall
 * @prop {string} id
 * @prop {string|'function'} type
 * @prop {string} name
 * @prop {string} args - JSON string
 */

/** @typedef {string|Promise<string>} PossiblyAsyncContent */

/**
 * @template {LLMRole} [R=LLMRole]
 * @template {PossiblyAsyncContent} [C=string]
 * @typedef {object} LLMMessage
 * @prop {R} role
 * @prop {C} [content]
 * @prop {LLMFinishReason} [finishReason]
 * @prop {ToolCall[]} [toolCalls]
 * @prop {string} [toolCallId]
 */

/**
 * @template {LLMRole} [R=LLMRole]
 * @typedef {LLMMessage<R, PossiblyAsyncContent>} PossiblyAsyncLLMMessage
 */

/**
 * @typedef {Promise<LLMMessage<LLMRole,string>|LLMMessage<LLMRole,string>[]>} AsyncLLMMessage
 */

/**
 * @typedef {object} FailedLLMAsync
 * @prop {'error'|string} role
 * @prop {Error} error
 */

/** @typedef {FailedLLMAsync|LLMMessage} SyncLLMSrc */
/** @typedef {FailedLLMAsync|AsyncLLMMessage|PossiblyAsyncLLMMessage} LLMMessageSrc */

/**
 * @callback SendCallback
 * @param {LLMMessage[]} messages
 * @param {QuickReply[]} quickReplies
 */

/**
 * @callback LLMFilterFn
 * @param {string} text
 * @param {LLMRole} role
 * @returns {boolean|string}
 */

/**
 * @typedef {object} LLMFilter
 * @prop {LLMFilterFn} filter
 * @prop {FilterScope} scope
 */

/**
 * @typedef {object} JsonSchemaProp
 * @prop {string} [name]
 * @prop {string|'string'|'number'|'boolean'|'array'} type - The data type
 * @prop {string} [description] - Description of the parameter
 * @prop {string[]} [enum] - Allowed values for this parameter
 * @prop {number} [minimum] - Minimum value for numeric parameters
 * @prop {number} [maximum] - Maximum value for numeric parameters
 */

/** @typedef {{ [key: string]: JsonSchemaProp }} SimpleJsonSchema */

/**
 * @callback ToolFnCallback
 * @param {{[key: string]: any}} input
 * @returns {string|Promise<string>}
 */

/**
 * @typedef {object} FnParamsObject
 * @prop {string} [type] - Schema type ('object')
 * @prop {string} [name] - Schema name (required for structured output)
 * @prop {SimpleJsonSchema} properties - Parameter definitions
 * @prop {string[]} [required] - Required parameters
 * @prop {boolean} [additionalProperties]
 *
 */

/**
 * @typedef {object} ToolFunction
 * @prop {string} name - The function name
 * @prop {string} [description] - What the function does
 * @prop {FnParamsObject} [parameters] - Parameter schema
 * @prop {boolean} [strict]
 */

/**
 * @typedef {object} ToolInputWithFactory
 * @prop {string} [name] - The function name
 * @prop {FnParamsObject|ParametersFactory} [parameters] - Parameter schema
 */

/** @typedef {Omit<ToolFunction, 'parameters'|'name'> & ToolInputWithFactory} ToolFunctionInput */

/**
 * @typedef {object} ToolFnObject
 * @prop {ToolFnCallback} fn
 */

/** @typedef {ToolFnCallback & ToolFunction} CallbackTool */
/** @typedef {ToolFnObject & ToolFunction} ObjectTool */

/** @typedef {CallbackTool | ObjectTool} Tool */

/**
 * @typedef {object} ParametersFactory
 * @prop {Function} toJSON()
 */

/** @typedef {Omit<Tool, 'parameters'> & Omit<ToolInputWithFactory, 'name'>} ToolInput */

/**
 * CONSIDERATION:
 * - spustit joby až na await, nebo hned? - na await je bezpečnější
 * - joby si musí umět předat výsledek (což je dané jen implementací, nikoliv nutností)
 *
 * CONCEPT
 * - asynchronní metody vracející this vždy přidávají job (job vrací jen LLM výsledek)
 * - synchronní metody vracející this, kde záleží na pořadí volání,
 *   přidávají job s "runNowAndSyncWhenQueueIsEmpty=true" parametrem
 * - asynchronní metody vracející data, by měly awaitovat this (aby byla data aktuální)
 * - synchronní metody vracející data NEČEKAJÍ A MAJÍ V NÁZVU "Sync" s výjimkou:
 *      - toString
 *      - toJson
 */

/**
 * @class LLMSession
 * @implements {PromiseLike<LLMMessage<any>>}
 */
class LLMSession {

    /**
     *
     * @param {LLM} llm
     * @param {(PossiblyAsyncLLMMessage|AsyncLLMMessage)[]} [chat]
     * @param {SendCallback} [onSend]
     * @param {LLMFilter[]} [filters=[]]
     */
    constructor (llm, chat = [], onSend = null, filters = []) {
        this._llm = llm;

        this._onSend = onSend;

        this._inExecution = false;

        this._jobQ = [];

        this._worker = null;

        /** @type {LLMMessageSrc[]} */
        this._chat = [];
        this.push(...chat);

        this._generatedIndex = null;

        /** @type {LLMFilter[]} */
        this._filters = filters;

        this._SCOPE_CONVERSATION_ROLES = [
            ROLE_ASSISTANT, ROLE_USER
        ];

        /** @type {Map<string,ObjectTool>} */
        this._tools = new Map();
    }

    _job (task, runNowAndSyncWhenQueueIsEmpty = false) {
        if (runNowAndSyncWhenQueueIsEmpty && this._jobQ.length === 0) {
            task(null);
        } else {
            // @todo remove stack
            this._jobQ.push(task);
        }
    }

    // IDEA: then === defered taskl

    async _runWorker () {
        let fail = null;
        let res = null;
        let lastWasAwait = false;

        const isAwait = (job) => 'onDone' in job;
        while (this._jobQ.some((job) => isAwait(job))) {
            const job = this._jobQ.shift();
            if (isAwait(job)) {
                lastWasAwait = true;
                if (fail) {
                    job.onDone(fail);
                } else {
                    job.onDone(null, res);
                }
            } else {
                if (lastWasAwait) {
                    lastWasAwait = false;
                    fail = null;
                    res = null;
                }
                try {
                    this._inExecution = true;
                    Error.stackTraceLimit = 50;
                    const result = await Promise.resolve(job(res));
                    if (typeof result !== 'undefined') {
                        res = result;
                    }
                } catch (e) {
                    fail = e;
                } finally {
                    this._inExecution = false;
                }
            }
        }
        if (fail) {
            throw fail;
        }
        return res;
    }

    async _awaitIfNotNestedCall () {
        if (this._inExecution) return;
        await this;
    }

    /**
     *
     * @template TResult1
     * @template TResult2
     * @param {(value: any) => TResult1 | PromiseLike<TResult1>} [onFulfilled]
     * @param {(reason: any) => TResult2 | PromiseLike<TResult2>} [onRejected]
     * @returns {PromiseLike<TResult1 | TResult2>}
     */
    then (onFulfilled, onRejected) {
        let error;
        let result = null;
        this._jobQ.push({
            onDone: (err, res) => {
                if (err) {
                    error = err;
                } else {
                    result = res;
                }
            }
        });
        if (this._worker === null) {
            this._worker = this._runWorker()
                .finally(() => {
                    this._worker = null;
                });
        }
        return this._worker
            .then(() => {
                if (error) {
                    throw error;
                }
                return result;
            })
            .then(onFulfilled, onRejected);
    }

    /**
     * @returns {ToolFunction[]}
     */
    get tools () {
        return Array.from(this._tools.values())
            .map(({
                name,
                description = null,
                parameters = {},
                strict = true
            }) => ({
                name,
                ...(description && { description }),
                ...(typeof strict === 'boolean' ? { strict } : {}),
                parameters: {
                    type: 'object',
                    properties: {},
                    additionalProperties: false,
                    required: 'properties' in parameters
                        ? Object.keys(parameters.properties)
                        : [],
                    ...parameters
                }
            }));
    }

    /**
     * @returns {Promise<LLMMessage[]>}
     */
    async _resolveMessages () {
        await Promise.all(
            this._chat.map(async (msg) => {
                if ('then' in msg && typeof msg.then === 'function') {
                    return msg;
                }
                if ('content' in msg && typeof msg.content !== 'string' && 'then' in msg.content) {
                    return msg.content;
                }
                return null;
            })
        );

        // @ts-ignore
        return this._moveSystemToTop(this._chat);
    }

    /**
     *
     * @param {LLMMessageSrc[]} messages
     */
    _throwAsyncError (messages = this._chat) {
        const errors = messages.filter((c) => 'role' in c && c.role === 'error');

        if (errors.length === 1) {
            // @ts-ignore
            throw errors[0].error;
        } else if (errors.length) {
            // @ts-ignore
            const errs = errors.map((e) => e.error);
            this._llm.log.log('LLMSession failures', errs);
            throw new Error(errs.map((e) => e.message).join(', '));
        }
    }

    /**
     *
     * @template {LLMMessageSrc} T
     * @param {T[]} what
     * @returns {T[]}
     */
    _moveSystemToTop (what) {
        let nextSystem = 0;
        for (let i = 0; i < what.length; i++) {
            const el = what[i];
            const isSystem = 'role' in el && el.role === 'system';
            if (isSystem && i > nextSystem) {
                what.splice(i, 1);
                what.splice(nextSystem, 0, el);
            }
            if (isSystem && i >= nextSystem) {
                nextSystem++;
            }
        }
        return what;
    }

    /**
     *
     * @param {SyncLLMSrc[]} chat
     * @returns {SyncLLMSrc[]}
     */
    _mergeSystem (chat) {
        /** @type {LLMMessage<any>[]} */
        const sysMessages = [];

        const otherMessages = chat.filter((message) => {
            if (message.role !== ROLE_SYSTEM) {
                return true;
            }
            sysMessages.push(message);
            return false;
        });

        if (sysMessages.length === 0) {
            return otherMessages;
        }

        const promptRegex = /\$\{(prompt|last)\(\)\}/g;

        const last = sysMessages.length - 1;

        const content = sysMessages.reduce((reduced, current, i) => {
            if (i === 0) {
                return current.content || '';
            }
            if (last === i && !reduced.match(promptRegex)) {
                return `${reduced}\n\n${current.content}`;
            }
            return reduced.replace(promptRegex, current.content).trim();
        }, '')
            .replace(promptRegex, '')
            .trim();

        return [
            {
                role: ROLE_SYSTEM, content
            },
            ...otherMessages
        ];
    }

    /**
     *
     * @param {boolean} [filtered=false]
     * @returns {SyncLLMSrc[]}
     */
    toArraySync (filtered = false) {
        this._moveSystemToTop(this._chat);
        this._throwAsyncError(this._chat);
        const sync = this._processSyncMessages(this._chat, filtered);
        return this._mergeSystem(sync);
    }

    /**
     *
     * @param {LLMMessageSrc[]} messages
     * @param {boolean} [filtered=false]
     * @returns {SyncLLMSrc[]}
     */
    _processSyncMessages (messages, filtered = false) {
        /** @type {SyncLLMSrc[]} */
        const ret = [];

        messages.forEach((m) => {
            if (!('role' in m)) {
                return;
            }
            if ('content' in m
                && (m.content instanceof Promise
                    || (typeof m.content !== 'string' && m.content && 'then' in m.content))) {
                return;
            }
            if (filtered && this._filters.length >= 0 && 'content' in m && typeof m.content === 'string') {
                const content = this._filters.reduce((text, filter) => {
                    if (!text) {
                        return text;
                    }
                    if (filter.scope !== m.role
                        && (filter.scope !== FILTER_SCOPE_CONVERSATION
                            || !this._SCOPE_CONVERSATION_ROLES.includes(m.role))) {
                        return text;
                    }
                    const res = filter.filter(text, m.role);
                    return res === true ? text : res;
                }, m.content);

                if (typeof content === 'string') {
                    // @ts-ignore
                    ret.push({
                        ...m,
                        content
                    });
                }
            } else {
                // @ts-ignore
                ret.push(m);
            }

        });

        return ret;
    }

    /**
     *
     * @param {boolean} [filtered=false]
     * @returns {Promise<LLMMessage[]>}
     */
    async toArray (filtered = false) {
        await this._awaitIfNotNestedCall();
        const messages = await this._resolveMessages();
        this._throwAsyncError(messages);
        const sync = this._processSyncMessages(messages, filtered);
        return this._mergeSystem(sync);
    }

    /**
     *
     * @param {PossiblyAsyncContent} content
     * @returns {boolean}
     */
    _contentIsPromise (content) {
        return !!content && typeof content !== 'string';
    }

    /**
     *
     * @param {PossiblyAsyncLLMMessage} m
     * @returns {string}
     */
    _contentToString (m) {
        if (m.toolCalls) {
            return `{ REQUESTED TOOLS:\n${m.toolCalls
                .map((t) => `   .${t.name}(${t.args})`).join('\n')} }`;
        }
        if (!m.content) {
            return '[-no-content-]';
        }
        if (typeof m.content === 'string') {
            return m.content;
        }
        return '<Promise>';
    }

    /**
     *
     * @param {LLMMessageSrc[]} [messages]
     * @returns {string}
     */
    toString (messages = this._chat) {
        if (messages.length === 0) {
            return '-[<empty>]';
        }
        return messages.map((m) => {
            if ('then' in m) {
                return '-{ <Promise> }';
            }
            if (!('role' in m)) {
                return '-!- unknown message -!';
            }
            if ('error' in m) {
                return `-<Error: ${m.error.message}>`;
            }
            switch (m.role) {
                case ROLE_SYSTEM:
                    return `- -- system ---\n${m.content}\n--------------`;
                default:
                    return `${this._msgPrefix(m)} ${this._contentToString(m)}`;
            }
        })
            .join('\n');
    }

    /**
     *
     * @param {PossiblyAsyncLLMMessage} msg
     * @returns {string}
     */
    _msgPrefix (msg) {
        switch (msg.role) {
            case ROLE_SYSTEM:
                return '--';
            case ROLE_ASSISTANT:
                return msg.content ? '-<' : '-#';
            case ROLE_USER:
                return '->';
            default:
                return '-():';
        }
    }

    toJSON () {
        return this.toArraySync();
    }

    /**
     *
     * @param {boolean} [needRaw=false]
     * @returns {this}
     */
    debug (needRaw = false) {
        this._job(() => {
            // eslint-disable-next-line no-console
            console.log(`LLMSession#debug\n${this.toString(
                needRaw
                    ? this._chat
                    : this.toArraySync(false)
            )}`);
        }, true);
        return this;
    }

    /**
     *
     * @param {...(PossiblyAsyncLLMMessage|AsyncLLMMessage)} messages
     * @returns {this}
     */
    push (...messages) {
        this._job(() => this._pushNow(...messages), true);
        return this;
    }

    /**
     *
     * @param {...(PossiblyAsyncLLMMessage|AsyncLLMMessage)} messages
     * @returns {void}
     */
    _pushNow (...messages) {
        this._chat.push(...messages.map((msg) => {
            if ('then' in msg && typeof msg.then === 'function') {
                const wrapped = (async () => {
                    /** @type {SyncLLMSrc[]} */
                    let expand;
                    try {
                        const ret = await msg;
                        expand = Array.isArray(ret) ? ret : [ret];
                    } catch (e) {
                        expand = [{
                            role: 'error',
                            error: e
                        }];
                    }
                    const index = this._chat.indexOf(wrapped);
                    this._chat.splice(index, 1, ...expand);
                    return expand;
                })();
                return wrapped;
            }
            if (!('content' in msg) || !this._contentIsPromise(msg.content)) {
                return msg;
            }
            const ret = {
                ...msg,
                content: Promise.resolve(msg.content)
                    .then((r) => {
                        // @ts-ignore
                        ret.content = r;
                        return r;
                    })
                    .catch((e) => {
                        const index = this._chat.indexOf(ret);
                        this._chat.splice(index, 1, { role: 'error', error: e });
                        return null;
                    })
            };

            return ret;
        }));
    }

    /**
     *
     * @param  {...ToolInput} addedTools
     * @returns {this}
     */
    tool (...addedTools) {
        addedTools.forEach((tool) => {
            if (!tool.name) {
                throw new Error(`Tool is missing .name: ${tool}`);
            }
        });
        this._job(() => {
            for (const input of addedTools) {
                // @ts-ignore
                // eslint-disable-next-line prefer-const, object-curly-newline
                let { fn, parameters = {}, name, ...rest } = input;

                if (typeof input === 'function') {
                    fn = input;
                }

                if ('toJSON' in parameters && typeof parameters.toJSON === 'function') {
                    parameters = parameters.toJSON();
                }

                this._tools.set(name, {
                    fn,
                    name,
                    // @ts-ignore
                    parameters,
                    ...rest
                });
            }
        }, true);
        return this;
    }

    /**
     *
     * @param {string|Promise<string>} content
     * @returns {this}
     */
    user (content) {
        this.push({
            role: ROLE_USER,
            content
        });
        return this;
    }

    /**
     *
     * @param {string|Promise<string>} content
     * @returns {this}
     */
    assistant (content) {
        this.push({
            role: ROLE_ASSISTANT,
            content
        });
        return this;
    }

    /**
     *
     * @param {string|Promise<string>} content
     * @returns {this}
     */
    systemPrompt (content) {
        this.push({
            role: ROLE_SYSTEM,
            content
        });
        return this;
    }

    /**
     *
     * @param {LLMFilter|LLMFilter[]} filter
     * @returns {this}
     */
    addFilter (filter) {
        this._job(() => {
            if (Array.isArray(filter)) {
                this._filters.push(...filter);
            } else {
                this._filters.push(filter);
            }
        }, true);
        return this;
    }

    /**
     *
     * @param {LLMCallPreset} [providerOptions]
     * @param {LLMLogOptions} [logOptions]
     * @returns {this}
     */
    generate (providerOptions = undefined, logOptions = {}) {
        this._job(() => this._generate(providerOptions, logOptions));
        return this;
    }

    /**
     *
     * @param {FnParamsObject|ParametersFactory} output
     * @param {LLMCallPreset} [providerOptions]
     * @param {LLMLogOptions} [logOptions]
     * @returns {this}
     */
    generateStructured (output, providerOptions = undefined, logOptions = {}) {

        const responseFormat = 'toJSON' in output && typeof output.toJSON === 'function'
            ? output.toJSON()
            : output;

        if (!responseFormat.name) {
            throw new Error('Missing root object name for LLM structured output');
        }

        this._job(async () => {
            const result = await this._generate({
                ...(typeof providerOptions === 'object' ? providerOptions : {}),
                ...(typeof providerOptions === 'string' ? { preset: providerOptions } : {}),
                responseFormat
            }, logOptions);

            return JSON.parse(result.content);
        });
        return this;
    }

    /**
     *
     * @param {LLMCallPreset} [providerOptions]
     * @param {LLMLogOptions} [logOptions]
     * @returns {Promise<LLMMessage<any>>}
     */
    async _generate (providerOptions = undefined, logOptions = {}) {
        let result = await this._llm.generate(this, providerOptions, logOptions);

        if (result.toolCalls?.length) {
            const toolCalls = [];
            const results = await Promise.all(
                result.toolCalls.map(async (tc) => {
                    const msg = await this._executeToolCall(tc);
                    if (msg) {
                        toolCalls.push(tc);
                    }
                    return msg;
                })
            );

            if (toolCalls.length) {
                this._pushNow(
                    {
                        role: ROLE_ASSISTANT,
                        toolCalls
                    },
                    ...results.filter((r) => !!r)
                );
                result = await this._llm.generate(this, providerOptions, logOptions);
            } else {
                // everything failed
                /** @type {LLMCallPreset} */
                const overrideChoice = typeof providerOptions === 'string'
                    ? {
                        preset: providerOptions,
                        toolChoice: 'none'
                    }
                    : {
                        ...providerOptions,
                        toolChoice: 'none'
                    };
                result = await this._llm.generate(this, overrideChoice, logOptions);
            }
        }

        this._generatedIndex = this._chat.length;
        this._chat.push(result);

        return result;
    }

    /**
     *
     * @param {ToolCall} toolCall
     * @returns {Promise<LLMMessage>}
     */
    async _executeToolCall (toolCall) {

        const tool = this._tools.get(toolCall.name);

        if (!tool) {
            this._llm.log.error(`LLM tool "${toolCall.name}": NOT FOUND`, {
                toolCall
            });
            return null;
        }

        let args;
        try {
            args = JSON.parse(toolCall.args);
            const fnResult = await Promise.resolve(tool.fn(args));

            /**
             * {
                "role": "assistant",
                "tool_calls": [
                    {
                    "id": "call_123",
                    "type": "function",
                    "function": {
                        "name": "get_weather",
                        "arguments": "{\"city\": \"Prague\"}"
                    }
                    }
                ]
                },
             */
            return {
                content: typeof fnResult === 'string' ? fnResult : JSON.stringify(fnResult),
                role: 'tool',
                toolCallId: toolCall.id
            };
        } catch (e) {
            this._llm.log.error(`LLM tool ${toolCall.name}: ${e.message}`, e, {
                args, toolCall
            });
            return null;
        }
    }

    /**
     *
     * @returns {Promise<string>}
     */
    async lastResponse () {
        await this._awaitIfNotNestedCall();
        return this.lastResponseSync();
    }

    /**
     *
     * @returns {string}
     */
    lastResponseSync () {
        const messages = [];
        for (let i = this._chat.length - 1; i >= 0; i--) {
            const message = this._chat[i];
            if (!('role' in message) || !('content' in message)) {
                break;
            }
            if (message.role !== ROLE_ASSISTANT || !message.content) {
                break;
            }
            messages.unshift(message.content);
        }
        return messages.join('\n\n');
    }

    /**
     *
     * @param {boolean} [dontMarkAsSent=false]
     * @returns {Promise<LLMMessage[]>}
     */
    async messagesToSend (dontMarkAsSent = false) {
        await this._awaitIfNotNestedCall();
        return this.messagesToSendSync(dontMarkAsSent);
    }

    /**
     *
     * @param {boolean} [dontMarkAsSent=false]
     * @returns {LLMMessage[]}
     */
    messagesToSendSync (dontMarkAsSent = false) {
        if (!this._generatedIndex) {
            return [];
        }

        const allMessages = this._chat.splice(this._generatedIndex);
        let messages = this._processSyncMessages(allMessages);
        messages = messages.flatMap((msg) => LLMSession.toMessages(msg));

        // probably issue - generated messages are now not in the chat
        if (dontMarkAsSent) {
            return messages;
        }

        this._generatedIndex = null;
        this._chat.push(...messages);

        return messages;
    }

    /**
     *
     * @param {QuickReply[]} quickReplies
     * @returns {this}
     */
    send (quickReplies = undefined) {
        this._job(() => {
            const messages = this.messagesToSendSync();
            this._onSend(messages, quickReplies);
        }, true);

        return this;
    }

    /**
     *
     * @param {LLMMessage} result
     * @returns {LLMMessage[]}
     */
    static toMessages (result) {
        let filtered = result.content
            .replace(/\n\n\n+/g, '\n\n')
            .split(/\n\n+(?!\s*-)/g)
            .map((t) => t.replace(/\s*\n\s+/g, '\n')
                .trim())
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

module.exports = LLMSession;
