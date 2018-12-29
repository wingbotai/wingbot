/*
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const Tester = require('../src/Tester');
const Router = require('../src/Router');
const Ai = require('../src/Ai');

const { ai } = Ai;

describe('<Router> login', () => {

    describe('GLOBAL INTENTS', () => {

        it('should pass global intent deeply', async () => {
            const nested = new Router();

            // @ts-ignore
            nested.use(['has-path', ai.globalMatch('foo')], (req, res) => {
                res.text('foo text');
            });

            const bot = new Router();

            bot.use('include', nested);

            const t = new Tester(bot);

            await t.intent('foo');

            t.any()
                .contains('foo text');
        });

        it('globalizes intent behind the asterisk router', async () => {
            const subNested = new Router();

            // @ts-ignore
            subNested.use(['has-path', ai.globalMatch('foo')], (req, res) => {
                res.text('foo text');
            });

            // @ts-ignore will be ignored
            subNested.use(['has-another-path', ai.globalMatch('foo')], (req, res) => {
                res.text('foo text');
            });

            const nested = new Router();

            nested.use('include', subNested);

            const bot = new Router();

            bot.use(nested);

            const t = new Tester(bot);

            await t.intent('foo');

            t.any()
                .contains('foo text');
        });

        it('makes right bookmark, when there\'s expected action', async () => {
            const nested = new Router();

            // @ts-ignore
            nested.use(['has-path', ai.globalMatch('foo')], (req, res) => {
                res.text('foo text');
            });

            const bot = new Router();

            bot.use('start', (req, res) => {
                res.text('prompt')
                    .expected('prompt');
            });

            bot.use('prompt', async (req, res, postBack) => {
                res.text(`BM ${res.bookmark()}`);
                await res.runBookmark(postBack);
            });

            bot.use('include', nested);

            const t = new Tester(bot);

            await t.postBack('start');

            await t.intent('foo');

            t.any()
                .contains('BM /include/has-path')
                .contains('foo text');
        });

    });

});
