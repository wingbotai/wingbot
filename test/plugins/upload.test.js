/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert').strict;
const Tester = require('../../src/Tester');
const Router = require('../../src/Router');
const Plugins = require('../../src/Plugins');

describe('<upload>', () => {

    /** @type {Tester} */
    let t;

    beforeEach(() => {
        const plugins = new Plugins();

        const bot = new Router();

        bot.use('free', (req, res) => {
            res.text('upload it');
            res.expected('freeExpected');
        });

        bot.use(
            'freeExpected',
            plugins.getWrappedPlugin('ai.wingbot.upload', {
                type: 'any',
                variable: 'url',
                datatype: 'string',
                allowSuffixes: 'txt'
            }, {
                badType: (req, res) => { res.text('badType'); },
                noAttachment: (req, res) => { res.text('noAttachment'); },
                success: (req, res) => { res.text('success'); }
            }),
            (req, res) => { res.text('hello'); }
        );

        bot.use('freeArray', (req, res) => {
            res.text('upload it');
            res.expected('freeArrayExpected');
        });

        bot.use(
            'freeArrayExpected',
            plugins.getWrappedPlugin('ai.wingbot.upload', {
                type: 'image',
                variable: 'url',
                datatype: 'array'
            }, {
                badType: (req, res) => { res.text('badType'); },
                noAttachment: (req, res) => { res.text('noAttachment'); },
                success: (req, res) => { res.text('success'); }
            }),
            (req, res) => { res.text('hello'); }
        );

        t = new Tester(bot);
    });

    it('works with attachment', async () => {
        await t.postBack('free');

        await t.attachment();

        t.any()
            .contains('success');

        t.stateContains({ url: t.ATTACHMENT_MOCK_URL });
    });

    it('works with text', async () => {
        await t.postBack('free');

        await t.text('foo');

        t.any()
            .contains('noAttachment');
    });

    it('works with array', async () => {
        await t.postBack('freeArray');

        await t.attachment('image');

        t.any()
            .contains('success');

        t.stateContains({ url: [t.ATTACHMENT_MOCK_URL] });

        await t.postBack('freeArray');

        await t.attachment('image');

        t.any()
            .contains('success');

        t.stateContains({ url: [t.ATTACHMENT_MOCK_URL, t.ATTACHMENT_MOCK_URL] });
    });

    it('works with validation', async () => {
        await t.postBack('freeArray');

        await t.attachment('file');

        t.any()
            .contains('badType');
    });

});
