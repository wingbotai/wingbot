/**
 * @author David Menger
 */
'use strict';

const { getSetState } = require('./utils/getUpdate');
const { PHONE_REGEX, EMAIL_REGEX } = require('./systemEntities/regexps');
const getCondition = require('./utils/getCondition');
const stateData = require('./utils/stateData');
const Ai = require('./Ai');
const {
    PRESET_DEFAULT,
    PRESET_ROUTING,
    PRESET_EMBEDDINGS,
    ROLE_USER,
    ROLE_ASSISTANT,
    ROLE_SYSTEM,
    FILTER_SCOPE_CONVERSATION
} = require('./LLMConsts');
const LLMSession = require('./LLMSession');
// const getCondition = require('./utils/getCondition');

/** @typedef {import('./Responder')} Responder */
/** @typedef {import('./AiMatching').PreprocessorOutput} PreprocessorOutput */
/** @typedef {import('./Request')} Request */
/** @typedef {import('./Responder').Persona} Persona */
/** @typedef {import('./Router').BaseConfiguration} BaseConfiguration */
/** @typedef {import('./LLMSession').LLMMessage<any>} LLMMessage */
/** @typedef {import('./LLMSession').ToolCall} ToolCall */
/** @typedef {import('./LLMSession').LLMRole} LLMRole */
/** @typedef {import('./LLMSession').FilterScope} FilterScope */
/** @typedef {import('./LLMSession').JsonSchemaProp} JsonSchemaProp */
/** @typedef {import('./LLMSession').JsonSchemaProp} SimpleJsonSchema */
/** @typedef {import('./LLMSession').ToolFunction} ToolFunction */

/** @typedef {import('./transcript/transcriptFromHistory').Transcript} Transcript */
/** @typedef {import('./utils/getCondition').ConditionDefinition} ConditionDefinition */
/** @typedef {import('./utils/getCondition').ConditionContext} ConditionContext */
/** @typedef {import('./utils/stateData').IStateRequest} IStateRequest */

/** @typedef {string|'_DISCARD'} EvaluationRuleAction */

/**
 * @typedef {object} EvaluationRuleData
 * @prop {EvaluationRuleAction} [action]
 * @prop {object} [setState]
 */

/**
 * @typedef {object} RuleDefinitionData
 * @prop {string[]} aiTags
 * @prop {EvaluationRuleAction} [targetRouteId]
 */

/**
 * @typedef {EvaluationRuleData & RuleDefinitionData & ConditionDefinition} EvaluationRule
 */

/**
 * @typedef {object} PrepocessedRuleData
 * @prop {Function} condition
 * @prop {PreprocessorOutput} rule
 */

/**
 * @typedef {EvaluationRuleData & PrepocessedRuleData} PreprocessedRule
 */

/**
 * @typedef {object} RuleScore
 * @prop {number} score
 */

/**
 * @typedef {RuleScore & PreprocessedRule} RuleWithScore
 */

/**
 * @typedef {object} EvaluationResult
 * @prop {string} action
 * @prop {boolean} discard
 * @prop {RuleWithScore[]} results
 * @prop {object} setState
 */

/**
 * @callback LLMChatProviderPrompt
 * @param {LLMMessage[]} prompt
 * @param {LLMProviderOptions} [options]
 * @param {ToolFunction[]} [tools]
 * @returns {Promise<LLMMessage>}
 */

/**
 * @typedef {object} ForcedFn
 * @prop {'function'|string} [type]
 * @prop {string} name
 */

/**
 * @typedef {object} LLMProviderOptions
 * @prop {string} [model]
 * @prop {boolean} [parallelToolCalls]
 * @prop {'auto'|'required'|'none'|ForcedFn|string} [toolChoice]
 * @prop {'none'|'low'|'medium'|'high'|string} [reasoningEffort]
 * @prop {'low'|'medium'|'high'|string} [verbosity]
 * @prop {'text'|SimpleJsonSchema} [responseFormat]
 */

/**
 * @typedef {object} LLMLogOptions
 * @prop {VectorSearchResult} [vectorSearchResult]
 */

/**
 * @typedef {object} LLMChatProvider
 * @prop {LLMChatProviderPrompt} requestChat
 */

/** @typedef {import('node-fetch').default} Fetch */

/**
 * @typedef {object} LLMOptionsExt
 * @prop {number} [transcriptLength=-5]
 * @prop {'gpt'|string} [transcriptFlag]
 * @prop {boolean} [transcriptAnonymize]
 */

