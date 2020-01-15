/**
 * @author David Menger
 */
'use strict';

const Tester = require('./Tester');
const { tokenize } = require('./utils/tokenizer');
const { actionMatches } = require('./utils/pathUtils');

const DEFAULT_TEXT_THRESHOLD = 0.8;

/**
 * @typedef {object} TestSource
 * @prop {function} getTestCases
 */

/**
 * @typedef {object} TestCaseStep
 * @prop {number} step
 * @prop {number} rowNum
 * @prop {string} action
 * @prop {string} passedAction
 * @prop {string} textContains
 * @prop {string} quickRepliesContains
 * @prop {string} stepDescription
 */

/**
 * @typedef {object} TestCase
 * @prop {string} list
 * @prop {string} name
 * @prop {TestCaseStep[]} steps
 */

/**
 * @typedef {object} TestsOutput
 * @prop {number} total
 * @prop {number} passed
 * @prop {number} failed
 * @prop {string} output
 */

/**
 * Automated Conversation tests runner
 */
class ConversationTester {

    /**
     *
     * @param {TestSource} testsSource
     * @param {Function} botFactory
     * @param {Object} [options]
     * @param {boolean} [options.disableAssertActions]
     * @param {boolean} [options.disableAssertTexts]
     * @param {boolean} [options.disableAssertQuickReplies]
     * @param {boolean} [options.useConversationForTextTestCases]
     * @param {boolean} [options.textThreshold]
     */
    constructor (testsSource, botFactory, options = {}) {
        this._testsSource = testsSource;
        this._botFactory = botFactory;
        this._options = options;
        this._output = '';
    }

    /**
     * Runs the conversation test
     *
     * @param {Object} validationRequestBody
     * @returns {Promise<TestsOutput>}
     */
    async test (validationRequestBody = null) {
        this._output = '';
        const testCases = await this._testsSource.getTestCases();

        testCases.sort((a, b) => `${a.list}`.toLocaleLowerCase().localeCompare(`${b.list}`.toLocaleLowerCase()));

        let failed = 0;
        let passed = 0;
        let botconfig = validationRequestBody;

        const resultsByList = new Map();

        try {
            const bot = this._botFactory(true);
            if (!botconfig && typeof bot.loadBot === 'function') {
                botconfig = await bot.loadBot();
            }

            // just to try
            if (typeof bot.buildWithSnapshot === 'function') {
                bot.buildWithSnapshot(botconfig.blocks, Number.MAX_SAFE_INTEGER);
            }

            let list = null;

            const results = await Promise.all(
                testCases.map(t => this._runTestCase(t, botconfig))
            );

            let i = 0;
            for (const testCase of testCases) {
                if (testCase.list !== list) {
                    ({ list } = testCase);
                    this._output += `\n- ${list}\n`;
                    resultsByList.set(list, {
                        failed: 0,
                        passed: 0
                    });
                }
                const result = results[i];
                if (!result.ok) {
                    failed++;
                    resultsByList.get(testCase.list).failed++;
                } else {
                    passed++;
                    resultsByList.get(testCase.list).passed++;
                }
                this._output += result.o;
                i++;
            }

            this._output += `\nPASSED: ${passed}, FAILED: ${failed}, SKIPPED: ${testCases.length - (passed + failed)}\n\n`;

            for (const [listName, listResults] of resultsByList.entries()) {
                this._output += ` ${listResults.failed ? '𐄂' : '✓'} ${listName}: (✓: ${listResults.passed}, 𐄂: ${listResults.failed})\n`;
            }
        } catch (e) {
            this._output += `\nBot test failed: ${e.message}\n`;
        }
        return {
            output: this._output,
            total: testCases.length,
            passed,
            failed
        };
    }

    _createTester (botconfig = null) {
        const bot = this._botFactory(true);

        if (botconfig) {
            bot.buildWithSnapshot(botconfig.blocks, Number.MAX_SAFE_INTEGER);
        }

        const t = new Tester(bot);

        t.setExpandRandomTexts();

        return t;
    }

    async _runTestCase (testCase, botconfig = null) {
        let o = '';

        const t = this._createTester(botconfig);

        if (testCase.texts) {
            let passing = 0;

            let longestText = 0;

            const iterate = testCase.texts.map((textCase) => {
                if (textCase.text.length > longestText) longestText = textCase.text.length;
                return textCase;
            });

            const textResults = [];

            const runTestCase = textCase => this
                .executeTextCase(t, textCase, botconfig, longestText);

            while (iterate.length > 0) {
                const process = iterate.splice(0, 100);

                const singleResults = await Promise.all(
                    process.map(runTestCase)
                );

                textResults.push(...singleResults);
            }

            const echo = textResults
                .filter((r) => {
                    if (r.ok) {
                        passing++;
                    }
                    return !!r.o;
                })
                .map(r => r.o)
                .join('\n');

            // calculate stats
            const passingPerc = passing / testCase.texts.length;

            const ok = passingPerc >= (this._options.textThreshold || DEFAULT_TEXT_THRESHOLD);
            const mark = ok ? '✓' : '𐄂';

            let before = '';

            if (echo) {
                before += `\n${echo}\n\n`;
            }

            o += `${before}     ${mark} ${testCase.name} ${passing}/${testCase.texts.length} (${(passingPerc * 100).toFixed(0)}%)\n`;

            return { o, ok };
        }

        let fail = null;
        for (const step of testCase.steps) {
            // eslint-disable-next-line no-await-in-loop
            fail = await this.executeStep(t, step);
            if (fail) break;
        }

        if (fail) {
            o += `FAILED ${testCase.name}\n\n`;
            o += `${fail}\n\n`;
            return { o, ok: false };
        }
        o += `     ✓ ${testCase.name}\n`;
        return { o, ok: true };
    }

