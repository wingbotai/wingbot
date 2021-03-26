/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<ai.wingbot.trackingEvent>', () => {

    /**
     * @type {Tester}
     */
    let t;

    beforeEach(() => {
        const bot = new Router();
        const plugins = new Plugins();

        bot.use('plugin', plugins.getWrappedPlugin('ai.wingbot.trackingEvent', {
            category: '{{someState}}',
            action: 'sasalele',
            value: 123
        }));

        t = new Tester(bot);
    });

    it('should stop responding', async () => {
        t.allowEmptyResponse = true;
        t.setState({ someState: 'foobar' });
        const events = [];
        t.processor.on('interaction', ({ tracking }) => {
            events.push(...tracking.events);
        });

        await t.postBack('plugin');

        // @ts-ignore
        assert.strictEqual(t.responses.length, 0);
        assert.deepStrictEqual(events, [
            {
                type: 'report',
                category: 'foobar',
                action: 'sasalele',
                label: '',
                value: 123
            }
        ]);
    });

});
