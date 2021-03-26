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

<div id="GraphApi">&nbsp;</div>

## GraphApi
Experimental chatbot API

**Kind**: global class  

* [GraphApi](#GraphApi)
    * [new GraphApi(apis, options)](#new_GraphApi_new)
    * [.request(body, headers, [wingbotToken])](#GraphApi_request) ⇒ [<code>Promise.&lt;GraphQlResponse&gt;</code>](#GraphQlResponse)

<div id="new_GraphApi_new">&nbsp;</div>

### new GraphApi(apis, options)

| Param | Type | Description |
| --- | --- | --- |
| apis | <code>Array.&lt;object&gt;</code> | list of connected APIs |
| options | <code>object</code> | API options |
| options.token | <code>string</code> \| <code>Promise.&lt;string&gt;</code> | wingbot token |
| [options.appToken] | <code>string</code> | public token |
| [options.groups] | <code>Array.&lt;string&gt;</code> | list of allowed bot groups |
| [options.useBundledGql] | <code>boolean</code> | uses library bundled graphql definition |

<div id="GraphApi_request">&nbsp;</div>

### graphApi.request(body, headers, [wingbotToken]) ⇒ [<code>Promise.&lt;GraphQlResponse&gt;</code>](#GraphQlResponse)
**Kind**: instance method of [<code>GraphApi</code>](#GraphApi)  

| Param | Type |
| --- | --- |
| body | <code>object</code> | 
| body.query | <code>object</code> | 
| [body.variables] | <code>object</code> | 
| [body.operationName] | <code>string</code> | 
| headers | <code>object</code> | 
| [headers.Authorization] | <code>string</code> | 
| [headers.authorization] | <code>string</code> | 
| [wingbotToken] | <code>string</code> | 

<div id="postBackApi">&nbsp;</div>

## postBackApi(processor, [acl]) ⇒ [<code>PostBackAPI</code>](#PostBackAPI)
Create a postback API

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| processor | <code>Object</code> | running messaging channel, like Facebook |
| [acl] | <code>Array.&lt;string&gt;</code> \| <code>function</code> | limit api to array of groups or use auth function |

**Example**  
```js
const { GraphApi, postBackApi } = require('wingbot');

const api = new GraphApi([
    postBackApi(channel)
], {
    appToken: 'API-will-be-accessible-with-this-token-in-Authorization-header'
})
```
<div id="validate">&nbsp;</div>

## validate(bot, validationRequestBody, postBackTest, textTest)
**Kind**: global function  

| Param | Type | Default |
| --- | --- | --- |
| bot | <code>object</code> |  | 
| validationRequestBody | <code>object</code> |  | 
| postBackTest | <code>string</code> \| <code>function</code> | <code>null</code> | 
| textTest | <code>string</code> \| <code>function</code> | <code>null</code> | 

<div id="validateBotApi">&nbsp;</div>

## validateBotApi(botFactory, [postBackTest], [textTest], [acl]) ⇒ [<code>ValidateBotAPI</code>](#ValidateBotAPI)
Test the bot configuration

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| botFactory | <code>function</code> |  | function, which returns a bot |
| [postBackTest] | <code>string</code> \| <code>function</code> \| <code>null</code> | <code>null</code> | postback action to test |
| [textTest] | <code>string</code> \| <code>function</code> \| <code>null</code> | <code>null</code> | random text to test |
| [acl] | <code>Array.&lt;string&gt;</code> \| <code>function</code> | <code></code> | limit api to array of groups or use auth function |

**Example**  
```js
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
<div id="conversationsApi">&nbsp;</div>

## conversationsApi(stateStorage, chatLogStorage, notifications, [acl], options) ⇒ <code>ConversationsAPI</code>
Create a conversations API
for retrieving conversations and it's history

**Kind**: global function  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| stateStorage | [<code>StateStorage</code>](#StateStorage) |  |  |
| chatLogStorage | [<code>ChatLogStorage</code>](#ChatLogStorage) | <code></code> |  |
| notifications | [<code>Notifications</code>](#Notifications) | <code></code> |  |
| [acl] | <code>Array.&lt;string&gt;</code> \| <code>function</code> | <code></code> | limit api to array of groups or use auth function |
| options | <code>object</code> |  |  |
| [options.stateTextFilter] | [<code>textFilter</code>](#textFilter) |  | optional funcion for filtering data in states |

**Example**  
```js
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
<div id="apiAuthorizer">&nbsp;</div>

## apiAuthorizer(args, ctx, acl) ⇒ <code>boolean</code>
If API call is authorized - use for own implementations of API endpoints

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>object</code> | gql request |
| ctx | <code>Object</code> | request context |
| acl | <code>Array.&lt;string&gt;</code> \| <code>null</code> \| <code>function</code> | custom acl settings |

**Example**  
```js
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
<div id="GraphQlResponse">&nbsp;</div>

## GraphQlResponse : <code>object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| [data] | <code>\*</code> | 
| [errors] | <code>Array.&lt;object&gt;</code> | 

<div id="PostBackAPI">&nbsp;</div>

## PostBackAPI : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| postBack | <code>function</code> | 

<div id="ValidateBotAPI">&nbsp;</div>

## ValidateBotAPI : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| validateBot | <code>function</code> | 

<div id="conversation">&nbsp;</div>

## conversation : <code>object</code>
**Kind**: global typedef  
<div id="StateStorage">&nbsp;</div>

## StateStorage : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| getStates | <code>function</code> | 
| getState | <code>function</code> | 

<div id="Notifications">&nbsp;</div>

## Notifications : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| getSubscribtions | <code>function</code> | 

<div id="ChatLogStorage">&nbsp;</div>

## ChatLogStorage : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| getInteractions | <code>function</code> | 

<div id="textFilter">&nbsp;</div>

## textFilter ⇒ <code>any</code>
Function for filtration of string output

**Kind**: global typedef  

| Param | Type |
| --- | --- |
| value | <code>string</code> | 
| key | <code>string</code> | 

