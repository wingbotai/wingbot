/**
 * @author David Menger
 */
'use strict';

const pluginsJson = require('./plugins.json');

const plugins = new Map();

for (const plugin of pluginsJson.plugins) {
    // @ts-ignore
    const fn = module.require(`./${plugin.id}/plugin`);

    if (plugin.isFactory) {
        plugins.set(plugin.id, { pluginFactory: fn });
    } else {
        plugins.set(plugin.id, fn);
    }
}

module.exports = plugins;
