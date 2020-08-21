/*
 * @author David Menger
 */
'use strict';

const resolvers = require('./resolvers');

const PREFIX = 'botbuild';

function factoryResourceMap () {
    const map = new Map();

    Object.keys(resolvers)
        .forEach((name) => {
            map.set(`${PREFIX}.${name}`, resolvers[name]);
        });

    // backwards compatibility
    map.set(`${PREFIX}.customCode`, resolvers.plugin);
    map.set(`${PREFIX}.inlineCode`, resolvers.plugin);

    return map;
}

module.exports = factoryResourceMap;
