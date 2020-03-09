/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert');

const assert = require('assert');
const Tester = require('../src/Tester');
const Request = require('../src/Request');
const Router = require('../src/Router');
const passThreadToBotFactory = require('../src/pluginsLib/passThreadToBot');
const BuildRouter = require('../src/BuildRouter');
const Plugins = require('../src/Plugins');
const Ai = require('../src/Ai');
// @ts-ignore
const testbot = require('./replies-bot.json');

describe('<Router> features for Uberbot', () => {

    describe('exporting AI actions', () => {

        it('should return matched action', async () => {
            const bot = new Router();

            const nested = new Router();

            nested.use(Ai.ai.global('path', 'fooIntent'), passThreadToBotFactory({ targetAppId: '1' }));

            bot.use('nested', nested);

            const t = new Tester(bot);

            const actions = await t.processor.aiActionsForText(Request.intentWithText(t.senderId, 'any', 'fooIntent'));

            assert.deepEqual(actions, [
                {
                    ...(actions[0] || {}), // expand for additional values

                    action: '/nested/path',
                    local: false,
                    title: null,
                    meta: {
                        targetAppId: '1',
                        targetAction: null
                    },
                    intent: {
                        intent: 'fooIntent',
                        score: 1,
                        entities: [],
                        aboveConfidence: true
                    },
                    aboveConfidence: true,
                    winner: true
                }
            ]);

        });

        it('parses the replies', async () => {
            const plugins = new Plugins();

            const bot = BuildRouter.fromData(testbot.blocks, plugins);

            const t = new Tester(bot);

            await t.postBack('start');

            t.passedAction('start');
            t.any()
                .quickReplyTextContains('bez podminky');

            await t.quickReplyText('bez podminky');

            t.passedAction('deep');
            t.any()
                .quickReplyTextContains('back');

            await t.quickReplyText('back');

            t.passedAction('dalsi');

            await t.postBack('start');

            await t.intent('lla');

            t.passedAction('dalsi');
        });

    });

});
