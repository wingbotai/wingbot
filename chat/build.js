#!/usr/bin/env node
'use strict';
/* eslint no-console: 0 */
/* eslint import/no-extraneous-dependencies: 0 */

process.env.NODE_ENV = process.argv.includes('-s')
    ? process.argv[process.argv.indexOf('-s') + 1]
    : 'production';

const path = require('path');
const build = require('./lib/build');

// setup templating
const distPath = path.join(__dirname, '.', 'dist');
const viewsPath = path.join(__dirname, '.', 'views');

build(distPath, viewsPath)
    .catch((e) => {
        console.error('Build failed', e);
        process.exit(1);
    });
