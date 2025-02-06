/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const Tester = require('../../src/Tester');
const Plugins = require('../../src/Plugins');
const Router = require('../../src/Router');

describe('Plugins<regexp>', () => {

    /**
     * @type {Tester}
     */
    let t;

    /**
     * @type {Router}
     */
    let bot;

    /**
     * @type {Plugins}
     */
    let plugins;

    beforeEach(() => {
        bot = new Router();
        plugins = new Plugins();

        bot.use('start', (req, res) => {
            res.text('started')
                .expected('test');
        });

        t = new Tester(bot);
    });

    it('should match insensitive', async () => {
        bot.use(
            'test',
            plugins.getWrappedPlugin('ai.wingbot.regexp', {
                expression: '/^sasa lele$/i',
                input: ''
            }, {
                matches: 'matches',
                not: (req, res) => { res.text('not'); }
            }, {
                isLastIndex: true
            })
        );

        await t.postBack('start');

        await t.text('SaSa LELe');
        t.any().contains('matches');
    });

    it('should match sensitive', async () => {
        bot.use(
            'test',
            plugins.getWrappedPlugin('ai.wingbot.regexp', {
                expression: 'SaSa LELe'
            }, {
                matches: (req, res) => { res.text('matches'); },
                not: (req, res) => { res.text('not'); }
            }, {
                isLastIndex: true
            })
        );

        await t.postBack('start');

        await t.text('SaSa LELe');
        t.any().contains('matches');
    });

    it('should not match sensitive', async () => {
        bot.use(
            'test',
            plugins.getWrappedPlugin('ai.wingbot.regexp', {
                expression: 'SaSa LELe'
            }, {
                matches: (req, res) => { res.text('matches'); },
                not: (req, res) => { res.text('not'); }
            }, {
                isLastIndex: true
            })
        );

        await t.postBack('start');

        await t.text('sasa LELe');
        t.any().contains('not');
    });

    it('should  match from state', async () => {
        bot.use(
            'test',
            plugins.getWrappedPlugin('ai.wingbot.regexp', {
                expression: 'SaSa LELe',
                input: '{{fromState}}'
            }, {
                matches: (req, res) => { res.text('matches'); },
                not: (req, res) => { res.text('not'); }
            }, {
                isLastIndex: true
            })
        );
        t.setState({ fromState: 'SaSa LELe' });
        await t.postBack('test');
        t.any().contains('matches');
    });

    it('should match with empty regex', async () => {
        bot.use(
            'test',
            plugins.getWrappedPlugin('ai.wingbot.regexp', {
                expression: null
            }, {
                matches: (req, res) => { res.text('matches'); },
                not: (req, res) => { res.text('not'); }
            }, {
                isLastIndex: true
            })
        );

        await t.postBack('start');

        await t.text('SaSa LELe');
        t.any().contains('matches');
    });

    it('should throw exception', async () => {
        assert.throws(() => {
            plugins.getWrappedPlugin('ai.wingbot.regexp', {
                expression: '(abc'
            }, {
                matches: (req, res) => { res.text('matches'); },
                not: (req, res) => { res.text('not'); }
            }, {
                isLastIndex: true
            });
        });
    });

});
