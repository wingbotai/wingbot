## Classes

<dl>
<dt><a href="#GraphApi">GraphApi</a></dt>
<dd><p>Experimental chatbot API</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#postBackApi">postBackApi(processor, [acl])</a> ⇒ <code>PostBackAPI</code></dt>
<dd><p>Create a postback API</p>
</dd>
<dt><a href="#validateBotApi">validateBotApi(botFactory, [postBackTest], [textTest], [acl])</a> ⇒ <code>ValidateBotAPI</code></dt>
<dd><p>Test the bot configuration</p>
</dd>
<dt><a href="#apiAuthorizer">apiAuthorizer(args, ctx, acl)</a> ⇒ <code>boolean</code></dt>
<dd><p>If API call is authorized - use for own implementations of API endpoints</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#GraphQlResponse">GraphQlResponse</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#postBack">postBack</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#validateBot">validateBot</a> : <code>Object</code></dt>
<dd></dd>
</dl>

{% raw %}<div id="GraphApi">&nbsp;</div>{% endraw %}

## GraphApi
Experimental chatbot API

**Kind**: global class  

* [GraphApi](#GraphApi)
    * [new GraphApi(apis, options)](#new_GraphApi_new)
    * [.request(body, headers)](#GraphApi_request) ⇒ [<code>Promise.&lt;GraphQlResponse&gt;</code>](#GraphQlResponse)

{% raw %}<div id="new_GraphApi_new">&nbsp;</div>{% endraw %}

### new GraphApi(apis, options)
**Params**

- apis <code>Array.&lt;Object&gt;</code> - list of connected APIs
- options <code>Object</code> - API options
    - .token <code>string</code> - wingbot token
    - [.appToken] <code>string</code> - public token
    - [.groups] <code>Array.&lt;string&gt;</code> - list of allowed bot groups

{% raw %}<div id="GraphApi_request">&nbsp;</div>{% endraw %}

### graphApi.request(body, headers) ⇒ [<code>Promise.&lt;GraphQlResponse&gt;</code>](#GraphQlResponse)
**Kind**: instance method of [<code>GraphApi</code>](#GraphApi)  
**Params**

- body <code>Object</code>
    - .query <code>Object</code>
    - [.variables] <code>Object</code>
    - [.operationName] <code>string</code>
- headers <code>Object</code>
    - [.Authorization] <code>string</code>

{% raw %}<div id="postBackApi">&nbsp;</div>{% endraw %}

## postBackApi(processor, [acl]) ⇒ <code>PostBackAPI</code>
Create a postback API

**Kind**: global function  
**Params**

- processor <code>Object</code> - running messaging channel, like Facebook
- [acl] <code>Array.&lt;string&gt;</code> | <code>function</code> - limit api to array of groups or use auth function

**Example**  
```javascript
const { GraphApi, postBackApi } = require('wingbot');

const api = new GraphApi([
    postBackApi(channel)
], {
    appToken: 'API-will-be-accessible-with-this-token-in-Authorization-header'
})
```
{% raw %}<div id="validateBotApi">&nbsp;</div>{% endraw %}

## validateBotApi(botFactory, [postBackTest], [textTest], [acl]) ⇒ <code>ValidateBotAPI</code>
Test the bot configuration

**Kind**: global function  
**Params**

- botFactory <code>function</code> - function, which returns a bot
- [postBackTest] <code>string</code> | <code>null</code> - postback action to test
- [textTest] <code>string</code> | <code>null</code> - random text to test
- [acl] <code>Array.&lt;string&gt;</code> | <code>function</code> - limit api to array of groups or use auth function

**Example**  
```javascript
const { GraphApi, validateBotApi } = require('wingbot');

const api = new GraphApi([
    validateBotApi(botFactory, 'start', 'hello')
], {
    token: 'wingbot-token'
})
```
{% raw %}<div id="apiAuthorizer">&nbsp;</div>{% endraw %}

## apiAuthorizer(args, ctx, acl) ⇒ <code>boolean</code>
If API call is authorized - use for own implementations of API endpoints

**Kind**: global function  
**Params**

- args <code>Object</code> - gql request
- ctx <code>Object</code> - request context
- acl <code>Array.&lt;string&gt;</code> | <code>null</code> | <code>function</code> - custom acl settings

**Example**  
```javascript
const { apiAuthorizer } = require('wingbot');

function createApi (acl = null) {
    return {
         gqlEndpoint (args, ctx) {
             if (!apiAuthorizer(args, ctx, acl)) {
                 return null;
             }
         }
    }
}
```
{% raw %}<div id="GraphQlResponse">&nbsp;</div>{% endraw %}

## GraphQlResponse : <code>Object</code>
**Kind**: global typedef  
**Params**

- [data] <code>\*</code>
- [errors] <code>Array.&lt;Object&gt;</code>

{% raw %}<div id="postBack">&nbsp;</div>{% endraw %}

## postBack : <code>Object</code>
**Kind**: global typedef  
{% raw %}<div id="validateBot">&nbsp;</div>{% endraw %}

## validateBot : <code>Object</code>
**Kind**: global typedef  
