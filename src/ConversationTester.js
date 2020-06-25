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
 * @prop {Function} getTestCases
 */

/**
 * @typedef {object} TestCase
 * @prop {string} list
 * @prop {string} name
 * @prop {TestCaseStep[]} steps
 */

/**
 * @typedef {object} TextCase
 * @prop {string} list
 * @prop {string} name
 * @prop {TextTest[]} texts
 */

/**
 * @typedef {object} TextTest
 * @prop {string} appId
 * @prop {string} text
 * @prop {string} action
 * @prop {string} intent
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
 * @typedef {object} TestsGroup
 * @prop {number} listId
 * @prop {string} list
 * @prop {string} type
 * @prop {TestCase[]|TextTest[]} testCases
 */

/**
 * @typedef {object} List
 * @prop {number} id
 * @prop {string} name
 * @prop {string} type
 * @prop {TestCase[]|TextTest[]} testCases
 */

/**
 * @typedef {object} TestsDefinition
 * @prop {List[]} lists
 */

/**
 * Callback for getting a tester
 *
 * @callback testerFactory
 * @param {Router|ReducerWrapper} bot - the chatbot itself
 * @param {TestsGroup} test - the chatbot itself
 * @returns {Tester}
 */

/**
 * @typedef {object} TestsOutput
 * @prop {number} total
 * @prop {number} passed
 * @prop {number} failed
 * @prop {number} skipped
 * @prop {string} output
 * @prop {string} summaryOutput
 * @prop {number} step
 * @prop {number} stepCount
 */

/**
 * Automated Conversation tests runner
 */
class ConversationTester {

    /**
     *
     * @param {TestSource} testsSource
     * @param {Function} botFactory
     * @param {object} [options]
     * @param {boolean} [options.disableAssertActions]
     * @param {boolean} [options.disableAssertTexts]
     * @param {boolean} [options.disableAssertQuickReplies]
     * @param {boolean} [options.useConversationForTextTestCases]
     * @param {boolean} [options.textThreshold]
     * @param {number} [options.stepCasesPerStep]
     * @param {number} [options.textCasesPerStep]
     * @param {number} [options.textCaseParallel]
     * @param {testerFactory} [options.testerFactory]
     */
    constructor (testsSource, botFactory, options = {}) {
        this._testsSource = testsSource;
        this._botFactory = botFactory;
        this._options = {
            stepCasesPerStep: 20,
            textCasesPerStep: 80,
            textCaseParallel: 20,
            ...options
        };
        this._output = '';
    }

    /**
     * Runs the conversation test
     *
     * @param {object} validationRequestBody
     * @param {number} step
     * @returns {Promise<TestsOutput>}
     */
    async test (validationRequestBody = null, step = null) {
        this._output = '';
        const testCases = await this._testsSource.getTestCases();
        const groups = this._getGroups(testCases);
        const testsGroups = this._getTestsGroups(groups, step);
        const stepCount = Number.isInteger(step) ? groups.length : 1;

        const botconfig = validationRequestBody;
        let failed = 0;
        let passed = 0;
        let skipped = 0;
        let summaryOutput = '';

        try {
            const results = [];
            for (const testsGroup of testsGroups) {
                let stepResult;
                if (testsGroup.type === 'texts') {
                    stepResult = await this._runTextCaseTests(testsGroup, botconfig);
                }
                if (testsGroup.type === 'steps') {
                    stepResult = await this._runStepCaseTests(testsGroup, botconfig);
                }
                results.push(stepResult);
            }

            const resultsByList = new Map();
            let list = null;
            let i = 0;
            for (const stepCase of testsGroups) {
                if (stepCase.list !== list) {
                    ({ list } = stepCase);
                    this._output += `\n- ${list}\n`;
                    resultsByList.set(list, {
                        failed: 0,
                        passed: 0
                    });
                }
                const stepResults = results[i];
                for (const result of stepResults) {
                    if (!result.ok) {
                        failed++;
                        resultsByList.get(stepCase.list).failed++;
                    } else {
                        passed++;
                        resultsByList.get(stepCase.list).passed++;
                    }
                    this._output += result.o;
                }
                i++;
            }

            skipped = testsGroups.length - (passed + failed);

            if (!step) {
                summaryOutput += `\nPASSED: ${passed}, FAILED: ${failed}, SKIPPED: ${skipped}\n\n`;
            }

            for (const [listName, listResults] of resultsByList.entries()) {
                summaryOutput += ` ${listResults.failed ? '✗' : '✓'} ${listName}: (✓: ${listResults.passed}, ✗: ${listResults.failed})\n`;
            }

            if (!step) {
                this._output += summaryOutput;
            }

        } catch (e) {
            this._output += `\nBot test failed: ${e.message}\n`;
        }
        return {
            output: this._output,
            summaryOutput,
            total: testsGroups.reduce((total, stepCase) => total + stepCase.testCases.length, 0),
            passed,
            failed,
            skipped,
            step,
            stepCount
        };
    }

