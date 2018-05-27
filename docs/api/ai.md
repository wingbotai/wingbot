## Classes

<dl>
<dt><a href="#Ai">Ai</a></dt>
<dd></dd>
<dt><a href="#WingbotModel">WingbotModel</a></dt>
<dd></dd>
<dt><a href="#CachedModel">CachedModel</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Intent">Intent</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Intent">Intent</a> : <code>Object</code></dt>
<dd></dd>
</dl>

{% raw %}<div id="Ai">&nbsp;</div>{% endraw %}

## Ai
**Kind**: global class  

* [Ai](#Ai)
    * [.confidence](#Ai_confidence) : <code>number</code>
    * [.logger](#Ai_logger) : <code>Object</code>
    * [.getPrefix(prefix, req)](#Ai_getPrefix)
    * [.mockIntent([intent], [confidence])](#Ai_mockIntent) ⇒ <code>this</code>
    * [.register(model, prefix)](#Ai_register) ⇒ [<code>WingbotModel</code>](#WingbotModel) \| <code>T</code>
    * [.load(prefix)](#Ai_load)
    * [.match(intent, [confidence], [prefix])](#Ai_match) ⇒ <code>function</code>

{% raw %}<div id="Ai_confidence">&nbsp;</div>{% endraw %}

### ai.confidence : <code>number</code>
Upper threshold - for match method and for navigate method

**Kind**: instance property of [<code>Ai</code>](#Ai)  
{% raw %}<div id="Ai_logger">&nbsp;</div>{% endraw %}

### ai.logger : <code>Object</code>
The logger (console by default)

**Kind**: instance property of [<code>Ai</code>](#Ai)  
{% raw %}<div id="Ai_getPrefix">&nbsp;</div>{% endraw %}

### ai.getPrefix(prefix, req)
The prefix translator - for request-specific prefixes

**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type |
| --- | --- |
| prefix | <code>string</code> | 
| req | <code>Request</code> | 

{% raw %}<div id="Ai_mockIntent">&nbsp;</div>{% endraw %}

### ai.mockIntent([intent], [confidence]) ⇒ <code>this</code>
Usefull method for testing AI routes

**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [intent] | <code>string</code> | <code>null</code> | intent name |
| [confidence] | <code>number</code> | <code></code> | the confidence of the top intent |

**Example**  
```javascript
const { Tester, ai, Route } = require('bontaut');

const bot = new Route();

bot.use(['intentAction', ai.match('intentName')], (req, res) => {
    res.text('PASSED');
});

describe('bot', function () {
    it('should work', function () {
        ai.mockIntent('intentName');

        const t = new Tester(bot);

        return t.text('Any text')
            .then(() => {
                t.actionPassed('intentAction');

            t.any()
                .contains('PASSED');
        })
    });
});
```
{% raw %}<div id="Ai_register">&nbsp;</div>{% endraw %}

### ai.register(model, prefix) ⇒ [<code>WingbotModel</code>](#WingbotModel) \| <code>T</code>
Registers Wingbot AI model

**Kind**: instance method of [<code>Ai</code>](#Ai)  
**Template**: T  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| model | <code>string</code> \| [<code>WingbotModel</code>](#WingbotModel) \| <code>T</code> |  | wingbot model name or AI plugin |
| prefix | <code>string</code> | <code>&quot;default&quot;</code> | model prefix |

{% raw %}<div id="Ai_load">&nbsp;</div>{% endraw %}

### ai.load(prefix)
Middleware, which ensures, that AI data are properly loaded in Request

**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type | Description |
| --- | --- | --- |
| prefix | <code>string</code> | AI model prefix |

**Example**  
```javascript
const { ai, Router } = require('wingbot');

const bot = new Router();

bot.use(ai.load());
```
{% raw %}<div id="Ai_match">&nbsp;</div>{% endraw %}

### ai.match(intent, [confidence], [prefix]) ⇒ <code>function</code>
Returns matching middleware

**Kind**: instance method of [<code>Ai</code>](#Ai)  
**Returns**: <code>function</code> - - the middleware  

| Param | Type | Default |
| --- | --- | --- |
| intent | <code>string</code> \| <code>Array</code> |  | 
| [confidence] | <code>number</code> | <code></code> | 
| [prefix] | <code>string</code> |  | 

**Example**  
```javascript
const { Router, ai } = require(''wingbot');

ai.register('app-model');

bot.use(ai.match('intent1'), (req, res) => {
    console.log(req.intent()); // { intent: 'intent1', score: 0.9604 }

    res.text('Oh, intent 1 :)');
});
```
{% raw %}<div id="WingbotModel">&nbsp;</div>{% endraw %}

## WingbotModel
**Kind**: global class  

* [WingbotModel](#WingbotModel)
    * [new WingbotModel(options, [log])](#new_WingbotModel_new)
    * [._queryModel(text)](#WingbotModel__queryModel) ⇒ <code>Promise.&lt;Array.&lt;Intent&gt;&gt;</code>

{% raw %}<div id="new_WingbotModel_new">&nbsp;</div>{% endraw %}

### new WingbotModel(options, [log])

| Param | Type |
| --- | --- |
| options | <code>Object</code> | 
| [options.serviceUrl] | <code>string</code> | 
| options.model | <code>string</code> | 
| [options.cacheSize] | <code>number</code> | 
| [options.matches] | <code>number</code> | 
| [log] | <code>Object</code> | 

{% raw %}<div id="WingbotModel__queryModel">&nbsp;</div>{% endraw %}

### wingbotModel._queryModel(text) ⇒ <code>Promise.&lt;Array.&lt;Intent&gt;&gt;</code>
**Kind**: instance method of [<code>WingbotModel</code>](#WingbotModel)  

| Param | Type |
| --- | --- |
| text | <code>string</code> | 

{% raw %}<div id="CachedModel">&nbsp;</div>{% endraw %}

## CachedModel
**Kind**: global class  

* [CachedModel](#CachedModel)
    * [new CachedModel(options, [log])](#new_CachedModel_new)
    * [.resolve(text)](#CachedModel_resolve) ⇒ <code>Promise.&lt;Array.&lt;Intent&gt;&gt;</code>
    * [._queryModel(text)](#CachedModel__queryModel) ⇒ <code>Promise.&lt;Array.&lt;Intent&gt;&gt;</code>

{% raw %}<div id="new_CachedModel_new">&nbsp;</div>{% endraw %}

### new CachedModel(options, [log])

| Param | Type |
| --- | --- |
| options | <code>Object</code> | 
| [options.cacheSize] | <code>number</code> | 
| [log] | <code>Object</code> | 

{% raw %}<div id="CachedModel_resolve">&nbsp;</div>{% endraw %}

### cachedModel.resolve(text) ⇒ <code>Promise.&lt;Array.&lt;Intent&gt;&gt;</code>
**Kind**: instance method of [<code>CachedModel</code>](#CachedModel)  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | the user input |

{% raw %}<div id="CachedModel__queryModel">&nbsp;</div>{% endraw %}

### cachedModel._queryModel(text) ⇒ <code>Promise.&lt;Array.&lt;Intent&gt;&gt;</code>
**Kind**: instance method of [<code>CachedModel</code>](#CachedModel)  

| Param | Type |
| --- | --- |
| text | <code>string</code> | 

{% raw %}<div id="Intent">&nbsp;</div>{% endraw %}

## Intent : <code>Object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| intent | <code>string</code> | 
| score | <code>number</code> | 
| [entities] | <code>Array.&lt;Object&gt;</code> | 

{% raw %}<div id="Intent">&nbsp;</div>{% endraw %}

## Intent : <code>Object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| intent | <code>string</code> | 
| score | <code>number</code> | 
| [entities] | <code>Array.&lt;Object&gt;</code> | 

