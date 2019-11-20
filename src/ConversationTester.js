/**
 * @author David Menger
 */
'use strict';

const Tester = require('./Tester');
const { tokenize } = require('./utils/tokenizer');

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

    async _runTestCase (testCase, botconfig = null) {
        let o = '';

        const bot = this._botFactory(true);

        if (botconfig) {
            bot.buildWithSnapshot(botconfig.blocks, Number.MAX_SAFE_INTEGER);
        }

        const t = new Tester(bot);

        t.setExpandRandomTexts();

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