/** @typedef {LLMOptionsExt & LLMProviderOptions} LLMOptions */
/** @typedef {LLMOptions & { preset?: LLMPresetName}} LLMCallOptions */
/** @typedef {'default'|'routing'|'embeddings'|string} LLMPresetName */

/** @typedef {LLMCallOptions|LLMPresetName} LLMCallPreset */

/**
 * @typedef {object} LLMGlobalConfigExt
 * @prop {LLMChatProvider} provider
 * @prop {Persona|string|null} [persona]
 * @prop {LLMLogger} [logger]
 * @prop {boolean} [disableLLM]
 * @prop {{ [key: LLMPresetName]: LLMOptions }} [presets]
 */

/**
 * @typedef {LLMGlobalConfigExt & LLMOptions} LLMGlobalConfig
 */

/**
 * @typedef {object} AnonymizeRegexp
 * @prop {string} [replacement]
 * @prop {RegExp} regex
 */

/**
 * @typedef {object} PromptInfo
 * @prop {LLMMessage[]} prompt
 * @prop {LLMMessage} result
 * @prop {VectorSearchResult} [vectorSearchResult]
 */

/**
 * @callback LogPrompt
 * @param {PromptInfo} info
 */

/**
 * @typedef {object} LLMLogger
 * @prop {LogPrompt} logPrompt
 */

/**
 * @typedef {object} Logger
 * @prop {Function} log
 * @prop {Function} error
 */

/**
 * @typedef {object} VectorSearchDocument
 * @property {string} id
 * @property {string} name
 * @property {string} text
 * @property {number} cosineDistance
 * @property {boolean} excludedByCosineDistanceThreshold
 */
/**
 * @typedef {object} VectorSearchResult
 * @property {number} maximalCosineDistanceThreshold
 * @property {number} nearestNeighbourCount
 * @property {VectorSearchDocument[]} resultDocuments
 */
/**
 * @class LLM
 */
class LLM {

    /** @type {LLMPresetName} */
    static PRESET_DEFAULT = PRESET_DEFAULT;

    /** @type {LLMPresetName} */
    static PRESET_ROUTING = PRESET_ROUTING;

    /** @type {LLMPresetName} */
    static PRESET_EMBEDDINGS = PRESET_EMBEDDINGS;

    /** @type {LLMRole} */
    static ROLE_USER = ROLE_USER;

    /** @type {LLMRole} */
    static ROLE_ASSISTANT = ROLE_ASSISTANT;

    /** @type {LLMRole} */
    static ROLE_SYSTEM = ROLE_SYSTEM;

    static GPT_FLAG = 'gpt';

    /** @type {FilterScope} */
    static FILTER_SCOPE_CONVERSATION = FILTER_SCOPE_CONVERSATION;

    static EVALUATION_ACTIONS = {
        DISCARD: '_DISCARD'
    };

    /** @type {AnonymizeRegexp[]} */
    static anonymizeRegexps = [
        { replacement: '@PHONE', regex: new RegExp(PHONE_REGEX.source, 'g') },
        { replacement: '@EMAIL', regex: new RegExp(EMAIL_REGEX.source, 'g') }
    ];

    /**
     *
     * @param {LLMGlobalConfig} configuration
     * @param {Ai} ai
     * @param {Logger} [log=console]
     */
    constructor (configuration, ai, log = console) {
        const {
            provider,
            presets = {},
            transcriptFlag = null,
            transcriptLength = 5,
            transcriptAnonymize = false,
            model = null,
            ...rest
        } = configuration;

        this._configuration = {
            transcriptFlag: null,
            transcriptLength: 5,
            provider: null,
            logger: {
                logPrompt: () => {}
            },
            ...rest
        };

        /** @type {LLMOptions} */
        const defaultPreset = {
            model,
            transcriptFlag,
            transcriptLength,
            transcriptAnonymize
        };

        this._presets = new Map(
            Object.entries(presets)
                .map(([k, v]) => [k, {
                    ...defaultPreset,
                    ...v
                }])
        );

        if (!this._presets.has(LLM.PRESET_DEFAULT)) {
            this._presets.set(LLM.PRESET_DEFAULT, defaultPreset);
        }

        if (!this._presets.has(LLM.PRESET_ROUTING)) {
            this._presets.set(LLM.PRESET_ROUTING, defaultPreset);
        }

        /** @type {LLMChatProvider} */
        this._provider = provider;

        this._ai = ai;

        /** @type {LLMMessage} */
        this._lastResult = null;

        this.log = log;
    }

    /**
     * @returns {Ai}
     */
    get ai () {
        return this._ai;
    }

    /**
     * @returns {LLMMessage}
     */
    get lastResult () {
        return this._lastResult;
    }