    /**
     *
     * @param {TestCase[]|TextCase[]} testCases
     * @returns {List[]}
     */
    _getLists (testCases) {
        const getType = (cases) => {
            const [testCase] = cases;
            if (testCase.texts) return 'texts';
            if (testCase.steps) return 'steps';
            // eslint-disable-next-line no-console
            console.warn('unexpected testCase:', testCase);
            return null;
        };
        const getTestCases = (cases) => {
            const type = getType(cases);
            if (type === 'texts') {
                return cases.reduce(
                    (tests, testCase) => tests.concat(
                        testCase.texts.map((text) => ({
                            name: testCase.name,
                            ...text
                        }))
                    ),
                    []
                );
            }
            if (type === 'steps') {
                return cases.map((testCase) => ({
                    name: testCase.name,
                    steps: testCase.steps
                }));
            }
            // eslint-disable-next-line no-console
            console.warn('unexpected type:', type);
            return [];
        };

        const listCases = this._getListCases(testCases);
        const lists = [];
        let id = 0;
        for (const [list, cases] of listCases.entries()) {
            const type = getType(cases);

            if (type === null) continue;

            lists.push({
                id,
                name: list,
                type,
                testCases: getTestCases(cases)
            });
            id++;
        }

        return lists;
    }

    /**
     *
     * @param {TestCase[]|TextCase[]} testCases
     * @returns {Map<string,TestCase[]|TextCase[]>}
     */
    _getListCases (testCases) {
        return testCases
            // @ts-ignore
            .reduce(
                (map, testCase) => map.set(
                    testCase.list, [...(map.get(testCase.list) || []), testCase]
                ),
                new Map()
            );
    }

    /**
     *
     * @param {*} testCases
     * @returns {TestsGroup[]}
     */
    _getGroups (testCases) {
        const { textCasesPerStep, stepCasesPerStep } = this._options;
        const lists = this._getLists(testCases);

        const steps = [];
        for (const list of lists) {
            while (list.testCases.length > 0) {
                const tests = list.testCases
                    .splice(0, list.type === 'texts' ? textCasesPerStep : stepCasesPerStep);

                steps.push({
                    listId: list.id,
                    list: list.name,
                    type: list.type,
                    testCases: tests
                });
            }
        }

        return steps;
    }

    /**
     *
     * @param {TestsGroup[]} testsGroups
     * @param {number} step
     */
    _getTestsGroups (testsGroups, step) {
        if (!Number.isInteger(step)) return testsGroups;

        return testsGroups[step - 1] ? [testsGroups[step - 1]] : [];
    }

    /**
     *
     * @param {TestsGroup} testsGroup
     * @param {object} [botconfig]
     * @returns {Tester}
     */
    _createTester (testsGroup, botconfig = null) {
        const bot = this._botFactory(true);

        if (botconfig) {
            bot.buildWithSnapshot(botconfig.blocks, Number.MAX_SAFE_INTEGER);
        }

        let t;

        if (typeof this._options.testerFactory === 'function') {
            t = this._options.testerFactory(bot, testsGroup);
        } else {
            t = new Tester(bot);
        }

        t.setExpandRandomTexts();

        return t;
    }

