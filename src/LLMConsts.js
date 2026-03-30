/**
 * @author David Menger
 */
'use strict';

/** @typedef {import('./LLMSession').FilterScope} FilterScope */
/** @typedef {import('./LLM').LLMPresetName} LLMPresetName */
/** @typedef {import('./LLMSession').LLMRole} LLMRole */

/** @type {LLMPresetName} */
const PRESET_DEFAULT = 'default';

/** @type {LLMPresetName} */
const PRESET_ROUTING = 'routing';

/** @type {LLMPresetName} */
const PRESET_EMBEDDINGS = 'embeddings';

/** @type {LLMRole} */
const ROLE_USER = 'user';

/** @type {LLMRole} */
const ROLE_ASSISTANT = 'assistant';

/** @type {LLMRole} */
const ROLE_SYSTEM = 'system';

const GPT_FLAG = 'gpt';

/** @type {FilterScope} */
const FILTER_SCOPE_CONVERSATION = 'conversation';

module.exports = {
    PRESET_DEFAULT,
    PRESET_ROUTING,
    PRESET_EMBEDDINGS,
    ROLE_USER,
    ROLE_ASSISTANT,
    ROLE_SYSTEM,
    GPT_FLAG,
    FILTER_SCOPE_CONVERSATION
};
