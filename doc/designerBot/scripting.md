# Scripting: Snippets and conditions

Easiest way to add custom behavior to your chatbot is to use **snippet directly in the wingbot.ai designer**.

## Snippet concept

**Snippet** is a function with following signature

```javascript
(req, res, postBack) => {

}
```

- `req` - the [Request](../api/Request.md) object
- `res` - the [Responder](../api/Responder.md) object
- `postBack` - function with `(action: string[, data: Promise<Object>|Object])`
    + makes a "redirect" to "action"
- return value of **snippet**
    + `void` - returning nothing lets Router automatically proceed the rest of interaction
    + `Promise` - you can use an async function, which return a Promise
    + `Router.CONTINUE` - continues in a messaging event processing
      > returning `Router.CONTINUE` at the end of the interaction causes bot to continue to following interactions
    + `Router.END` - stops processing a messaging event
- return value of **condition function**
    + `true` - yes, show the interaction
    + `false` - no, skip the interaction

## Conversation state and data

There is a **conversation state** accessible with `req.state`, which is stored under senderId in StateStorage.

- `req.state` - is the state as it was at the beginning of messaging event processing
- `res.setState(data)` - stores data into the state, after the event processing finishes
- `res.newState` - object, which is filled by `res.setState()` method during the messaging event processing

And there are **Responder data**, which persists only during the messaging event processing. Theese are usefull especially for displaying data in responses.

> Do not confuse **Responder data** (`res.data`) with **Request data** (`req.event`), which contains transformed messaging event, or **action data** (`req.actionData()`) which contains additional action (postback, ref, e.t.c.) metadata

- `res.data` - temporary responder data, empty object at the beginning of messaging event processing
- `res.setData()` - stores data into the Responder data

## Using data in designer

All Let's have interaction like this. Wingbot uses a **Handlebars** templating engine, so we can use conditional expressions like `{{#if variable}}{{/if}}`.

```
You have visited this {{timesText}}{{#unless timesText}}{{visits}} times{{//unless}}.
```

How to bring it to life? Let's put this snippet before previous text:

```javascript
(req, res) => {
    const { visits = 1 } = req.state;
    res
        .setState({ visits: visits + 1 }) // store the new state
        .setData({ visits };

    if (visits === 1) {
        res.setData({ timesText: 'for first time' });
    }
}
```

How the framework puts data into the template?

```
const templateData = Object.assign({}, req.state, res.newState, res.data, {
    _action: req.actionData()
});
```

## Loading data from APIs

In the snippet (**not in the condition**) is possible to make async actions. And its possible to use `request` npm library with `request-promise-native` wrapper, which makes `request()` calls simplier. How to fetch data in snippet?

**Non-blocking way (RECOMMENDED)**

Not blocking async actions are made through **two snippets in two interactions**.

First interaction: loading the data. Where to get right **action-name?** Its just a lowercase name of requested interaction. You can see it as "alt" text of the interaction title.

```javascript
(req, res, postBack) => {
    res.typingOn();
    postBack('second-interaction', async () => {
        try {
            // never send responses or save information to state here
            const data = await request('https://api.foobar.com/data');
            return { data };
        } catch (err) {
            return { err };
        }
    });
}
```

Second interaction: displaying the action result in text interaction

```
{{#if _action.err}}{{_action.err.message}}{{else}}{{_action.data.apiData}}{{/unless}}
```

or just process the data

```javascript
(req, res) => {
    const { err, data } = req.actionData();

    // do something with data
}
```

> It's not good to block messaging event processing with async actions, when action takes more then `timeout` (Processor option), it can lead to overwriting state, when concurrent request arrives.
