/*
 * @author wingbot.ai
 */
'use strict';

const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');

const dbName = 'wingbotLib';

const mongod = new MongoMemoryServer({
    instance: {
        dbName
    }
});

const startAndGetUrl = async () => {
    await mongod.start();
    return mongod.getUri();
};

let connection;

/** @typedef {import('mongodb').Db} Db */

/**
 *
 * @param {boolean} [disconnect]
 * @returns {Promise<Db>}
 */
async function mongodb (disconnect = false) {
    if (disconnect && !connection) {
        return null;
    }

    if (disconnect) {
        await (await connection).close();
        connection = null;
        return null;
    }

    if (!connection) {
        connection = startAndGetUrl()
            .then((url) => new MongoClient(url).connect());
    }

    const c = await connection;
    return c.db(dbName);
}

module.exports = mongodb;
