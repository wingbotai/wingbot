/**
 * @author David Menger
 */
'use strict';

function* iterateThroughWords (string, maxWordCount) {
    const split = string.split(/\s/);

    let start = 0;
    for (let i = 0, w; i < split.length; i++) {
        w = split[i];

        if (!w) {
            start++;
            continue;
        }

        if (w.match(/@[A-Z0-9-]+/)) {
            continue;
        }

        yield [w, start];

        let multiW = w;
        let subword;
        for (let j = i + 1, k = 1; j < split.length && k < maxWordCount; j++) {
            subword = split[j];
            if (subword.match(/@[A-Z0-9-]+/)) {
                break;
            }
            if (subword) {
                k++;
                multiW += ` ${subword}`;

                yield [multiW, start];
            } else {
                multiW += ' ';
            }
        }

        start += 1 + w.length;
    }
}

module.exports = {
    iterateThroughWords
};
