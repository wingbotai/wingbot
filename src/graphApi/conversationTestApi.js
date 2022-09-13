/**
 * @author David Menger
 */
'use strict';

const apiAuthorizer = require('./apiAuthorizer');
const ConversationTester = require('../ConversationTester');

/**
 * @typedef {object} TestSource
 * @prop {Function} getTestCases
 */

/** @typedef {import('../ConversationTester').Logger} Logger */

/**
 * Returns API for conversations testing
 *
 * @param {TestSource|Object<string,TestSource>} testsSource
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
 * @param {boolean} [options.allowEmptyResponse]
 * @param {Logger} [options.log]
 *
 * @param {string[]|Function} [acl] - limit api to array of groups or use auth function
 */
function conversationTestApi (testsSource, botFactory, options, acl) {

    const test = new ConversationTester(testsSource, botFactory, {
        ...options
    });

    return {
        async conversationTest (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const { bot: validationRequestBody, step = null, lang = null } = args;

            await ctx.audit('conversationTest', args);

            return test.test(validationRequestBody, step, lang);
        }
    };
}

module.exports = conversationTestApi;
