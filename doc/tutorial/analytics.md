# Analyzing the Bot

## Listening to action event

to track chat events simply use

```javascript
const { Router } = require('wingbot');
const botRoot = new Router();

botRoot.on('action', (senderId, action, text, req, lastAction, doNotTrack, skill, res) => {

    if (action) {
        // send info that `action` was passed
    }

    if (req.isText()) {
        // was pure test
    }

    // or use whole request event
    myMagicTracker(req.event);
});
```

## Logging AI success rate

`aiHandled` property is set to true, when intent was matched (using `ai.match()` method or `ai.navigate()`). Otherwise it is set to false.

> You can set `req.aiHandled` to true with method `req.markAsHandled()`

```javascript
const { Router, ai } = require('wingbot');
const botRoot = new Router();

botRoot.use(ai.match('intent'), ...);

botRoot.on('action', (senderId, action, text, req, lastAction, doNotTrack, skill, res) => {

    // logging winning intent
    if (req.intents && req.intents.length > 0) {
        const [{ intent, score, entities = [] }] = req.intents;


    }
});
```

When you need to collect AI feedback from `navigator/makeSure` matchers use `ai.onConfirmMiddleware(<handler>)` middleware.

## Tracking disambiguation

It's good to track when disambbiguation occurs and if user selects the right meaning

```javascript
const {
    Router,
    Processor,
    FLAG_DISAMBIGUATION_OFFERED,
    FLAG_DISAMBIGUATION_SELECTED
} = require('wingbot');
const botRoot = new Router();

botRoot.on('action', (senderId, action, text, req, lastAction, doNotTrack, skill, res) => {

    if (senderMeta.flag === FLAG_DISAMBIGUATION_OFFERED) {
        const { disambiguationIntents } = senderMeta;
        // when bot offers disambiguationIntents to let the user to choose
    }
});

const processor = new Processor(botRoot);

botRoot.on('action', (senderId, action, text, req, lastAction, doNotTrack, skill, senderMeta) => {

    if (senderMeta.flag === FLAG_DISAMBIGUATION_SELECTED) {
        const { likelyIntent, disambText } = senderMeta;
        // when user means disambText is likelyIntent
    }
});

```