## Classes

<dl>
<dt><a href="#GraphApi">GraphApi</a></dt>
<dd><p>Experimental chatbot API</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#postBackApi">postBackApi(processor, [acl])</a> ⇒ <code><a href="#PostBackAPI">PostBackAPI</a></code></dt>
<dd><p>Create a postback API</p>
</dd>
<dt><a href="#validate">validate(bot, validationRequestBody, postBackTest, textTest)</a></dt>
<dd></dd>
<dt><a href="#validateBotApi">validateBotApi(botFactory, [postBackTest], [textTest], [acl])</a> ⇒ <code><a href="#ValidateBotAPI">ValidateBotAPI</a></code></dt>
<dd><p>Test the bot configuration</p>
</dd>
<dt><a href="#conversationsApi">conversationsApi(stateStorage, chatLogStorage, notifications, [acl], options)</a> ⇒ <code>ConversationsAPI</code></dt>
<dd><p>Create a conversations API
for retrieving conversations and it&#39;s history</p>
</dd>
<dt><a href="#apiAuthorizer">apiAuthorizer(args, ctx, acl)</a> ⇒ <code>boolean</code></dt>
<dd><p>If API call is authorized - use for own implementations of API endpoints</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#GraphQlResponse">GraphQlResponse</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#PostBackAPI">PostBackAPI</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#ValidateBotAPI">ValidateBotAPI</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#conversation">conversation</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#StateStorage">StateStorage</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Notifications">Notifications</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#ChatLogStorage">ChatLogStorage</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#textFilter">textFilter</a> ⇒ <code>any</code></dt>
<dd><p>Function for filtration of string output</p>
</dd>
</dl>

{% raw %}<div id="GraphApi">&nbsp;</div>{% endraw %}

## GraphApi
Experimental chatbot API

**Kind**: global class  

