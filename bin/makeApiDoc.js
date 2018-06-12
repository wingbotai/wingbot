'use strict';

const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const path = require('path');

const docs = [
    'src/Request.js',
    'src/Responder.js',
    ['src/templates/ButtonTemplate.js', 'src/templates/GenericTemplate.js', 'src/templates/ReceiptTemplate.js'],
    'src/Router.js',
    'src/ReducerWrapper.js',
    ['src/Tester.js', 'src/testTools/ResponseAssert.js', 'src/testTools/AnyResponseAssert.js'],
    ['src/tools/bufferloader.js', 'src/tools/MemoryStateStorage.js', 'src/tools/Translate.js', 'src/ReturnSender.js'],
    ['src/Ai.js', 'src/wingbot/WingbotModel.js', 'src/wingbot/CachedModel.js'],
    ['src/BuildRouter.js', 'src/Plugins.js']
];

let srcFile;
let docFile;
let files;
let apiDoc;

docs.forEach((doc) => {
    if (Array.isArray(doc)) {
        srcFile = doc[0];
        files = doc;
    } else {
        srcFile = doc;
        files = [doc];
    }

    docFile = path.join(process.cwd(), 'doc', 'api', srcFile
        .replace(/jsx?$/, 'md')
        .replace(/^src\/(templates\/|mongodb\/|tools\/|middlewares\/)?/, ''));

    apiDoc = jsdoc2md.renderSync({
        'example-lang': 'javascript',
        'param-list-format': 'list',
        files
    }).replace(/<a\sname="([^"]+)"><\/a>/g, (a, r) => `{% raw %}<div id="${r.replace(/[+.]/g, '_')}">&nbsp;</div>{% endraw %}`)
        .replace(/<a\shref="#([^"]+)">/g, (a, r) => `<a href="#${r.replace(/[+.]/g, '_')}">`)
        .replace(/]\(#([a-z+0-9_.]+)\)/ig, (a, r) => `](#${r.replace(/[+.]/g, '_')})`);

    fs.writeFileSync(docFile, apiDoc);
});
