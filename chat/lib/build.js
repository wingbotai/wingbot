/**
 * @author wingbot.ai
 */
'use strict';
/* eslint no-console: 0 */

const path = require('path');
const fs = require('fs');
const { renderTemplates } = require('./renderTemplates');
const fileListSync = require('./fileListSync');
const config = require('../config');

function webpackRun () {
    return Promise.resolve({
        compilation: { errors: null },
        hasErrors: () => false
    });
}

async function build (distPath, viewsPath) {
    console.log('Cleaning up scripts');

    const distFiles = fileListSync(distPath, /\.(js|js\.gz|css\.gz|css|css\.map)$/);

    for (const file of distFiles) {
        console.log(` * removing '${file}'`); // eslint-disable-line no-console
        fs.unlinkSync(path.join(distPath, file));
    }

    console.log('Building scripts');

    const webpackResult = await webpackRun();

    // @ts-ignore
    console.log('Build is done:', webpackResult.hasErrors()
        ? webpackResult.compilation.errors
        : 'without errors');

    if (webpackResult.hasErrors()) {
        throw new Error('Build failed');
    }

    await renderTemplates(config, viewsPath, distPath);
    console.log('Templates are rendered.');
}

module.exports = build;
