# Analyzing the Bot

## Listening to action event

to track chat events simply use

```javascript
const { Router } = require('wingbot');
const botRoot = new Router();

botRoot.on('action', (senderId, action, text, req, lastAction, doNotTrack, skill) => {

    if (action) {
        // send info that `action` was passed
    }

    if (req.isText()) {
        // was pure test
    }

    // or use whole request event
    myMagicTracker(req.data);
});
```

## Logging AI success rate

`aiHandled` property is set to true, when intent was matched (using `ai.match()` method or `ai.navigate()`). Otherwise it is set to false.

> You can set `req.aiHandled` to true with method `req.markAsHandled()`

```javascript
const { Router, ai } = require('wingbot');
const botRoot = new Router();

botRoot.use(ai.match('intent'), ...);

botRoot.on('action', (senderId, action, text, req, lastAction, doNotTrack, skill) => {

    // logging winning intent
    if (req.aiIntent) {
        const { aiIntent, aiIntentScore, aiHandled } = req;

        // intent = intent name
        // aiIntentScore = score 0.0 - 1.0
        // aiHandled = whether the intent was handled or not
    }

    // logging winning intent score
    if (req.intent()) {
        const { intent, score } = req.intent();
    }
});
```

When you need to collect AI feedback from `navigator/makeSure` matchers use `ai.onConfirmMiddleware(<handler>)` middleware.
