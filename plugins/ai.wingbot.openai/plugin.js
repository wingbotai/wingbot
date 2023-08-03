/**
 * @author wingbot.ai
 */
'use strict';

const fetch = require('node-fetch').default;
const Responder = require('../../src/Responder');
const compileWithState = require('../../src/utils/compileWithState');

const MSG_REPLACE = '#MSG-REPLACE#';

const CHAR_LIM = 4096;

function chatgptPlugin (params, configuration = {}) {
    const {
        openAiEndpoint = null,
        openAiApiKey = null
    } = configuration;

    async function chatgpt (req, res) {
        const content = req.text();

        const charLim = params.charLim || CHAR_LIM;

        const token = compileWithState(req, res, params.token).trim();

        // gpt-3.5-turbo-0301 gpt-3.5-turbo
        const model = compileWithState(req, res, params.model) || 'gpt-3.5-turbo';

        const system = compileWithState(req, res, params.system).trim();

        // 0 - 2
        const temperature = parseFloat(compileWithState(req, res, params.temperature).trim().replace(',', '.') || '1') || 1;
        // presence_penalty between -2.0 and 2.0
        const presence = parseFloat(compileWithState(req, res, params.presence).trim().replace(',', '.') || '0') || 0;

        const maxTokens = parseFloat(compileWithState(req, res, params.maxTokens).trim() || '512') || 512;

        const limit = parseInt(compileWithState(req, res, params.limit).trim() || '10', 10) || 10;

        const user = `${req.pageId}|${req.senderId}`;

        const systemAfter = compileWithState(req, res, params.systemAfter).trim();

        const replacedAnnotation = `${params.annotation || ''}`.replace(/\{\{message\}\}/g, MSG_REPLACE);
        const annotation = compileWithState(req, res, replacedAnnotation).trim();

        const persona = compileWithState(req, res, params.persona).trim();

        const continueConfig = params.continueConfig || [];
        const lang = `${res.newState.lang || req.state.lang || 'default'}`.trim().toLowerCase();
        const continueReply = continueConfig.find((c) => `${c.lang}`.trim().toLowerCase() === lang)
            || continueConfig.find((c) => ['default', '']
                .includes(`${c.lang || ''}`.trim().toLowerCase()));

        let body;

        try {
            res.setFlag('gpt');
            res.typingOn();

            body = {
                model,
                frequency_penalty: 0,
                presence_penalty: presence,
                max_tokens: maxTokens,
                temperature,
                user
            };

            const onlyFlag = Math.sign(limit) === -1 ? 'gpt' : null;

            const ts = await res.getTranscript(Math.abs(limit), onlyFlag);

            let total = (system ? system.length : 0)
                + (systemAfter ? systemAfter.length : 0)
                + maxTokens
                + content.length;

            for (let i = ts.length - 1; i >= 0; i--) {
                total += ts[i].text.length;
                if (total > charLim) {
                    ts.splice(i, 1);
                }
            }

            const messages = [
                ...(system ? [{ role: 'system', content: system }] : []),
                ...ts.map((t) => ({ role: t.fromBot ? 'assistant' : 'user', content: t.text })),
                { role: 'user', content },
                ...(systemAfter ? [{ role: 'system', content: systemAfter }] : [])
            ];

            Object.assign(body, { messages });

            const useFetch = params.fetch || fetch;

            const apiUrl = openAiEndpoint
                ? `${openAiEndpoint}/chat/completions?api-version=2023-03-15-preview`
                : 'https://api.openai.com/v1/chat/completions';

            const response = await useFetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(openAiEndpoint
                        ? { 'api-key': token || openAiApiKey }
                        : { Authorization: `Bearer ${token || openAiApiKey}` })
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.status !== 200
                || !Array.isArray(data.choices)) {
                const { status, statusText } = response;
                // eslint-disable-next-line no-console
                console.log('chat gpt error', {
                    status, statusText, data, apiUrl
                });
                throw new Error(`Chat GPT ${status}`);
            }

            // eslint-disable-next-line no-console
            console.log('chat gpt', JSON.stringify(data));

            const sent = data.choices
                .filter((ch) => ch.message && ch.message.role === 'assistant' && ch.message.content)
                .map((ch) => {

                    let sliced = data.usage && data.usage.completion_tokens >= maxTokens;

                    let filtered = ch.message.content
                        .replace(/\n\n/g, '\n')
                        .split(/\n+(?!-)/g)
                        .filter((t) => !!t.trim());

                    if (filtered.length > 2) {
                        filtered = filtered.slice(0, filtered.length - 1);
                        sliced = true;
                    }

                    if (persona) {
                        res.setPersona({ name: persona });
                    }

                    filtered
                        .forEach((t, fi) => {
                            let trim = t.trim();

                            if (annotation) {
                                // replace the annotation first

                                const replacements = annotation.split(MSG_REPLACE);
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

                            if (annotation && annotation.includes(MSG_REPLACE)) {
                                trim = annotation.replace(MSG_REPLACE, trim);
                            } else if (annotation) {
                                trim = `${annotation} ${trim}`;
                            }

                            res.text(trim, sliced && fi === (filtered.length - 1) && continueReply
                                ? [
                                    {
                                        title: continueReply.title,
                                        action: res.currentAction()
                                    }
                                ]
                                : null);
                        });

                    if (persona) {
                        res.setPersona({ name: null });
                    }

                    return ch;
                });

            if (sent.length === 0) {
                const { status, statusText } = response;
                // eslint-disable-next-line no-console
                console.log('chat gpt nothing to send', { status, statusText, data });
                throw new Error('Chat GPT empty');
            }

        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('chat gpt fail', e, body);
            await res.run('fallback');
        }

    }

    return chatgpt;
}

module.exports = chatgptPlugin;
