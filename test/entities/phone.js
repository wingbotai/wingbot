/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const CustomEntityDetectionModel = require('../../src/wingbot/CustomEntityDetectionModel');
const phone = require('../../src/systemEntities/phone');

describe('@phone ENTITY', () => {

    it('should detect phone', async () => {
        const m = new CustomEntityDetectionModel({});

        const [name, detector, options] = phone;
        // @ts-ignore
        m.setEntityDetector(name, detector, options);

        const ask = async (input, out) => {
            const r = await m.resolve(input);

            if (!out) {
                // @ts-ignore
                assert.strictEqual(r.entities[0]
                    ? r.entities[0].value
                    : undefined, undefined);
            } else {
                // @ts-ignore
                assert.strictEqual(r.entities[0].value, out);
            }
        };

        await ask('+420 721 481 142', '+420721481142');
        await ask('thats the number 00 420 721 481142', '+420721481142');
        await ask('this is my phone721481142', '721481142');
        await ask('this is my phone721481142', '721481142');
        await ask('this is my phone721-481-142', '721481142');
        await ask('this is my phone721-481-14', null);
        await ask('+4 721481142', '+4721481142');
        await ask('+42341 721481142', '721481142');
        await ask('call me maybe:721 48 11 42?', '721481142');
    });

});
