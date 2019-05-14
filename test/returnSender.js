/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const ReturnSender = require('../src/ReturnSender');

describe('<ReturnSender>', () => {

    describe('#send() & finished()', () => {

        it('should retain catched error', async () => {
            const rs = new ReturnSender({}, 'a', {});

            rs.simulateFail = true;

            rs.send({ a: 1 });

            rs.send({ wait: 100 });

            rs.simulateFail = true;

            rs.send({ b: 1 });

            await new Promise(r => setTimeout(r, 10));

            const res = await rs.finished();

            assert.equal(res.status, 500);
        });

    });

});
