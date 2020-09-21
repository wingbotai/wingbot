'use strict';

const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const path = require('path');

const docs = [
    'src/Request.js',
    'src/Responder.js',
    ['src/templates/ButtonTemplate.js', 'src/templates/GenericTemplate.js', 'src/templates/ReceiptTemplate.js'],
    ['src/Router.js', 'src/ReducerWrapper.js'],
    ['src/Tester.js', 'src/testTools/ResponseAssert.js', 'src/testTools/AnyResponseAssert.js', 'src/ConversationTester.js'],
    ['src/tools/bufferloader.js', 'src/utils/quickReplies.js', 'src/flags.js', 'src/tools/MemoryStateStorage.js', 'src/tools/Translate.js', 'src/ReturnSender.js'],
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

docs.forEach((doc) => {
    if (Array.isArray(doc)) {
        [srcFile] = doc;
        files = doc;
    } else {
        srcFile = doc;
        files = [doc];
    }

    docFile = path.join(process.cwd(), 'doc', 'api', srcFile
        .replace(/jsx?$/, 'md')
        .replace(/^src\/(templates\/|mongodb\/|tools\/|utils\/|middlewares\/|notifications\/|graphApi\/)?/, ''));

    files = files
        .map((file) => {
            const docFileName = path.resolve(process.cwd(), file);
            let source = fs.readFileSync(docFileName, { encoding: 'utf8' });
            const targetFile = docFileName.replace(srcDir, tempDir);

            // filter source files
            source = source.replace(/\/\*\*\s+@typedef\s+\{import[^*]+\*\//g, '');

            createDirectoryIfNotExists(targetFile);
            fs.writeFileSync(targetFile, source);
            return targetFile;
        });

    apiDoc = jsdoc2md.renderSync({
        exampleLang: 'javascript',
        paramListFormat: 'list',
        files
    })
        .replace(/<a\sname="([^"]+)"><\/a>/g, (a, r) => `{% raw %}<div id="${r.replace(/[+.]/g, '_')}">&nbsp;</div>{% endraw %}`)
        .replace(/<a\shref="#([^"]+)">/g, (a, r) => `<a href="#${r.replace(/[+.]/g, '_')}">`)
        .replace(/]\(#([a-z+0-9_.]+)\)/ig, (a, r) => `](#${r.replace(/[+.]/g, '_')})`);

    fs.writeFileSync(docFile, apiDoc);
});

fs.rmdirSync(tempDir, { recursive: true });

const file = path.resolve(process.cwd(), 'doc', 'api', 'graphqlSchema.md');
let data = fs.readFileSync(file, { encoding: 'utf8' });
data = data.replace(/<\/?details>/g, '');
fs.writeFileSync(file, data);
