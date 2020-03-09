/*
 * @author David Menger
 */
'use strict';

const EventEmitter = require('events');

class RouterWrap extends EventEmitter {

    constructor (router, items, params) {
        super();
        this.router = router;
        this.items = items;
        this.params = params;

        router.on('action', (...args) => this.emit('action', ...args));
        router.on('_action', (...args) => this.emit('_action', ...args));
    }

    async reduce (req, res, postBack, callPath, action) {
        // attach the run function

        let useAction = action;
        let resoreNullAction = false;

        if (!action) {
            useAction = res.toAbsoluteAction('/');
            req.setAction(useAction);
            resoreNullAction = true;
        }

        const { items, router, params } = this;

        const { path, routePath } = res;

        // attach params
        req.params = params;

        // attach block runner
        Object.assign(res, {
            // @deprecated
            params,
            async run (codeBlockName) {
                if (typeof items[codeBlockName] === 'undefined') {
                    return true;
                }

                const { path: runPath, routePath: runRoutePath } = res;

                res.setPath(path, routePath);

                const reducers = items[codeBlockName];
                const result = await router
                    .processReducers(reducers, req, res, postBack, path, useAction, true);

                res.setPath(runPath, runRoutePath);

                return result;
            }
        });

        const result = await this.router.reduce(req, res, postBack, callPath, useAction);

        if (resoreNullAction) {
            req.setAction(null);
        }

        return result;
    }

}

function customCode (params, context, blocks) {
    const paramsData = typeof params.params === 'object' ? params.params : {};
    const customFn = blocks.getPluginFactory(params.codeBlockId, paramsData);

    const { router, isLastIndex } = context;

    const items = Object.keys(params.items)
        .reduce((obj, itemName) => {
            const item = params.items[itemName];
            const builtResolvers = router.buildResolvers(item.resolvers);
            const reducers = router.createReducersArray(builtResolvers);

            return Object.assign(obj, { [itemName]: reducers });
        }, {});

    if (typeof customFn === 'object') {
        // this is an attached router

        return new RouterWrap(customFn, items, paramsData);
    }

    const fn = async function (req, res, postBack, path, action) {
        req.params = paramsData;

        // attach block runner
        Object.assign(res, {
            run (codeBlockName) {
                if (typeof items[codeBlockName] === 'undefined') {
                    return Promise.resolve();
                }

                const reducers = items[codeBlockName];
                return router.processReducers(reducers, req, res, postBack, path, action, true);
            }
        });

        // assign to res
        let ret = customFn(req, res, postBack, context, paramsData);

        if (typeof ret === 'object' && ret !== null) {
            ret = await ret;
        }

        if (typeof ret !== 'undefined') {
            return ret;
        }
        return isLastIndex ? null : true;
    };

    if (typeof customFn.globalIntentsMeta === 'object') {
        fn.globalIntentsMeta = customFn.globalIntentsMeta;
    }

    return fn;
}

module.exports = customCode;
