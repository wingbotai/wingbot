/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<ai.wingbot.ifImageDetected>', () => {

    /**
     * @type {Tester}
     */
    let t;

    beforeEach(() => {
        const bot = new Router();
        const plugins = new Plugins();

        bot.use(plugins.getWrappedPlugin('ai.wingbot.ifImageDetected'), (req, res) => {
            res.text('yes');
        });

        bot.use((req, res) => {
            res.text('no');
        });

        t = new Tester(bot);
    });

    it('should detect image', async () => {
        await t.postBack('next');

        t.any().contains('no');

        await t.processMessage({
            sender: {
                id: t.senderId
            },
            message: {
                attachment: {
                    type: 'image',
                    payload: {
                        url: 'https://iom.io/img.png'
                    }
                }
            }
        });

        t.any().contains('yes');
    });

});
