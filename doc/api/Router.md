## Classes

<dl>
<dt><a href="#Router">Router</a> ⇐ <code><a href="#ReducerWrapper">ReducerWrapper</a></code></dt>
<dd></dd>
<dt><a href="#ReducerWrapper">ReducerWrapper</a> ⇐ <code>EventEmitter</code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Resolver">Resolver</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#BotPath">BotPath</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Middleware">Middleware</a> : <code><a href="#Resolver">Resolver</a></code> | <code>string</code> | <code>RegExp</code> | <code><a href="#Router">Router</a></code> | <code><a href="#BotPath">BotPath</a></code></dt>
<dd><p>flow control statement or function</p>
</dd>
</dl>

{% raw %}<div id="Router">&nbsp;</div>{% endraw %}

## Router ⇐ [<code>ReducerWrapper</code>](#ReducerWrapper)
**Kind**: global class  
**Extends**: [<code>ReducerWrapper</code>](#ReducerWrapper)  

* [Router](#Router) ⇐ [<code>ReducerWrapper</code>](#ReducerWrapper)
    * [new Router()](#new_Router_new)
    * _instance_
        * [.use(...resolvers)](#Router_use) ⇒ <code>this</code>
        * [.reduce(req, res, postBack)](#ReducerWrapper_reduce)
        * [.emitAction(req, res, action)](#ReducerWrapper_emitAction)
    * _static_
        * [.CONTINUE](#Router_CONTINUE)
        * [.BREAK](#Router_BREAK)
        * [.END](#Router_END)

{% raw %}<div id="new_Router_new">&nbsp;</div>{% endraw %}

### new Router()
Cascading router

{% raw %}<div id="Router_use">&nbsp;</div>{% endraw %}

### router.use(...resolvers) ⇒ <code>this</code>
Appends middleware, action handler or another router

**Kind**: instance method of [<code>Router</code>](#Router)  
**Params**

- ...resolvers [<code>Middleware</code>](#Middleware) | [<code>Array.&lt;Middleware&gt;</code>](#Middleware) - list of resolvers

**Example**  
```javascript
// middleware
router.use((req, res, postBack) => Router.CONTINUE);

// route with matching regexp
router.use(/help/, (req, res) => {
    res.text('Hello!');
});

// route with matching function (the function is considered as matcher
// in case of the function accepts zero or one argument)
router.use('action', req => req.text() === 'a', (req, res) => {
    res.text('Hello!');
});

// use multiple reducers
router.use('/path', reducer1, reducer2);
```
{% raw %}<div id="ReducerWrapper_reduce">&nbsp;</div>{% endraw %}

### router.reduce(req, res, postBack)
Reducer function

**Kind**: instance method of [<code>Router</code>](#Router)  
**Overrides**: [<code>reduce</code>](#ReducerWrapper_reduce)  
**Params**

- req <code>Request</code>
- res <code>Responder</code>
- postBack <code>function</code>

{% raw %}<div id="ReducerWrapper_emitAction">&nbsp;</div>{% endraw %}

### router.emitAction(req, res, action)
Low level tracking method,
which disables the default automatic tracking
for a single interaction.

**Kind**: instance method of [<code>Router</code>](#Router)  
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
{% raw %}<div id="Router_CONTINUE">&nbsp;</div>{% endraw %}

### Router.CONTINUE
Return `Router.CONTINUE` when action matches your route
Its same as returning `true`

**Kind**: static property of [<code>Router</code>](#Router)  
**Properties**

| Type |
| --- |
| <code>boolean</code> | 

{% raw %}<div id="Router_BREAK">&nbsp;</div>{% endraw %}

### Router.BREAK
Return `Router.BREAK` when action does not match your route
Its same as returning `false`

**Kind**: static property of [<code>Router</code>](#Router)  
**Properties**

| Type |
| --- |
| <code>boolean</code> | 

{% raw %}<div id="Router_END">&nbsp;</div>{% endraw %}

### Router.END
Returning `Router.END` constant stops dispatching request
Its same as returning `undefined`

**Kind**: static property of [<code>Router</code>](#Router)  
**Properties**

| Type |
| --- |
| <code>null</code> | 

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

{% raw %}<div id="Resolver">&nbsp;</div>{% endraw %}

## Resolver : <code>function</code>
**Kind**: global typedef  
**Params**

- [req] <code>Request</code>
- [res] <code>Responder</code>
- [postBack] <code>function</code>

{% raw %}<div id="BotPath">&nbsp;</div>{% endraw %}

## BotPath : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| path | <code>string</code> | 

{% raw %}<div id="Middleware">&nbsp;</div>{% endraw %}

## Middleware : [<code>Resolver</code>](#Resolver) \| <code>string</code> \| <code>RegExp</code> \| [<code>Router</code>](#Router) \| [<code>BotPath</code>](#BotPath)
flow control statement or function

**Kind**: global typedef  
