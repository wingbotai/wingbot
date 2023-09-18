/**
 * @author David Menger
 */
'use strict';

const pluginsJson = require('./plugins.json');

const plugins = new Map();

for (const plugin of pluginsJson.plugins) {
    plugins.set(plugin.id, {
        pluginFactory: (...args) => {
            // @ts-ignore
            const fn = module.require(`./${plugin.id}/plugin`);

            return plugin.isFactory ? fn(...args) : fn;
        }
    });
}

module.exports = plugins;
