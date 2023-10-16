/**
 * @author wingbot.ai
 */
'use strict';

const fetch = require('node-fetch').default;
const Responder = require('../../src/Responder');
const ChatGpt = require('../../src/ChatGpt');
const compileWithState = require('../../src/utils/compileWithState');

const MSG_REPLACE = '#MSG-REPLACE#';

const CHAR_LIM = 4096;

function chatgptPlugin (params, configuration = {}) {
    const {
        openAiEndpoint = undefined,
        openAiApiKey = null
    } = configuration;

    async function chatgpt (req, res) {
        const token = compileWithState(req, res, params.token).trim();

        // gpt-3.5-turbo-0301 gpt-3.5-turbo
        const model = compileWithState(req, res, params.model) || 'gpt-3.5-turbo';

        const system = compileWithState(req, res, params.system).trim();

        // 0 - 2
        const temperature = parseFloat(compileWithState(req, res, params.temperature).trim().replace(',', '.') || '1') || undefined;
        // presence_penalty between -2.0 and 2.0
        const presence = parseFloat(compileWithState(req, res, params.presence).trim().replace(',', '.') || '0') || undefined;

        const requestTokens = parseFloat(compileWithState(req, res, params.maxTokens).trim() || '512') || undefined;

        const transcriptLength = parseInt(compileWithState(req, res, params.limit).trim() || '10', 10) || 10;

        const replacedAnnotation = `${params.annotation || ''}`.replace(/\{\{message\}\}/g, MSG_REPLACE);
        const annotation = compileWithState(req, res, replacedAnnotation).trim();

        const persona = compileWithState(req, res, params.persona).trim();

        const continueConfig = params.continueConfig || [];
        const lang = `${res.newState.lang || req.state.lang || 'default'}`.trim().toLowerCase();
        const continueReply = continueConfig.find((c) => `${c.lang}`.trim().toLowerCase() === lang)
            || continueConfig.find((c) => ['default', '']
                .includes(`${c.lang || ''}`.trim().toLowerCase()));

        const gpt = new ChatGpt({
            fetch: params.fetch,
            model,
            presencePenalty: presence,
            requestTokens,
            temperature,
            transcriptLength,
            openAiEndpoint,
            ...(openAiEndpoint
                ? { apiKey: token || openAiApiKey }
                : { authorization: token || openAiApiKey })
        });

        try {
            await gpt.respond(req, res, {
                system,
                persona,
                continueReply,
                annotation
            });
        } catch (e) {
            await res.run('fallback');
        }

    }

    return chatgpt;
}

module.exports = chatgptPlugin;
