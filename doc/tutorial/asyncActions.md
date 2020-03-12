# Asynchronous actions

Processing a chat event from user blocks other event from same user until the processing is finnished. It's very important for choosing right approach.

There are two approches to drive asynchronous actions:

- **blocking**: Other Messenger events are waiting for limited time until the asynchronous operation is completed
- **non blocking**: Bot can process other chat events while asynchronous operation is in progress

> Blocking is important for keeping conversation state consistent.

## Blocking Asynchronous actions

For fast async operations you can use blocking approach. You can simply return a Promise or make function async. **This approach is not recommended for production environments.**

```javascript
const { Router } = require('wingbot');
const bot = new Router();

function asyncAction () {
    return new Promise(r => setTimeout(() => r(Math.rand()), 100));
}

bot.use(async (req, res) => {
    try {
        res.typingOn();
        const result = await asyncAction();

        res.text('Complete!')
                .setState({ result });
    } catch (e) {
        res.text('Async action failed');
    }
});

module.exports = bot;
```

> It's not good to block messaging event processing with async actions, when action takes more then `timeout` (Processor option), it can lead to overwriting state, when concurrent request arrives.

## Non blocking asynchronous actions

For non blocking approach is good to know, that **only postBack can be called after an action is resolved**.
Any other calls, like `setState()` will have no effect. This is the only right way to make non-blocking asynchronous operations.

```javascript
const { Router } = require('wingbot');
const bot = new Router();

function asyncAction () {
    return new Promise(r => setTimeout(() => Math.rand(), 100));
}

bot.use('/asyncComplete', (req, res) => {
    const { result, err } = req.actionData();
    if (err) {
        res.text('Async action failed');
    } else {
        res.text('Complete!')
                .setState({ result });
    }
});

bot.use((req, res, postBack) => {
    res.typingOn();
    postBack('asyncComplete', async () => {
        try {
            const result = await asyncAction();
            return { result };
        } catch (err) {
            return err;
        }
    });
});

module.exports = bot;
```

## Loading Attachments to Buffer

Most simpliest way to upload attachments is converting them to base64 buffer:

```javascript
const { Router, bufferloader } = require('wingbot');
const bot = new Router();

function asyncAction () {
    return new Promise(r => setTimeout(() => Math.rand(), 100));
}

bot.use('/uploadComplete', (req, res) => {
    const { result, err } =
    if (!err) {
        res.text('Complete!')
                .setState({ result });
    } else if (err.code === 400) {
        res.text('Upload size exceeded');
    } else {
        res.text('Async action failed');
    }
});

bot.use((req, res, postBack) => {
    // wait method is usefull for testing
    if (!req.isAttachment()) {
        return Router.CONTINUE;
    }
    res.typingOn();
    postBack('uploadComplete', async () => {
        try {
            const buf = bufferloader(req.attachmentUrl(), 1024);
            return { result: buf.toString('base64') };
        } catch (err) {
            return { err };
        }
    });
});

module.exports = bot;
```