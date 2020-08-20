/**
 * @author David Menger
 */
'use strict';

const customFn = require('../utils/customFn');
const wrapPluginFunction = require('../utils/wrapPluginFunction');

/**
 *
 * @param {object} params
 * @param {string} [params.code]
 * @param {string} [params.description]
 * @param {object} [params.items]
 * @param {object} [params.params]
 * @param {string} [params.codeBlockId]
 * @param {object} context
 * @param {boolean} [context.allowForbiddenSnippetWords]
 * @param {import('../BuildRouter')} context.router
 * @param {import('../Plugins')} plugins
 */
function plugin (params, context, plugins) {
    const {
        code = null,
        description = '',
        items = {},
        params: paramsData = {},
        codeBlockId = null
    } = params;
    const { router, allowForbiddenSnippetWords } = context;

    const itemsMap = Object.keys(items)
        .reduce((map, itemName) => {
            const item = items[itemName];
            const builtResolvers = router.buildResolvers(item.resolvers);
            const reducers = router.createReducersArray(builtResolvers);

            map.set(itemName, reducers);

            return map;
        }, new Map());

    if (codeBlockId) {
        return plugins.getWrappedPlugin(codeBlockId, paramsData, itemsMap, context);
    }

    const fn = customFn(code, description, allowForbiddenSnippetWords);

    return wrapPluginFunction(fn, paramsData, items, context);
}

module.exports = plugin;
