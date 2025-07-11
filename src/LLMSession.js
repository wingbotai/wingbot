/**
 * @author David Menger
 */
'use strict';

const LLM = require('./LLM');

/** @typedef {import('./Responder').QuickReply} QuickReply */
/** @typedef {import('./LLM').LLMProviderOptions} LLMProviderOptions */

/** @typedef {'user'|'assistant'} LLMChatRole */
/** @typedef {'system'} LLMSystemRole */
/** @typedef {'tool'} LLMToolRole */
/** @typedef {LLMChatRole|LLMSystemRole|LLMToolRole|string} LLMRole */

/** @typedef {'stop'|'length'|'tool_calls'|'content_filter'} LLMFinishReason */

/**
 * @typedef {object} ToolCall
 * @prop {string} id
 * @prop {string} name
 * @prop {string} args - JSON string
 */

/**
 * @template {LLMRole} [R=LLMRole]
 * @typedef {object} LLMMessage
 * @prop {R} role
 * @prop {string} content
 * @prop {string} [toolCallId]
 * @prop {LLMFinishReason} [finishReason]
 * @prop {ToolCall[]} [toolCalls]
 */

/**
 * @callback SendCallback
 * @param {LLMMessage[]} messages
 * @param {QuickReply[]} quickReplies
 */

/**
 * @class LLMSession
 */
class LLMSession {

    /**
     *
     * @param {LLM} llm
     * @param {LLMMessage<any>[]} [chat]
     * @param {SendCallback} [onSend]
     */
    constructor (llm, chat = [], onSend = () => {}) {
        this._llm = llm;

        this._onSend = onSend;

        /** @type {LLMMessage<any>[]} */
        this._chat = chat;

        this._generatedIndex = null;

        this._sort();
    }

    _sort (what = this._chat) {
        what.sort((a, z) => {
            if (a.role === z.role
                || (a.role !== LLM.ROLE_SYSTEM && z.role !== LLM.ROLE_SYSTEM)) {
                return 0;
            }
            return a.role === LLM.ROLE_SYSTEM ? -1 : 1;
        });
        return what;
    }

    _mergeSystem () {
        /** @type {LLMMessage<any>[]} */
        const sysMessages = [];

        const otherMessages = this._chat.filter((message) => {
            if (message.role !== LLM.ROLE_SYSTEM) {
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
                role: LLM.ROLE_SYSTEM, content
            },
            ...otherMessages
        ];
    }

    /**
     * @returns {LLMMessage[]}
     */
    toArray () {
        return this._mergeSystem();
    }

    /**
     *
     * @param {LLMMessage} msg
     * @returns {string}
     */
    _msgPrefix (msg) {
        switch (msg.role) {
            case LLM.ROLE_SYSTEM:
                return '-';
            case LLM.ROLE_ASSISTANT:
                return msg.content ? '<' : '#';
            case LLM.ROLE_USER:
                return '>';
            default:
                return '*';
        }
    }

    /**
     *
     * @param {LLMMessage[]} [messages]
     * @returns {string}
     */
    toString (messages = this._chat) {
        if (messages.length === 0) {
            return '[<empty>]';
        }
        return messages.map((m) => {
            switch (m.role) {
                case LLM.ROLE_SYSTEM:
                    return `--- system ---\n${m.content}\n--------------`;
                default:
                    return `${this._msgPrefix(m)} ${m.content}`;
            }
        })
            .join('\n');
    }

    toJSON () {
        return this.toArray();
    }

    /**
     *
     * @param {boolean} [needRaw=false]
     * @returns {this}
     */
    debug (needRaw = false) {
        // eslint-disable-next-line no-console
        console.log('LLMSession#debug\n', this.toString(
            needRaw ? this._chat : this.toArray()
        ));
        return this;
    }

    /**
     *
     * @param {LLMMessage} message
     * @returns {this}
     */
    push (message) {
        // if its system, append it on top
        this._chat.push(message);
        return this;
    }

    /**
     *
     * @param {string} content
     * @returns {this}
     */
    systemPrompt (content) {
        this.push({
            role: LLM.ROLE_SYSTEM,
            content
        });
        this._sort();
        return this;
    }

    /**
     *
     * @param {LLMProviderOptions} [options={}]
     * @returns {Promise<LLMMessage<any>>}
     */
    async generate (options = {}) {
        const result = await this._llm.generate(this, options);

        this._generatedIndex = this._chat.length;
        this._chat.push(result);

        return result;
    }

    /**
     *
     * @param {boolean} [dontMarkAsSent=false]
     * @returns {LLMMessage[]}
     */
    messagesToSend (dontMarkAsSent = false) {
        if (!this._generatedIndex) {
            return [];
        }

        let messages = this._chat.splice(this._generatedIndex);
        messages = messages.flatMap((msg) => LLM.toMessages(msg));

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
        const messages = this.messagesToSend();

        this._onSend(messages, quickReplies);

        return this;
    }

}

module.exports = LLMSession;
