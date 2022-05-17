/**
 * @author David Menger
 */
'use strict';

const Plugins = require('../src/Plugins');
const { expected } = require('../src/resolvers');
const Router = require('../src/Router');
const Tester = require('../src/Tester');

describe('<plugins.tracking>', () => {

    /** @type {Tester} */
    let t;

    beforeEach(() => {

        const plugins = new Plugins();

        plugins.registerFactory('plug', () => {
            const p = new Router();

            p.use('/', (req, res) => {
                res.text('hello');
                return Router.END;
            });

            return p;
        });

        const bot = new Router();

        const nested = new Router();

        const plugin = plugins.getWrappedPlugin('plug', {}, {}, {
            isLastIndex: false
        });

        nested.use(
            'stop',
            plugin,
            expected({ path: 'something', attachedRouter: true }, { isLastIndex: true })
        );

        nested.use('something', (req, res) => {
            res.setState(req.expectedContext(false, true));
            res.text('something');
        });

        bot.use('nested', nested);

        bot.use((req, res) => {
            res.text('fallback');
        });

        t = new Tester(bot);
        t.allowEmptyResponse = true;
    });

    describe('#simulation of fallback after plugin', () => {

        it('should work', async () => {
            await t.postBack('/nested/stop');

            await t.text('foobar');

            t.any().contains('something');

            await t.text('foobar');

            t.any().contains('something');
        });

    });

});
