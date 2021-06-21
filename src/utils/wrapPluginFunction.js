/**
 * @author David Menger
 */
'use strict';

function wrapPluginFunction (
    customFn,
    paramsData,
    items,
    context,
    defaultRouter
) {

    let preprocessedItems = null;
    const returnFn = context.isLastIndex
        ? (ret) => (typeof ret === 'undefined' ? null : ret)
        : (ret) => (typeof ret === 'undefined' ? true : ret);

    const fn = function (req, res, postBack, path, action, router = defaultRouter) {
        req.params = paramsData;

        if (preprocessedItems === null) {
            preprocessedItems = new Map();

            for (const [item, builtResolvers] of items.entries()) {
                preprocessedItems
                    .set(item, router.createReducersArray(builtResolvers));
            }
        }

        const previousRun = res.run;

        // attach block runner
        Object.assign(res, {
            run (codeBlockName) {
                // injected by test
                if (Array.isArray(res._pluginBlocksCollector)) {
                    res._pluginBlocksCollector.push(codeBlockName);
                }
                if (!preprocessedItems.has(codeBlockName)) {
                    return true;
                }
                const reducers = preprocessedItems.get(codeBlockName);
                return router.processReducers(reducers, req, res, postBack, path, action, true);
            }
        });

        // assign to res
        let useContext = context;
        if (!useContext.router) {
            useContext = {
                ...useContext,
                router
            };
        }
        const ret = customFn(req, res, postBack, useContext, paramsData);

        if (ret instanceof Promise) {
            return ret.then((resolvedRet) => {
                Object.assign(res, { run: previousRun });
                return returnFn(resolvedRet);
            });
        }
        Object.assign(res, { run: previousRun });
        return returnFn(ret);
    };

    if (typeof customFn.globalIntentsMeta === 'object') {
        fn.globalIntentsMeta = customFn.globalIntentsMeta;
    }

    return fn;
}

module.exports = wrapPluginFunction;
