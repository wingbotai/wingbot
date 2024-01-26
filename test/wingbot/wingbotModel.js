/**
 * @author David Menger
 */
'use strict';

const sinon = require('sinon');
const assert = require('assert');
const WingbotModel = require('../../src/wingbot/WingbotModel');
const systemEntities = require('../../src/systemEntities');

describe('<WingbotModel>', () => {

    describe('#resolve()', () => {

        it('should log errors nicely', async () => {
            const log = {
                log: sinon.spy(),
                warn: sinon.spy()
            };

            const m = new WingbotModel({
                model: 'this-model-surely-does-not-exists-because-its-name-is-too-long'
            }, log);

            await m.resolve('foo');

            // @ts-ignore
            assert.strictEqual(log.log.firstCall.args[0], 'NLP model \'this-model-surely-does-not-exists-because-its-name-is-too-long\' does not exist or is not deployed yet.');
        });

        it('should not duplicate entities', async () => {
            const log = {
                log: sinon.spy(),
                warn: sinon.spy()
            };

            const m = new WingbotModel({
                fetch: () => ({
                    async json () {
                        return {
                            intents: [],
                            entities: [
                                {
                                    entity: 'email', value: 'foo@bar.cz', start: 0, end: 10
                                }
                            ]
                        };
                    }
                }),
                model: 'this-model-surely-does-not-exists-because-its-name-is-too-long'
            }, log);

            for (const entityArgs of systemEntities) {
                m.setEntityDetector(...entityArgs);
            }

            const res = await m.resolve('foo@bar.cz');

            assert.strictEqual(res.entities.length, 1);
        });

    });

});
