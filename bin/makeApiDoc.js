'use strict';

const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const path = require('path');

const docs = [
    'src/Request.js',
    'src/Responder.js',
    ['src/BotApp.js', 'src/Processor.js'],
    ['src/templates/ButtonTemplate.js', 'src/templates/GenericTemplate.js', 'src/templates/ReceiptTemplate.js'],
    ['src/Router.js', 'src/ReducerWrapper.js'],
    ['src/Tester.js', 'src/testTools/ResponseAssert.js', 'src/testTools/AnyResponseAssert.js', 'src/ConversationTester.js'],
    ['src/tools/bufferloader.js', 'src/utils/compileWithState.js', 'src/utils/quickReplies.js', 'src/flags.js', 'src/tools/MemoryStateStorage.js', 'src/ReturnSender.js'],
    ['src/utils/stateVariables.js'],
    ['src/Ai.js', 'src/wingbot/CustomEntityDetectionModel.js', 'src/wingbot/WingbotModel.js', 'src/wingbot/CachedModel.js', 'src/AiMatching.js'],
    ['src/BuildRouter.js', 'src/Plugins.js'],
    ['src/notifications/Notifications.js', 'src/notifications/NotificationsStorage.js'],
    ['src/graphApi/GraphApi.js', 'src/graphApi/postBackApi.js', 'src/graphApi/validateBotApi.js', 'src/graphApi/conversationsApi.js', 'src/graphApi/apiAuthorizer.js', 'src/graphApi/conversationsApi.js']
];

let srcFile;
let docFile;
let files;
let apiDoc;

function createDirectoryIfNotExists (filename, isDirectory = false) {
    if (isDirectory) {
        if (!fs.existsSync(filename)) {
            fs.mkdirSync(filename, { recursive: true });
        }
        return;
    }

    const dir = filename.replace(/[\\/][^\\/]+$/, '');

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const tempDir = path.resolve(process.cwd(), 'tempSrc');
const srcDir = path.resolve(process.cwd(), 'src');
if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir, { recursive: true });
createDirectoryIfNotExists(tempDir, true);

docs.forEach((doc, index) => {
    if (Array.isArray(doc)) {
        [srcFile] = doc;
        files = doc;
    } else {
        srcFile = doc;
        files = [doc];
    }

    docFile = path.join(process.cwd(), 'documentation', 'pages', 'docs', 'api', srcFile
        .replace(/jsx?$/, 'mdx')
        .replace(/^src\/(templates\/|mongodb\/|tools\/|utils\/|middlewares\/|notifications\/|graphApi\/)?/, ''));

    files = files
        .map((file) => {
            const docFileName = path.resolve(process.cwd(), file);
            let source = fs.readFileSync(docFileName, { encoding: 'utf8' });
            const targetFile = docFileName.replace(srcDir, tempDir);

            // filter source files
            source = source
                // generics
                .replace(/(Middleware|Resolver|Router|Request)<[a-zA-Z,\s]+>/g, '$1')
                // imports
                .replace(/\/\*\*[^/]+@typedef\s+\{import[^*]+\*\//gm, '')
                // tuples
                .replace(/\/\*\*[^/]+@typedef\s+\{[[^*]+\*\//gm, '')
                // keyof
                .replace(/(\/\*\*[^/]+\{[^}]+(<|,\s))keyof/gm, '$1')
                // unions
                .replace(/@typedef\s+\{[a-zA-Z0-9]+\s*&\s*[a-zA-Z0-9]+(\s*&\s*[a-zA-Z0-9]+)*\}/g, (o) => o.replace(/&/g, '|'));

            createDirectoryIfNotExists(targetFile);
            fs.writeFileSync(targetFile, source);
            return targetFile;
        });

    apiDoc = jsdoc2md.renderSync({
        exampleLang: 'javascript',
        paramListFormat: 'list',
        files
    })
        .replace(/<a\sname="([^"]+)"><\/a>/g, (a, r) => `<div id="${r.replace(/[+.]/g, '_')}">&nbsp;</div>`)
        .replace(/<a\shref="#([^"]+)">/g, (a, r) => `<a href="#${r.replace(/[+.]/g, '_')}">`)
        .replace(/]\(#([a-z+0-9_.]+)\)/ig, (a, r) => `](#${r.replace(/[+.]/g, '_')})`);

    const expresions = apiDoc.match(/\{([a-zA-Z]+?)\}/g);
    if (expresions) {
        [...new Set(expresions)].forEach((expresion) => {
            apiDoc = `export const ${expresion.slice(1, -1)} = "${expresion}";\n\n${apiDoc}`;
        });
    }

    const title = path.basename(docFile).replace(/\.[^/.]+$/, '');
    apiDoc = `---\n\
title: ${title} # Title of your page\n\
section: API # Sidebar navigation group title\n\
order: ${index} # Order in the sidebar navigation group\n\
---\n\n${apiDoc}`;

    fs.writeFileSync(docFile, apiDoc);
});

fs.rmdirSync(tempDir, { recursive: true });

const file = path.resolve(process.cwd(), 'doc', 'api', 'graphqlSchema.md');
let data = fs.readFileSync(file, { encoding: 'utf8' });
data = data.replace(/<\/?details>/g, '');
fs.writeFileSync(file, data);
