/**
 * @author David Menger
 */
'use strict';

const Ai = require('../src/Ai');
const Router = require('../src/Router');
const Tester = require('../src/Tester');

describe('<emptyMessage>', () => {

    it('should work with AI', async () => {
        const b = new Router();

        b.use(Ai.ai.match(['#']), (req, res) => { res.text('recognized'); });

        b.use(Ai.ai.match(['#:']), (req, res) => { res.text('character'); });

        b.use(Ai.ai.match(['#.|+']), (req, res) => { res.text('punk'); });

        b.use((req, res) => { res.text('fallback'); });

        const t = new Tester(b);

        await t.text('');

        t.any().contains('recognized');

        await t.text(' ');

        t.any().contains('recognized');

        await t.text('-');

        t.any().contains('fallback');

        await t.text(':');

        t.any().contains('character');

        await t.text('+');

        t.any().contains('punk');
    });

    it('should work with regexps', async () => {
        const b = new Router();

        b.use(/^$/, (req, res) => { res.text('recognized'); });

        b.use((req, res) => { res.text('fallback'); });

        const t = new Tester(b);

        await t.text('');

        t.any().contains('recognized');

        await t.text(' ');

        t.any().contains('recognized');

        await t.text('.');

        t.any().contains('fallback');
    });

});
