/**
 * @author wingbot.ai
 */
'use strict';

const path = require('path');
const fs = require('fs');

function fileListSync (dir, test, prevPath = '') {
    const ret = [];

    const absPath = path.join(dir, prevPath);
    const files = fs.readdirSync(absPath);

    for (const file of files) {
        const filePath = path.join(prevPath, file);
        const fullFilePath = path.join(dir, filePath);
        if (filePath.match(test)) {
            ret.push(filePath);
        } else if (fs.statSync(fullFilePath).isDirectory()) {
            ret.push(
                ...fileListSync(dir, test, filePath)
            );
        }
    }

    return ret;
}

module.exports = fileListSync;
