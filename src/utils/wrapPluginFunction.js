/**
 * @author David Menger
 */
'use strict';

function wrapPluginFunction (
    customFn,
    paramsData,
    items,
    context,
    // eslint-disable-next-line no-unused-vars
    Router = class X { processReducers (a, b, c, d, e, f, g) { return null; }}
) {
    const fn = async function (req, res, postBack, path, action, router = new Router()) {
        req.params = paramsData;

        // attach block runner
        Object.assign(res, {
            run (codeBlockName) {
                if (!items.has(codeBlockName)) {
                    return true;
                }

                const reducers = items.get(codeBlockName);
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
        let ret = customFn(req, res, postBack, useContext, paramsData);

        if (typeof ret === 'object' && ret !== null) {
            ret = await ret;
        }

        if (typeof ret !== 'undefined') {
            return ret;
        }
        return useContext.isLastIndex ? null : true;
    };

    if (typeof customFn.globalIntentsMeta === 'object') {
        fn.globalIntentsMeta = customFn.globalIntentsMeta;
    }

    return fn;
}

module.exports = wrapPluginFunction;
