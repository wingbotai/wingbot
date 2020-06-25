/*
 * @author David Menger
 */
'use strict';

function include (params, context, plugins) {
    const includedRouter = context.blocks
        .find((block) => block.staticBlockId === params.staticBlockId);

    if (!includedRouter) {
        throw new Error(`Block ${params.staticBlockId} not found!`);
    }

    return new context.BuildRouter(includedRouter, plugins, context);
}

module.exports = include;
