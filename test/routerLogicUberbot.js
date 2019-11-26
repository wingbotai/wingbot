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
const Ai = require('../src/Ai');

describe('<Router> features for Uberbot', () => {

    describe('exporting AI actions', () => {

        it('should return matched action', async () => {
            const bot = new Router();

            const nested = new Router();

            nested.use(Ai.ai.global('path', 'fooIntent'), passThreadToBotFactory({ targetAppId: '1' }));

            bot.use('nested', nested);

            const t = new Tester(bot);

            const actions = await t.processor.aiActionsForText(Request.intent(t.senderId, 'any', 'fooIntent'));

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

    });

});
