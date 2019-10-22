/**
 * @author David Menger
 */
'use strict';

const apiAuthorizer = require('./apiAuthorizer');
const ConversationTester = require('../ConversationTester');

/**
 * @typedef {object} TestSource
 * @prop {function} getTestCases
 */

/**
 * Returns API for conversations testing
 *
 * @param {TestSource} testsSource
 * @param {Function} botFactory
 * @param {Object} [options]
 * @param {boolean} [options.disableAssertActions]
 * @param {boolean} [options.disableAssertTexts]
 * @param {boolean} [options.disableAssertQuickReplies]
 * @param {string[]|Function} [acl] - limit api to array of groups or use auth function
 */
function conversationTestApi (testsSource, botFactory, options, acl) {

    return {
        async conversationTest (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const validationRequestBody = args.bot;

            const test = new ConversationTester(testsSource, botFactory, options);

            return test.test(validationRequestBody);
        }
    };
}

module.exports = conversationTestApi;
