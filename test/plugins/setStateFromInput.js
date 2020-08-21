/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../../src/Tester');
const Router = require('../../src/Router');
const setStateFromInput = require('../../plugins/ai.wingbot.setStateFromInput/plugin');

describe('setStateFromInput plugin', () => {

    /** @type {Tester} */
    let t;

    beforeEach(() => {
        const bot = new Router();

        bot.use((req, res) => {
            req.params = {
                attr: 'attr'
            };

            res.text('res', {
                qr: 'QR text'
            });

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
        }, setStateFromInput);

        t = new Tester(bot);

        t.allowEmptyResponse = true;
    });

    it('sets the state', async () => {
        await t.text('random');

        let { state } = t.getState();

        assert.strictEqual(state.attr, 'random');

        await t.quickReply('qr');

        ({ state } = t.getState());

        assert.strictEqual(state.attr, 'QR text');
    });

});