    /**
     *
     * @param {Tester} t
     * @param {*} textCase
     * @param {*} botconfig
     * @param {number} longestText
     */
    async executeTextCase (t, textCase, botconfig, longestText) {

        if (this._options.useConversationForTextTestCases) {
            const tester = this._createTester(botconfig);


            try {
                await tester.text(textCase.text);

                if (textCase.action) {
                    tester.passedAction(textCase.action);
                }

                if (textCase.appId) {
                    tester.any().passThread(textCase.appId);
                }
            } catch (e) {
                const { message } = e;

                return { ok: false, o: `${textCase.text.padEnd(longestText, ' ')} - ${message}` };
            }

            return { ok: true, o: null };
        }

        const actions = await t.processor.aiActionsForText(textCase.text, undefined, true);

        const [winner = {
            score: 0, intent: { intent: '-', score: 0 }, aboveConfidence: false, meta: null, action: null
        }] = actions;

        const report = (error = '', ok = false) => ({
            ok,
            o: `${textCase.text.padEnd(longestText, ' ')}\t${(winner.intent ? winner.intent.score : 0).toFixed(2)}\t${winner.intent ? winner.intent.intent : '-'} | ${error}`
        });

        if (actions.length === 0) {
            return report('no NLP result');
        }

        if (!winner.aboveConfidence) {
            return report('low score');
        }

        if (textCase.intent && winner.intent.intent !== textCase.intent) {
            return report(`expected intent "${textCase.intent}"`);
        }

        if (textCase.appId) {

            if (!winner.meta || `${winner.meta.targetAppId}` !== `${textCase.appId}`) {
                return report(`expected handover to "${textCase.appId}" - actual "${(winner.meta && winner.meta.targetAppId) || `action: ${winner.action || '*'}`}"`);
            }

            if (textCase.action && !actionMatches(`${winner.meta.targetAction}`, `${textCase.action}`)) {
                return report(`expected action "${textCase.action}" - actual "${winner.meta.targetAction || '-'}"`);
            }

        } else if (textCase.action && !actionMatches(`${winner.action}`, `${textCase.action}`)) {
            return report(`expected action "${textCase.action}" - actual "${winner.action || '-'}"`);
        }

        if (!textCase.action && !textCase.appId && !textCase.intent) {
            return report(`${textCase.action}`, true);
        }

        return { ok: true, o: null };
    }

    /**
     *
     * @param {Tester} t
     * @param {*} step
     */
    async executeStep (t, step) {
        try {
            const {
                action,
                passedAction = '',
                textContains = '',
                quickRepliesContains = ''
            } = step;

            if (action.match(/^#/)) {
                await t.postBack(action.replace(/^#/, ''));
            } else {
                const quickReplyRequired = action.match(/^>/);
                const cleanAction = action.replace(/^>/, '');
                let found;

                // action in quick reply
                if (action.match(/^>\//)) {
                    await t.quickReply(cleanAction);
                    found = true;
                } else {
                    found = await t.quickReplyText(cleanAction);
                }


                if (!found && quickReplyRequired) {
                    throw new Error(`Quick reply "${action.replace(/^>/, '')}" was required, but has not been found`);
                } else if (!found) {
                    await t.text(action);
                }
            }

            if (!this._options.disableAssertActions) {
                passedAction.split('\n')
                    .map(a => (a.trim().match(/^[a-z\-0-9/]+$/) ? a : tokenize(a)))
                    .forEach(a => a && t.passedAction(a));
            }

            const any = t.any();
            if (!this._options.disableAssertQuickReplies) {
                textContains.split(/\n|@[A-Z_]+/)
                    .map(a => a.trim())
                    .forEach(a => a && any.contains(a));
            }

            if (!this._options.disableAssertTexts) {
                quickRepliesContains.split('\n')
                    .map(a => a.trim())
                    .forEach(a => a && any.quickReplyTextContains(a));
            }

            return null;
        } catch (e) {
            const { message } = e;

            let { stepDescription = '' } = step;
            stepDescription = stepDescription.trim();

            return `    error at ${step.step} step, (row: ${step.rowNum}${stepDescription ? `, ${stepDescription}` : ''})\n      [visited interactions: \`${t.actions.filter(a => !a.doNotTrack).map(a => a.action).join('`, `')}\`]\n\n${message}\n`;
        }
    }


}


module.exports = ConversationTester;
