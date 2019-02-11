/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const MemoryBotConfigStorage = require('../../src/tools/MemoryBotConfigStorage');

describe('<MemoryBotConfigStorage>', () => {

    /** @type {MemoryBotConfigStorage} */
    let botConfigStorage;

    before(async () => {
        botConfigStorage = new MemoryBotConfigStorage();
    });

    it('has api', async () => {
        const api = botConfigStorage.api();

        assert.equal(typeof api.updateBot, 'function');

        const res = await api.updateBot({}, { groups: ['a'], token: { groups: [{ group: 'a' }] } });

        assert.strictEqual(res, true);

        const res2 = await api.updateBot({}, { groups: ['b'], token: { groups: [{ group: 'a' }] } });

        assert.strictEqual(res2, null);
    });

    it('should be able to store and fetch, invalidate and update config under same timestamp', async () => {
        const cfgObj = { blocks: 123 };

        // save config
        const savedConfig = await botConfigStorage.updateConfig(cfgObj);

        assert.strictEqual(savedConfig.blocks, cfgObj.blocks);

        // check for config timestamp
        const ts = await botConfigStorage.getConfigTimestamp();

        assert.strictEqual(ts, savedConfig.timestamp);

        // try another - but this is not a database
        // botConfigStorage = new MemoryBotConfigStorage();

        // load config
        const loadedConfig = await botConfigStorage.getConfig();

        assert.deepStrictEqual(loadedConfig, savedConfig);

        // invalidate config
        await botConfigStorage.invalidateConfig();

        const emptyTs = await botConfigStorage.getConfigTimestamp();
        const emptyConfig = await botConfigStorage.getConfig();

        assert.strictEqual(emptyTs, 0);
        assert.strictEqual(emptyConfig, null);
    });

});