* [GraphApi](#GraphApi)
    * [new GraphApi(apis, options)](#new_GraphApi_new)
    * [.request(body, headers, [wingbotToken])](#GraphApi_request) ⇒ [<code>Promise.&lt;GraphQlResponse&gt;</code>](#GraphQlResponse)

{% raw %}<div id="new_GraphApi_new">&nbsp;</div>{% endraw %}

### new GraphApi(apis, options)
**Params**

- apis <code>Array.&lt;object&gt;</code> - list of connected APIs
- options <code>object</code> - API options
    - .token <code>string</code> | <code>Promise.&lt;string&gt;</code> - wingbot token
    - [.appToken] <code>string</code> - public token
    - [.groups] <code>Array.&lt;string&gt;</code> - list of allowed bot groups

{% raw %}<div id="GraphApi_request">&nbsp;</div>{% endraw %}

### graphApi.request(body, headers, [wingbotToken]) ⇒ [<code>Promise.&lt;GraphQlResponse&gt;</code>](#GraphQlResponse)
**Kind**: instance method of [<code>GraphApi</code>](#GraphApi)  
**Params**

- body <code>object</code>
    - .query <code>object</code>
    - [.variables] <code>object</code>
    - [.operationName] <code>string</code>
- headers <code>object</code>
    - [.Authorization] <code>string</code>
    - [.authorization] <code>string</code>
- [wingbotToken] <code>string</code>

{% raw %}<div id="postBackApi">&nbsp;</div>{% endraw %}

## postBackApi(processor, [acl]) ⇒ [<code>PostBackAPI</code>](#PostBackAPI)
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
{% raw %}<div id="validate">&nbsp;</div>{% endraw %}

## validate(bot, validationRequestBody, postBackTest, textTest)
**Kind**: global function  
**Params**

- bot <code>object</code>
- validationRequestBody <code>object</code>
- postBackTest <code>string</code> | <code>function</code> <code> = null</code>
- textTest <code>string</code> | <code>function</code> <code> = null</code>

{% raw %}<div id="validateBotApi">&nbsp;</div>{% endraw %}

## validateBotApi(botFactory, [postBackTest], [textTest], [acl]) ⇒ [<code>ValidateBotAPI</code>](#ValidateBotAPI)
Test the bot configuration

**Kind**: global function  
**Params**

- botFactory <code>function</code> - function, which returns a bot
- [postBackTest] <code>string</code> | <code>function</code> | <code>null</code> <code> = null</code> - postback action to test
- [textTest] <code>string</code> | <code>function</code> | <code>null</code> <code> = null</code> - random text to test
- [acl] <code>Array.&lt;string&gt;</code> | <code>function</code> <code> = </code> - limit api to array of groups or use auth function

**Example**  
```javascript
const { GraphApi, validateBotApi, Tester } = require('wingbot');

const api = new GraphApi([
    validateBotApi(botFactory, 'start', 'hello')
], {
    token: 'wingbot-token'
})

// OR WITH FUNCTION

const api = new GraphApi([
    validateBotApi(botFactory, async (t, bot) => {
        const tester = new Tester(bot);

        tester.postBack('start');
    })
], {
    token: 'wingbot-token'
})
```
{% raw %}<div id="conversationsApi">&nbsp;</div>{% endraw %}

## conversationsApi(stateStorage, chatLogStorage, notifications, [acl], options) ⇒ <code>ConversationsAPI</code>
Create a conversations API
for retrieving conversations and it's history

**Kind**: global function  
**Params**

- stateStorage [<code>StateStorage</code>](#StateStorage)
- chatLogStorage [<code>ChatLogStorage</code>](#ChatLogStorage) <code> = </code>
- notifications [<code>Notifications</code>](#Notifications) <code> = </code>
- [acl] <code>Array.&lt;string&gt;</code> | <code>function</code> <code> = </code> - limit api to array of groups or use auth function
- options <code>object</code>
    - [.stateTextFilter] [<code>textFilter</code>](#textFilter) - optional funcion for filtering data in states

**Example**  
```javascript
const { GraphApi, conversationsApi } = require('wingbot');
const BOT_UPDATE_GROUPS = ['botEditor', 'botAdmin', 'botUser'];

function stateTextFilter (value, key) {
    if (key === 'credentials.password') {
        return '****';
    }
    return value;
}

const api = new GraphApi([
    conversationsApi(
        stateStorage, chatLogStorage, notifications, BOT_UPDATE_GROUPS,
        { stateTextFilter }
    )
], {
    token: 'my-secret-token'
});
```
{% raw %}<div id="apiAuthorizer">&nbsp;</div>{% endraw %}

## apiAuthorizer(args, ctx, acl) ⇒ <code>boolean</code>
If API call is authorized - use for own implementations of API endpoints

**Kind**: global function  
**Params**

- args <code>object</code> - gql request
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

## GraphQlResponse : <code>object</code>
**Kind**: global typedef  
**Params**

- [data] <code>\*</code>
- [errors] <code>Array.&lt;object&gt;</code>

{% raw %}<div id="PostBackAPI">&nbsp;</div>{% endraw %}

## PostBackAPI : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| postBack | <code>function</code> | 

{% raw %}<div id="ValidateBotAPI">&nbsp;</div>{% endraw %}

## ValidateBotAPI : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| validateBot | <code>function</code> | 

{% raw %}<div id="conversation">&nbsp;</div>{% endraw %}

## conversation : <code>object</code>
**Kind**: global typedef  
{% raw %}<div id="StateStorage">&nbsp;</div>{% endraw %}

## StateStorage : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| getStates | <code>function</code> | 
| getState | <code>function</code> | 

{% raw %}<div id="Notifications">&nbsp;</div>{% endraw %}

## Notifications : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| getSubscribtions | <code>function</code> | 

{% raw %}<div id="ChatLogStorage">&nbsp;</div>{% endraw %}

## ChatLogStorage : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| getInteractions | <code>function</code> | 

{% raw %}<div id="textFilter">&nbsp;</div>{% endraw %}

## textFilter ⇒ <code>any</code>
Function for filtration of string output

**Kind**: global typedef  
**Params**

- value <code>string</code>
- key <code>string</code>

