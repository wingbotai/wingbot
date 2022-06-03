/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const Ai = require('../src/Ai');
const { FEATURE_TEXT, FEATURE_TRACKING } = require('../src/Request');
const Router = require('../src/Router');
const Tester = require('../src/Tester');

describe('<trackingProtocol>', () => {

    /** @type {Tester} */
    let t;

    beforeEach(() => {
        const bot = new Router();

        bot.use('hello', (req, res, postBack) => {
            res.trackEvent('type', 'cat');
            res.text('hello');
            postBack('world');
        });

        bot.use('world', (req, res) => {
            res.text('world');
        });

        t = new Tester(bot);

        t.setFeatures([FEATURE_TEXT, FEATURE_TRACKING]);
    });

    describe('#', () => {

        it('should work', async () => {
            await t.postBack('hello');

            assert.equal(t.responses.length, 2);
            assert.deepEqual(t.responses[1].tracking, {
                events: [{
                    type: 'type', category: 'cat', action: '', label: '', value: 0
                }],
                payload: {},
                meta: {
                    actions: ['/hello', '/world'],
                    confidence: Ai.ai.confidence,
                    entities: [],
                    intent: null,
                    intents: []
                }
            });
        });

    });

});
