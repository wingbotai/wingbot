/**
 * @author David Menger
 */
'use strict';

const Router = require('../src/Router');
const Tester = require('../src/Tester');

// const assert = require('assert');

describe('error handling', () => {

    it.skip('should log the error', async () => {
        const bot = new Router();

        bot.use('try', () => {
            throw new Error('sasalele');
        });

        const t = new Tester(bot);

        await t.postBack('try');

    });

});
