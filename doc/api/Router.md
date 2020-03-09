## Classes

<dl>
<dt><a href="#Router">Router</a> ⇐ <code>ReducerWrapper</code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Resolver">Resolver</a> : <code>function</code></dt>
<dd></dd>
<dt><a href="#BotPath">BotPath</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Middleware">Middleware</a> : <code><a href="#Resolver">Resolver</a></code> | <code>string</code> | <code>RegExp</code> | <code><a href="#Router">Router</a></code> | <code><a href="#BotPath">BotPath</a></code></dt>
<dd><p>flow control statement or function</p>
</dd>
</dl>

{% raw %}<div id="Router">&nbsp;</div>{% endraw %}

## Router ⇐ <code>ReducerWrapper</code>
**Kind**: global class  
**Extends**: <code>ReducerWrapper</code>  

* [Router](#Router) ⇐ <code>ReducerWrapper</code>
    * [new Router()](#new_Router_new)
    * _instance_
        * [.use(...resolvers)](#Router_use) ⇒ <code>this</code>
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

{% raw %}<div id="Resolver">&nbsp;</div>{% endraw %}

## Resolver : <code>function</code>
**Kind**: global typedef  
**Params**

- [req] <code>Request</code>
- [res] <code>Responder</code>
- [postBack] <code>function</code>

{% raw %}<div id="BotPath">&nbsp;</div>{% endraw %}

## BotPath : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| path | <code>string</code> | 

{% raw %}<div id="Middleware">&nbsp;</div>{% endraw %}

## Middleware : [<code>Resolver</code>](#Resolver) \| <code>string</code> \| <code>RegExp</code> \| [<code>Router</code>](#Router) \| [<code>BotPath</code>](#BotPath)
flow control statement or function

**Kind**: global typedef  
