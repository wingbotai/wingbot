/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<ai.wingbot.oneTimeNotificationRequest>', () => {

    /**
     * @type {Tester}
     */
    let t;

    /**
     * @type {Router}
     */
    let bot;

    beforeEach(() => {
        bot = new Router();

        t = new Tester(bot);
    });

    it('should pass the text', async () => {
        const plugins = new Plugins();

        bot.use(plugins.getWrappedPlugin('ai.wingbot.oneTimeNotificationRequest', {
            title: 'hello',
            action: 'action',
            tag: 'tg'
        }));

        await t.text('foo');

        t.any().templateType('one_time_notif_req');

        // @ts-ignore
        const { payload } = t.responses[0].message.attachment;

        assert.deepEqual(payload, {
            ...payload,
            title: 'hello',
            payload: '{"action":"/action","data":{"_ntfTag":"tg"}}'
        });
    });

});
