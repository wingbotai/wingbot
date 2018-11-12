/*
 * @author David Menger
 */
'use strict';

const Tester = require('../Tester');
const apiAuthorizer = require('./apiAuthorizer');


/**
 * @typedef {Object} ValidateBotAPI
 * @typedef {Function} validateBot
 */

async function validate (bot, validationRequestBody, postBackTest = 'start', textTest = 'hello') {
    try {
        bot.buildWithSnapshot(validationRequestBody.blocks, Number.MAX_SAFE_INTEGER);
    } catch (e) {
        return { error: `Bot build failed: ${e.message}`, ok: false };
    }

    const t = new Tester(bot);

    if (postBackTest) {
        try {
            await t.postBack(postBackTest);
        } catch (e) {
            return { error: `Postback failed: ${e.message}`, ok: false };
        }
    }

    if (textTest) {
        try {
            await t.postBack(textTest);
        } catch (e) {
            return { error: `Text message failed: ${e.message}`, ok: false };
        }
    }

    bot.resetRouter();
    return { ok: true };
}

/**
 * Test the bot configuration
 *
 * @param {Function} botFactory - function, which returns a bot
 * @param {string|null} [postBackTest] - postback action to test
 * @param {string|null} [textTest] - random text to test
 * @param {string[]|Function} [acl] - limit api to array of groups or use auth function
 * @returns {ValidateBotAPI}
 * @example
 * const { GraphApi, validateBotApi } = require('wingbot');
 *
 * const api = new GraphApi([
 *     validateBotApi(botFactory, 'start', 'hello')
 * ], {
 *     token: 'wingbot-token'
 * })
 */
function validateBotApi (botFactory, postBackTest, textTest, acl) {
    /** @deprecated way to validate bot */
    if (postBackTest && typeof postBackTest === 'object') {

        // @ts-ignore
        return validate(botFactory, postBackTest, textTest, acl)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(res.error);
                }
            });
    }

    return {
        async validateBot (args, ctx) {
            if (!apiAuthorizer(args, ctx, acl)) {
                return null;
            }

            const validationRequestBody = args.bot;

            const bot = botFactory();

            return validate(bot, validationRequestBody, postBackTest, textTest);
        }
    };
}

module.exports = validateBotApi;
