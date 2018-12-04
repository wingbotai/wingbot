## Classes

<dl>
<dt><a href="#Router">Router</a> ⇐ <code>ReducerWrapper</code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Resolver">Resolver</a> : <code>function</code></dt>
<dd></dd>
</dl>

{% raw %}<div id="Router">&nbsp;</div>{% endraw %}

## Router ⇐ <code>ReducerWrapper</code>
**Kind**: global class  
**Extends**: <code>ReducerWrapper</code>  

* [Router](#Router) ⇐ <code>ReducerWrapper</code>
    * [new Router()](#new_Router_new)
    * _instance_
        * [.use(...resolvers)](#Router_use) ⇒ <code>Object</code>
    * _static_
        * [.CONTINUE](#Router_CONTINUE)
        * [.BREAK](#Router_BREAK)
        * [.END](#Router_END)
        * [.exit(action, [data])](#Router_exit) ⇒ <code>Array</code>

{% raw %}<div id="new_Router_new">&nbsp;</div>{% endraw %}

### new Router()
Cascading router

{% raw %}<div id="Router_use">&nbsp;</div>{% endraw %}

### router.use(...resolvers) ⇒ <code>Object</code>
Appends middleware, action handler or another router

**Kind**: instance method of [<code>Router</code>](#Router)  
**Params**

- ...resolvers <code>string</code> | [<code>Resolver</code>](#Resolver) | <code>RegExp</code> | [<code>Router</code>](#Router) | [<code>Array.&lt;Resolver&gt;</code>](#Resolver) | <code>Array.&lt;string&gt;</code> - list of resolvers

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
router.use('/path', reducer1, reducer2)
   .onExit('exitAction', (data, req, res, postBack) => {
       postBack('anotherAction', { someData: true })
   });

// append router with exit action
router.use('/path', subRouter)
   .onExit('exitAction', (data, req, res, postBack) => {
       postBack('anotherAction', { someData: true })
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

{% raw %}<div id="Router_exit">&nbsp;</div>{% endraw %}

### Router.exit(action, [data]) ⇒ <code>Array</code>
Create the exit point
Its same as returning `['action', { data }]`

**Kind**: static method of [<code>Router</code>](#Router)  
**Params**

- action <code>string</code> - the exit action
- [data] <code>Object</code> - the data

**Example**  
```javascript
router.use((req, res) => {
    return Router.exit('exitName');
});
```
{% raw %}<div id="Resolver">&nbsp;</div>{% endraw %}

## Resolver : <code>function</code>
**Kind**: global typedef  
**Params**

- req <code>Request</code>
- res <code>Responder</code>
- postBack <code>function</code>

