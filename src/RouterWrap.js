/**
 * @author David Menger
 */
'use strict';

const EventEmitter = require('events');

// @ts-ignore
class RouterWrap extends EventEmitter {

    constructor (router, items, params) {
        super();
        this.router = router;

        this.items = new Map();

        for (const [item, builtResolvers] of items.entries()) {
            this.items
                .set(item, router.createReducersArray(builtResolvers));
        }

        this.params = params;

        // @ts-ignore
        router.on('action', (...args) => this.emit('action', ...args));

        // @ts-ignore
        router.on('_action', (...args) => this.emit('_action', ...args));

        const { globalIntents = new Map(), path, globalIntentsMeta = {} } = router;

        this.globalIntents = globalIntents;
        this.path = path;
        this.globalIntentsMeta = globalIntentsMeta;
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
                if (!items.has(codeBlockName)) {
                    return true;
                }

                const { path: runPath, routePath: runRoutePath } = res;

                res.setPath(path, routePath);

                const reducers = items.get(codeBlockName);
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

module.exports = RouterWrap;