    /**
     * @deprecated
     * @returns {Omit<LLMGlobalConfig, 'provider'>}
     */
    get configuration () {
        return this._configuration;
    }

    /**
     * @returns {LLMSession}
     */
    session () {
        return new LLMSession(this);
    }

    /**
     *
     * @param {LLMCallPreset} [requestedPreset]
     */
    llmOptions (requestedPreset = LLM.PRESET_DEFAULT) {
        let preset;
        let override;

        if (typeof requestedPreset === 'string') {
            preset = requestedPreset;
        } else {
            ({ preset = LLM.PRESET_DEFAULT, ...override } = requestedPreset);
        }

        if (!this._presets.has(preset)) {
            throw new Error(`LLM Preset '${preset}' does not exist.`);
        }
        return {
            ...this._presets.get(preset),
            ...override
        };
    }

    // /**
    //  *
    //  * @param {Partial<LLMConfiguration>} override
    //  */
    // setSessionConfig (override) {
    //     Object.assign(this._configuration, override);
    // }

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
     * @param {LLMCallPreset} [preset={}]
     * @param {LLMLogOptions} [logOptions]
     * @returns {Promise<LLMMessage>}
     */
    async generate (session, preset = {}, logOptions = {}) {
        const opts = this.llmOptions(preset);
        const prompt = await session.toArray(true);
        const result = await this._provider.requestChat(prompt, opts, session.tools);
        this.logPrompt(prompt, result, logOptions.vectorSearchResult);
        return result;
    }

    /**
     *
     * @param {LLMMessage[]} prompt
     * @param {LLMMessage} result
     * @param {VectorSearchResult} [vectorSearchResult]
     */
    logPrompt (prompt, result, vectorSearchResult) {
        this._lastResult = result;
        this._configuration.logger.logPrompt({
            prompt, result, vectorSearchResult
        });
    }

    /**
     *
     * @param {EvaluationRule[]} rules
     * @param {ConditionContext} [context]
     * @returns {PreprocessedRule[]}
     */
    static preprocessEvaluationRules (rules, context = {}) {
        const {
            linksMap = new Map(),
            ai = Ai.ai
        } = context;

        return rules.map((evalRule) => {
            const { aiTags, targetRouteId, ...rest } = evalRule;

            const condition = getCondition(rest, context);
            const rule = ai.matcher.preprocessRule(aiTags);

            let { action = null } = evalRule;

            if (!action && targetRouteId && linksMap.has(targetRouteId)) {
                action = linksMap.get(targetRouteId);
            }

            return {
                ...rest,
                condition,
                rule
            };
        });
    }

    /**
     * Returns all actions, which has been recognized
     * with higher score than threshold, but
     *
     * - _DISCARD action discards any other rules (will return all relevant _DISCARD actions)
     * - only the TOP ranked "interaction" action will be returned
     * - actions will come in THE SAME order, so the "setState" will be applied in the same order
     *
     *
     * @param {LLMMessage|string} result
     * @param {PreprocessedRule[]} rules
     * @param {IStateRequest} req
     * @param {Responder} res
     * @returns {Promise<EvaluationResult>}
     */
    async evaluateResultWithRules (result, rules, req, res) {
        const text = typeof result === 'string' ? result : result.content;
        const nlpResult = await this._ai.queryModel(text, req);
        const state = stateData(req, res);

        let topRankedAction = null;
        let topActionScore = 0;
        let discard = false;
        const setState = {};

        const sAct = Object.values(LLM.EVALUATION_ACTIONS);

        const results = rules
            .filter((rule) => rule.condition(req, res))
            .map((rule) => {
                const matched = this._ai.matcher
                    .matchText(text, rule.rule, nlpResult, state);

                if (!matched || matched.score < this._ai.threshold) {
                    return null;
                }

                if (rule.action === LLM.EVALUATION_ACTIONS.DISCARD) {
                    discard = true;
                } else if (rule.action && topActionScore < matched.score) {
                    topRankedAction = rule.action;
                    topActionScore = matched.score;
                }

                return {
                    ...rule,
                    score: matched.score
                };
            })
            .filter((rule) => rule !== null
                && (!discard || rule.action === LLM.EVALUATION_ACTIONS.DISCARD)
                && (!rule.action || rule.action === topRankedAction || sAct.includes(rule.action)));

        results.forEach((rule) => {
            Object.assign(setState, getSetState(rule.setState, req, res, setState));
        });

        return {
            setState,
            results,
            discard,
            action: discard ? null : topRankedAction
        };
    }

}

module.exports = LLM;
