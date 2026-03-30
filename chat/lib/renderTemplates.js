/*
 * @author wingbot.ai
 */
'use strict';

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const helpers = require('./helpers');
const fileListSync = require('./fileListSync');

let loadedPartials = null;

function readFile (fileName) {
    return new Promise((res, rej) => {
        fs.readFile(fileName, 'utf8', (err, data) => (err ? rej(err) : res(data)));
    });
}

function writeFile (fileName, data) {
    return new Promise((res, rej) => {
        fs.writeFile(fileName, data, (err) => (err ? rej(err) : res()));
    });
}

function listDirectory (directory) {
    return new Promise((res, rej) => {
        fs.readdir(directory, (err, files) => (err ? rej(err) : res(files)));
    });
}

function loadPartials (directory) {
    return listDirectory(directory)
        .then((files) => Promise.all(
            files
                .map((file) => readFile(path.join(directory, file))
                    .then((partial) => ({ partial, file: file.replace(/\.hbs$/, '') })))
        ));
}

function ensureDirectories (basePath, fileName) {
    if (!fileName || fileName.indexOf(path.sep) === -1) {
        return Promise.resolve();
    }
    const chunks = fileName.split(path.sep);
    const directory = path.join(basePath, chunks.shift());

    return new Promise((resolve, reject) => {
        fs.access(directory, (err) => {
            if (err && err.code === 'ENOENT') {
                fs.mkdir(directory, (e) => {
                    if (e) {
                        reject(e);
                    } else {
                        resolve(ensureDirectories(basePath, chunks.join(path.sep)));
                    }
                });
            } else if (err) {
                reject(err);
            } else {
                resolve(ensureDirectories(basePath, chunks.join(path.sep)));
            }
        });
    });
}

function prepareHbs (directory, knownHelpers) {
    if (loadedPartials) {
        return loadedPartials;
    }

    loadedPartials = loadPartials(directory)
        .then((partials) => {
            loadedPartials = Promise.resolve();
            handlebars.registerHelper(knownHelpers);
            partials.forEach((partial) => {
                handlebars.registerPartial(partial.file, partial.partial);
            });
        });
    return loadedPartials;
}

function renderTemplate (viewsPath, view, config, knownHelpers, destPath) {

    const sourceFileName = path.join(viewsPath, view);
    const partialsDirectory = path.join(viewsPath, 'partials');

    const data = {
        ...config,
        appUrl: path.posix.join(config.appUrl, destPath
            .replace(/\\/g, '/')
            .replace(/\/index.html$/, '/'))
    };

    return prepareHbs(partialsDirectory, knownHelpers)
        .then(() => readFile(sourceFileName))
        .then((template) => {
            const tpl = handlebars.compile(template, { knownHelpers });
            return tpl(data);
        });
}

function getDestPath (view) {
    let destPath = view.replace(/\.hbs$/, '');

    if (!destPath.match(/(index|error)$/)) {
        destPath += `${path.sep}index.html`;
    } else {
        destPath += '.html';
    }

    return destPath;
}

function renderFile (viewFile, viewsPath, distPath, useConfig, knownHelpers) {
    const destPath = getDestPath(viewFile);
    const destFileName = path.join(distPath, destPath);

    return ensureDirectories(distPath, destPath)
        .then(() => renderTemplate(viewsPath, viewFile, useConfig, knownHelpers, destPath))
        .then((content) => writeFile(destFileName, content));
}

async function renderTemplates (config, viewsPath, distPath) {
    const useConfig = {
        ...config,
        apiUrl: `${config.apiUrl || ''}`,
        appUrl: `${config.appUrl || ''}`
    };

    console.log('Cleaning up dist dir'); // eslint-disable-line no-console

    const distFiles = fileListSync(distPath, /\.html$/);

    for (const file of distFiles) {
        console.log(` * removing '${file}'`); // eslint-disable-line no-console
        fs.unlinkSync(path.join(distPath, file));
    }

    console.log('Rendering views dir'); // eslint-disable-line no-console

    // find views
    const viewsFiles = fileListSync(viewsPath, /\.hbs$/);

    for (const viewFile of viewsFiles) {
        if (!viewFile.match(/^partials/)) {
            console.log(` * rendering '${viewFile}'`); // eslint-disable-line no-console
            // eslint-disable-next-line no-await-in-loop
            await renderFile(viewFile, viewsPath, distPath, useConfig, helpers);
        }
    }
}

function watchTemplates (config, viewsPath, distPath) {
    fs.watch(viewsPath, { recursive: true }, (err, filename) => {
        if (filename.match(/^partials/)) {
            renderTemplates(config, viewsPath, distPath)
                .then(() => console.log(' * updated all templates')) // eslint-disable-line no-console
                .catch((e) => console.error(' * ERROR: template update failed: ', e)); // eslint-disable-line no-console
        } else {
            renderFile(filename, viewsPath, distPath, config, helpers)
                .then(() => console.log(` * updated template: ${filename}`)) // eslint-disable-line no-console
                .catch((e) => console.error(` * ERROR: template update failed (${filename})`, e)); // eslint-disable-line no-console
        }
    });
}

module.exports = {
    watchTemplates,
    renderTemplates
};
