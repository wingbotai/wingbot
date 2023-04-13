/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert').strict;
const Tester = require('../../src/Tester');
const Router = require('../../src/Router');
const Plugins = require('../../src/Plugins');

describe('<persona>', () => {

    /** @type {Tester} */
    let t;

    it('works', async () => {
        const plugins = new Plugins();

        const bot = new Router({
            persona: {
                bar: {
                    name: 'Bar Bar'
                }
            }
        });

        bot.use(
            'try',
            plugins.getWrappedPlugin('ai.wingbot.persona', { name: 'foo' }, {}, { isLastIndex: false }),
            (req, res) => { res.text('hello'); }
        );

        bot.use(
            'bar',
            plugins.getWrappedPlugin('ai.wingbot.persona', { name: 'bar' }, {}, { isLastIndex: false }),
            (req, res) => { res.text('barbar'); }
        );

        t = new Tester(bot);

        await t.postBack('try');

        t.any()
            .contains('hello')
            .contains({
                persona: {
                    name: 'foo'
                }
            });

        await t.postBack('bar');

        t.any()
            .contains('barbar')
            .contains({
                persona: {
                    name: 'Bar Bar'
                }
            });
    });

    it('works with default person', async () => {
        const bot = new Router({
            persona: {
                _default: {
                    name: 'Default Persona'
                }
            }
        });

        bot.use(
            'try',
            (req, res) => { res.text('hello'); }
        );

        t = new Tester(bot);

        await t.postBack('try');

        t.any()
            .contains('hello')
            .contains({
                persona: {
                    name: 'Default Persona'
                }
            });
    });

});
