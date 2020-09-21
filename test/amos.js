/*
 * @author David Menger
 */
'use strict';

// const { strict: assert } = require('assert');
const { Tester, ai, Router } = require('../index');
const BuildRouter = require('../src/BuildRouter');
const Plugins = require('../src/Plugins');

describe.skip('<BuildRouter>', async () => {

    it('should behave as router', async () => {
        const plugins = new Plugins();

        plugins.registerFactory('numberFinder', () => () => false);
        plugins.registerFactory('createTicket', () => () => false);
        plugins.registerFactory('getOrdersInButtons', () => () => false);
        plugins.registerFactory('orderFinder', () => () => false);
        plugins.registerFactory('getRmasInButtons', () => () => false);
        plugins.registerFactory('isUserLogged', () => () => false);
        plugins.registerFactory('getRmaState', () => () => false);
        plugins.registerFactory('sendCancelOrderVerification', () => () => false);
        plugins.registerFactory('cancelOrder', () => () => false);
        plugins.registerFactory('sendCancelOrderVerification', () => () => false);

        plugins.register('routerBlock', new Router());

        ai.register('czc-bot-mockup-staging');

        const bot = new BuildRouter({
            botId: 'af422fa5-010f-41a1-b0ad-6e58d1a20725',
            snapshot: 'staging',
            token: '2spB4sK6RvX948Xn4aiYV2O6fr5dwonHO8aU48XzMJ9GHCcjMMhEbJQ3tNC6UCdKUQHkBboSRAXd5O3AvQkqELxepvXAQfa4fN8nQbkYyOW7xQf4aTVBeanQB7cYRS2E'
        }, plugins);

        await bot.preload();

        const t = new Tester(bot);

        await t.text('potřebuju poradit s výběrem mobilu');

    });

    it('should behave as router', async () => {
        const plugins = new Plugins();

        plugins.registerFactory('fallbackPlugin', () => async (req, res) => {
            await res.run('responseBlockName');
        });

        plugins.register('routerBlock', new Router());

        ai.register('csasist-int-amos-tahak-git');

        const bot = new BuildRouter({
            botId: 'ec4e2552-8605-497b-b3be-23e02f17eb80',
            snapshot: 'git',
            token: 'jNXRgHImRcvC3QqRJ4lAWR9vjtbvpvtbW0OEG07rABN2tbCKIRqvWfGaigTR9Y18gxULQpTwRMXOP62dgibEdDPoT5RemQsjuzoKolV9KzYdUZn6we8UdEFev6b5UtpH'
        }, plugins);

        await bot.preload();

        const t = new Tester(bot);

        // await t.intentWithEntity('zajem', 'pojmy', 'agile', 'agile');
        await t.text('jak na digi');

        t.any().contains('Valí se na tebe úkoly');

    });

    it('should behave as router', async () => {
        const plugins = new Plugins();

        plugins.registerFactory('fallbackPlugin', () => async (req, res) => {
            await res.run('responseBlockName');
        });

        plugins.register('routerBlock', new Router());

        ai.register('csasist-int-amos-tahak-git');

        const bot = new BuildRouter({
            botId: 'ec4e2552-8605-497b-b3be-23e02f17eb80',
            snapshot: 'git',
            token: 'jNXRgHImRcvC3QqRJ4lAWR9vjtbvpvtbW0OEG07rABN2tbCKIRqvWfGaigTR9Y18gxULQpTwRMXOP62dgibEdDPoT5RemQsjuzoKolV9KzYdUZn6we8UdEFev6b5UtpH'
        }, plugins);

        const t = new Tester(bot);

        await t.postBack('karierni-zmena/karierni-zmena');

        // await t.intentWithEntity('zajem', 'pojmy', 'agile', 'agile');
        await t.text('práce je stres');

        t.any().contains('Valí se na tebe úkoly');
    });

    // mám v práci stres

    it('mám v práci stres', async () => {
        const plugins = new Plugins();

        plugins.registerFactory('fallbackPlugin', () => async (req, res) => {
            await res.run('responseBlockName');
        });

        plugins.register('routerBlock', new Router());

        ai.register('csasist-int-amos-tahak-git');

        const bot = new BuildRouter({
            botId: 'ec4e2552-8605-497b-b3be-23e02f17eb80',
            snapshot: 'git',
            token: 'jNXRgHImRcvC3QqRJ4lAWR9vjtbvpvtbW0OEG07rABN2tbCKIRqvWfGaigTR9Y18gxULQpTwRMXOP62dgibEdDPoT5RemQsjuzoKolV9KzYdUZn6we8UdEFev6b5UtpH'
        }, plugins);

        await bot.preload();

        const t = new Tester(bot);

        // await t.intentWithEntity('zajem', 'pojmy', 'agile', 'agile');
        await t.text('mám v práci stres');

        t.any().contains('Valí se na tebe úkoly');

    });

});
