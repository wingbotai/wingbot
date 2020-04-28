{% raw %}<div id="ReducerWrapper">&nbsp;</div>{% endraw %}

## ReducerWrapper ⇐ <code>EventEmitter</code>
**Kind**: global class  
**Extends**: <code>EventEmitter</code>  
**Emits**: <code>ReducerWrapper#event:action</code>  

* [ReducerWrapper](#ReducerWrapper) ⇐ <code>EventEmitter</code>
    * [new ReducerWrapper()](#new_ReducerWrapper_new)
    * _instance_
        * [.reduce(req, res, postBack)](#ReducerWrapper_reduce)
        * [.emitAction(req, res, action)](#ReducerWrapper_emitAction)
    * _static_
        * [.ReducerWrapper](#ReducerWrapper_ReducerWrapper)
            * [new ReducerWrapper([reduce])](#new_ReducerWrapper_ReducerWrapper_new)

{% raw %}<div id="new_ReducerWrapper_new">&nbsp;</div>{% endraw %}

### new ReducerWrapper()
Solution for catching events. This is useful for analytics.

**Example**  
```javascript
const reducer = new ReducerWrapper((req, res) => {
    res.text('Hello');
});

reducer.on('action', (senderId, processedAction, text, req, lastAction, skill, res) => {
    // log action
});
```
{% raw %}<div id="ReducerWrapper_reduce">&nbsp;</div>{% endraw %}

### reducerWrapper.reduce(req, res, postBack)
Reducer function

**Kind**: instance method of [<code>ReducerWrapper</code>](#ReducerWrapper)  
**Params**

- req <code>Request</code>
- res <code>Responder</code>
- postBack <code>function</code>

{% raw %}<div id="ReducerWrapper_emitAction">&nbsp;</div>{% endraw %}

### reducerWrapper.emitAction(req, res, action)
Low level tracking method,
which disables the default automatic tracking
for a single interaction.

**Kind**: instance method of [<code>ReducerWrapper</code>](#ReducerWrapper)  
**Params**

- req <code>Request</code>
- res <code>Responder</code>
- action <code>string</code> | <code>boolean</code> <code> = null</code>

**Example**  
```javascript
const router = new Router();

router.on('action', (r, action) => {
    // will receive the action event
});

router.use('interaction', (req, res) => {
    // track 'foo' and 'bar', but not 'interaction'
    router.trackAs(req, res, 'foo');
    router.trackAs(req, res, 'bar');
});

router.use('will-not-be-tracked', (req, res) => {
    // will stop Processor to fire an "event" event and also router will track nothing
    router.trackAs(req, res, false);
});

router.use('disables-firing-processor-event', (req, res) => {
    // will track 'foo-bar'
    router.trackAs(req, res, 'foo-bar');
    // will stop Processor to fire an "event" event
    res.trackAs(false);
});
```
{% raw %}<div id="ReducerWrapper_ReducerWrapper">&nbsp;</div>{% endraw %}

### ReducerWrapper.ReducerWrapper
**Kind**: static class of [<code>ReducerWrapper</code>](#ReducerWrapper)  
{% raw %}<div id="new_ReducerWrapper_ReducerWrapper_new">&nbsp;</div>{% endraw %}

#### new ReducerWrapper([reduce])
Creates an instance of ReducerWrapper.

**Params**

- [reduce] <code>function</code> - the handler function