    /**
     *
     * @param {TestsGroup} testsGroup
     * @param {object} botconfig
     */
    async _runTextCaseTests (testsGroup, botconfig = null) {
        const t = this._createTester(testsGroup, botconfig);
        let out = '';
        let passing = 0;
        let longestText = 0;

        // @ts-ignore
        const iterate = testsGroup.testCases.map((textCase) => {
            if (textCase.text.length > longestText) longestText = textCase.text.length;
            return textCase;
        });

        const textResults = [];

        const { textCaseParallel } = this._options;
        const runTestCase = (textCase) => this
            .executeTextCase(testsGroup, t, textCase, botconfig, longestText);

        while (iterate.length > 0) {
            const cases = iterate.splice(0, textCaseParallel);

            const singleResults = await Promise.all(
                cases.map(runTestCase)
            );

            textResults.push(...singleResults);
        }

        const echo = textResults
            .filter((r) => {
                if (r.ok) passing++;
                return !!r.o;
            })
            .map((r) => r.o)
            .join('\n');

        // calculate stats
        const passingPerc = passing / testsGroup.testCases.length;

        const ok = passingPerc >= (this._options.textThreshold || DEFAULT_TEXT_THRESHOLD);
        const mark = ok ? '✓' : '✗';

        let before = '';

        if (echo) {
            before += `\n${echo}\n\n`;
        }

        out += `${before}     ${mark} ${testsGroup.list} ${passing}/${testsGroup.testCases.length} (${(passingPerc * 100).toFixed(0)}%)\n`;

        return [{ o: out, ok }];
    }

    /**
     *
     * @param {TestsGroup} testsGroup
     * @param {object} botconfig
     */
    async _runStepCaseTests (testsGroup, botconfig = null) {
        const t = this._createTester(testsGroup, botconfig);
        const out = [];

        for (const testCase of testsGroup.testCases) {
            let o = '';
            let fail = null;
            // @ts-ignore
            for (const step of testCase.steps) {
                // eslint-disable-next-line no-await-in-loop
                fail = await this.executeStep(t, step);
                if (fail) break;
            }
            if (fail) {
                // @ts-ignore
                o += `FAILED ${testCase.name}\n\n`;
                o += `${fail}\n\n`;
                out.push({ o, ok: false });
            } else {
                // @ts-ignore
                o += `     ✓ ${testCase.name}\n`;
                out.push({ o, ok: true });
            }
        }

        return out;
    }

    /**
     *
     * @param {TestsGroup} testsGroup
     * @param {Tester} t
     * @param {TextTest} textCase
     * @param {*} botconfig
     * @param {number} longestText
     */
    async executeTextCase (testsGroup, t, textCase, botconfig, longestText) {
        if (this._options.useConversationForTextTestCases) {
            const tester = this._createTester(testsGroup, botconfig);

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
     * @param {TestCaseStep} step
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
                    .map((a) => (a.trim().match(/^[a-z\-0-9/]+$/) ? a : tokenize(a)))
                    .forEach((a) => a && t.passedAction(a));
            }

            const any = t.any();
            if (!this._options.disableAssertQuickReplies) {
                textContains.split(/\n|@[A-Z_]+/)
                    .map((a) => a.trim())
                    .forEach((a) => a && any.contains(a));
            }

            if (!this._options.disableAssertTexts) {
                quickRepliesContains.split('\n')
                    .map((a) => a.trim())
                    .forEach((a) => a && any.quickReplyTextContains(a));
            }

            return null;
        } catch (e) {
            const { message } = e;

            let { stepDescription = '' } = step;
            stepDescription = stepDescription.trim();

            return `    error at ${step.step} step, (row: ${step.rowNum}${stepDescription ? `, ${stepDescription}` : ''})\n      [visited interactions: \`${t.actions.filter((a) => !a.doNotTrack).map((a) => a.action).join('`, `')}\`]\n\n${message}\n`;
        }
    }

}

module.exports = ConversationTester;
