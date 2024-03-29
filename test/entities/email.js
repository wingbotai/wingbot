/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const CustomEntityDetectionModel = require('../../src/wingbot/CustomEntityDetectionModel');
const email = require('../../src/systemEntities/email');

describe('@email ENTITY', () => {

    it('should detect email', async () => {
        const m = new CustomEntityDetectionModel({});

        const [name, detector, options] = email;
        // @ts-ignore
        m.setEntityDetector(name, detector, options);

        const ask = async (input, out) => {
            const r = await m.resolve(input);

            if (!out) {
                // @ts-ignore
                assert.strictEqual(r.entities[0]
                    ? r.entities[0].value
                    : undefined, undefined);
            } else if (typeof out === 'number') {
                assert.strictEqual(r.entities.length, out);
            } else if (Array.isArray(out)) {
                out.forEach((o, i) => {
                    // @ts-ignore
                    assert.strictEqual(r.entities[i].value, o);
                });
            } else {
                // @ts-ignore
                assert.strictEqual(r.entities[0].value, out);
            }
        };

        await ask('john.doe@gmail.com,sasa@lele.cz,mail@domain.com', 3);

        await ask('john.doe@gmail.com', 'john.doe@gmail.com');
        await ask('just -bizare.email~forspam@within.domain.com', '-bizare.email~forspam@within.domain.com');
        await ask('this is my email:john.doe@gmail.com, please write me', 'john.doe@gmail.com');
        await ask('this is @username', null);
        await ask('this is email@withoutdomain', null);
        await ask('this is email@with@two.at', null);
        await ask('email@two.at; email@on-e.at', ['email@two.at', 'email@on-e.at']);
        await ask('this is @username.with.dots', null);
        await ask('this a http password http://user@domain.com', null);
    });

});
