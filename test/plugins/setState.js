/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../../src/Tester');
const Router = require('../../src/Router');
const setState = require('../../plugins/ai.wingbot.setState/plugin');

describe('setState plugin', () => {

    /** @type {Tester} */
    let t;

    beforeEach(() => {
        const bot = new Router();

        bot.use((req, res) => {
            req.params = {
                attr: 'attr',
                value: 'val'
            };

            // simulate plugins modules
            Object.assign(res, {
                async run (block) {
                    if (block === 'diambiguations') {
                        res.text('Dis', []);
                    }
                    return undefined;
                }
            });
            return true;
        }, setState);

        t = new Tester(bot);

        t.allowEmptyResponse = true;
    });

    it('sets the state', async () => {
        await t.text('random');

        const { state } = t.getState();

        assert.strictEqual(state.attr, 'val');
    });

});
