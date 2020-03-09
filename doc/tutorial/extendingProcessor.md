# Extenting the wingbot's abilities using Processor plugin

To be able to:

- add methods to `Request` or `Responder`
- modify state before save

you can use a Processor plugin

## Processor plugin

Processor plugin has following interface and **all functions can be async or not.**

- **#processMessage(message, pageId, messageSender)**

    Called immediately after the messaging event arrives to Processor. Has following signature:

    - `message: object` - the messaging event object
    - `pageId: string` - id of page (channel), where the event occured
    - `messageSender: Sender` - an instance of Sender class, which allows to send responses
    - **returns:** `{status:number}` - status 200 will stop the dispatching and will be returned

- **#beforeAiPreload(req, res): boolean**

    Called immediately after loading the state and before the intent or entities are attached and also before the "setState" from quick replies is processed.

    Returning `false` stops the dispatching.

- **#beforeProcessMessage(req, res): boolean**

    Called just before passing a message through bot.

    Returning `false` stops the dispatching.

- **#afterProcessMessage(req, res)**

    Called after the bot completes dispatching an event. Allows to modify state before it'll be stored.

## Using the plugin

This example shows how to implement own state property and it's setter, so the data will be persisted.

```javascript

class MySpecialStatePlugin {

    beforeProcessMessage (req, res) {
        Object.assign(req, {
            mySpecialState: req.state._mySpecState
        });
        Object.assign(res, {
            _updateMySpecialState: {},
            setMySpecialState (data) {
                Object.assign(this._updateMySpecialState, data);
            }
        })
    }

    afterProcessMessage (req, res) {
        res.setState({
            _mySpecState: {
                ...req.mySpecialState,
                ...res._updateMySpecialState
            }
        });
    }

}

// using the plugin
const bot = new Router();

bot.use('start', (req, res) => {
    res.setMySpecialState({ visitedStart: true });
});

// register the plugin in processor
const processor = new Processor(bot);

processor.plugin(new MySpecialStatePlugin());
```