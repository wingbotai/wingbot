## Classes

<dl>
<dt><a href="#Tester">Tester</a></dt>
<dd></dd>
<dt><a href="#ResponseAssert">ResponseAssert</a></dt>
<dd></dd>
<dt><a href="#AnyResponseAssert">AnyResponseAssert</a></dt>
<dd></dd>
<dt><a href="#ConversationTester">ConversationTester</a></dt>
<dd><p>Automated Conversation tests runner</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#TestSource">TestSource</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#TestCase">TestCase</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#TextCase">TextCase</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#TextTest">TextTest</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#TestCaseStep">TestCaseStep</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#TestsGroup">TestsGroup</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#List">List</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#TestsDefinition">TestsDefinition</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#testerFactory">testerFactory</a> ⇒ <code><a href="#Tester">Tester</a></code></dt>
<dd><p>Callback for getting a tester</p>
</dd>
<dt><a href="#TestsOutput">TestsOutput</a> : <code>object</code></dt>
<dd></dd>
</dl>

{% raw %}<div id="Tester">&nbsp;</div>{% endraw %}

## Tester
**Kind**: global class  

* [Tester](#Tester)
    * [new Tester()](#new_Tester_new)
    * _instance_
        * [.testData](#Tester_testData)
        * [.allowEmptyResponse](#Tester_allowEmptyResponse)
        * [.senderLogger](#Tester_senderLogger)
        * [.setExpandRandomTexts()](#Tester_setExpandRandomTexts)
        * [.cleanup()](#Tester_cleanup)
        * [.processMessage(message, senderId, pageId)](#Tester_processMessage) ⇒ <code>Promise.&lt;any&gt;</code>
        * [.res([index])](#Tester_res) ⇒ [<code>ResponseAssert</code>](#ResponseAssert)
        * [.any()](#Tester_any) ⇒ [<code>AnyResponseAssert</code>](#AnyResponseAssert)
        * [.lastRes()](#Tester_lastRes) ⇒ [<code>ResponseAssert</code>](#ResponseAssert)
        * [.passedAction(path)](#Tester_passedAction) ⇒ <code>this</code>
        * [.respondedWithBlock(blockName)](#Tester_respondedWithBlock) ⇒ <code>this</code>
        * [.getState()](#Tester_getState) ⇒ <code>object</code>
        * [.setState([state])](#Tester_setState)
        * [.text(text)](#Tester_text) ⇒ <code>Promise</code>
        * [.intent(intent, [text], [score])](#Tester_intent) ⇒ <code>Promise</code>
        * [.intentWithEntity(intent, entity, [value], [text], [score])](#Tester_intentWithEntity) ⇒ <code>Promise</code>
        * [.optin(action, [data], [userRef])](#Tester_optin) ⇒ <code>Promise</code>
        * [.quickReply(action, [data])](#Tester_quickReply) ⇒ <code>Promise</code>
        * [.quickReplyText(text)](#Tester_quickReplyText) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.postBack(action, [data], [refAction], [refData])](#Tester_postBack) ⇒ <code>Promise</code>
    * _static_
        * [.Tester](#Tester_Tester)
            * [new Tester(reducer, [senderId], [pageId], [processorOptions], [storage])](#new_Tester_Tester_new)

{% raw %}<div id="new_Tester_new">&nbsp;</div>{% endraw %}

### new Tester()
Utility for testing requests

{% raw %}<div id="Tester_testData">&nbsp;</div>{% endraw %}

### tester.testData
**Kind**: instance property of [<code>Tester</code>](#Tester)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| predefined | <code>object</code> | test data to use |

{% raw %}<div id="Tester_allowEmptyResponse">&nbsp;</div>{% endraw %}

### tester.allowEmptyResponse
**Kind**: instance property of [<code>Tester</code>](#Tester)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| allow | <code>boolean</code> | tester to process empty responses |

{% raw %}<div id="Tester_senderLogger">&nbsp;</div>{% endraw %}

### tester.senderLogger
**Kind**: instance property of [<code>Tester</code>](#Tester)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| use | <code>console</code> | own loggger |

{% raw %}<div id="Tester_setExpandRandomTexts">&nbsp;</div>{% endraw %}

### tester.setExpandRandomTexts()
Enable tester to expand random texts
It joins them into a single sting

**Kind**: instance method of [<code>Tester</code>](#Tester)  
{% raw %}<div id="Tester_cleanup">&nbsp;</div>{% endraw %}

### tester.cleanup()
Clear acquired responses and data

**Kind**: instance method of [<code>Tester</code>](#Tester)  
{% raw %}<div id="Tester_processMessage">&nbsp;</div>{% endraw %}

### tester.processMessage(message, senderId, pageId) ⇒ <code>Promise.&lt;any&gt;</code>
Use tester as a connector :)

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- message <code>object</code> - wingbot chat event
- senderId <code>string</code> - chat event sender identifier
- pageId <code>string</code> - channel/page identifier

{% raw %}<div id="Tester_res">&nbsp;</div>{% endraw %}

### tester.res([index]) ⇒ [<code>ResponseAssert</code>](#ResponseAssert)
Returns single response asserter

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- [index] <code>number</code> <code> = 0</code> - response index

{% raw %}<div id="Tester_any">&nbsp;</div>{% endraw %}

### tester.any() ⇒ [<code>AnyResponseAssert</code>](#AnyResponseAssert)
Returns any response asserter

**Kind**: instance method of [<code>Tester</code>](#Tester)  
{% raw %}<div id="Tester_lastRes">&nbsp;</div>{% endraw %}

### tester.lastRes() ⇒ [<code>ResponseAssert</code>](#ResponseAssert)
Returns last response asserter

**Kind**: instance method of [<code>Tester</code>](#Tester)  
{% raw %}<div id="Tester_passedAction">&nbsp;</div>{% endraw %}

### tester.passedAction(path) ⇒ <code>this</code>
Checks, that app past the action

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- path <code>string</code>

{% raw %}<div id="Tester_respondedWithBlock">&nbsp;</div>{% endraw %}

### tester.respondedWithBlock(blockName) ⇒ <code>this</code>
Checks, that a plugin used a block as a responde

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- blockName <code>string</code>

{% raw %}<div id="Tester_getState">&nbsp;</div>{% endraw %}

### tester.getState() ⇒ <code>object</code>
Returns state

**Kind**: instance method of [<code>Tester</code>](#Tester)  
{% raw %}<div id="Tester_setState">&nbsp;</div>{% endraw %}

### tester.setState([state])
Sets state with `Object.assign()`

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- [state] <code>object</code> <code> = {}</code>

{% raw %}<div id="Tester_text">&nbsp;</div>{% endraw %}

### tester.text(text) ⇒ <code>Promise</code>
Makes text request

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- text <code>string</code>

{% raw %}<div id="Tester_intent">&nbsp;</div>{% endraw %}

### tester.intent(intent, [text], [score]) ⇒ <code>Promise</code>
Makes recognised AI intent request

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- intent <code>string</code> | <code>Array.&lt;string&gt;</code>
- [text] <code>string</code> <code> = null</code>
- [score] <code>number</code>

{% raw %}<div id="Tester_intentWithEntity">&nbsp;</div>{% endraw %}

### tester.intentWithEntity(intent, entity, [value], [text], [score]) ⇒ <code>Promise</code>
Makes recognised AI intent request with entity

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- intent <code>string</code>
- entity <code>string</code>
- [value] <code>string</code>
- [text] <code>string</code>
- [score] <code>number</code> <code> = 1</code>

{% raw %}<div id="Tester_optin">&nbsp;</div>{% endraw %}

### tester.optin(action, [data], [userRef]) ⇒ <code>Promise</code>
Make optin call

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- action <code>string</code>
- [data] <code>object</code> <code> = {}</code>
- [userRef] <code>string</code> <code> = null</code> - specific ref string

{% raw %}<div id="Tester_quickReply">&nbsp;</div>{% endraw %}

### tester.quickReply(action, [data]) ⇒ <code>Promise</code>
Send quick reply

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- action <code>string</code>
- [data] <code>object</code> <code> = {}</code>

{% raw %}<div id="Tester_quickReplyText">&nbsp;</div>{% endraw %}

### tester.quickReplyText(text) ⇒ <code>Promise.&lt;boolean&gt;</code>
Send quick reply if text exactly matches, otherwise returns false

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- text <code>string</code>

{% raw %}<div id="Tester_postBack">&nbsp;</div>{% endraw %}

### tester.postBack(action, [data], [refAction], [refData]) ⇒ <code>Promise</code>
Sends postback, optionally with referrer action

**Kind**: instance method of [<code>Tester</code>](#Tester)  
**Params**

- action <code>string</code>
- [data] <code>object</code> <code> = {}</code>
- [refAction] <code>string</code> <code> = null</code> - referred action
- [refData] <code>object</code> <code> = {}</code> - referred action data

{% raw %}<div id="Tester_Tester">&nbsp;</div>{% endraw %}

### Tester.Tester
**Kind**: static class of [<code>Tester</code>](#Tester)  
{% raw %}<div id="new_Tester_Tester_new">&nbsp;</div>{% endraw %}

#### new Tester(reducer, [senderId], [pageId], [processorOptions], [storage])
Creates an instance of Tester.

**Params**

- reducer <code>Router</code> | <code>ReducerWrapper</code> | <code>function</code>
- [senderId] <code>string</code> <code> = null</code>
- [pageId] <code>string</code> <code> = null</code>
- [processorOptions] <code>object</code> <code> = {}</code> - options for Processor
- [storage] <code>MemoryStateStorage</code> - place to override the storage

{% raw %}<div id="ResponseAssert">&nbsp;</div>{% endraw %}

## ResponseAssert
**Kind**: global class  

* [ResponseAssert](#ResponseAssert)
    * [new ResponseAssert()](#new_ResponseAssert_new)
    * _instance_
        * [.contains(search)](#ResponseAssert_contains) ⇒ <code>this</code>
        * [.quickReplyAction(action)](#ResponseAssert_quickReplyAction) ⇒ <code>this</code>
        * [.templateType(type)](#ResponseAssert_templateType) ⇒ <code>this</code>
        * [.passThread([appId])](#ResponseAssert_passThread) ⇒ <code>this</code>
        * [.attachmentType(type)](#ResponseAssert_attachmentType) ⇒ <code>this</code>
    * _static_
        * [.AnyResponseAssert#contains(search)](#ResponseAssert_AnyResponseAssert_contains) ⇒ <code>this</code>
        * [.AnyResponseAssert#quickReplyAction(action)](#ResponseAssert_AnyResponseAssert_quickReplyAction) ⇒ <code>this</code>
        * [.AnyResponseAssert#quickReplyTextContains(search)](#ResponseAssert_AnyResponseAssert_quickReplyTextContains) ⇒ <code>this</code>
        * [.AnyResponseAssert#templateType(type)](#ResponseAssert_AnyResponseAssert_templateType) ⇒ <code>this</code>
        * [.AnyResponseAssert#genericTemplate(itemCount)](#ResponseAssert_AnyResponseAssert_genericTemplate)
        * [.AnyResponseAssert#buttonTemplate(search, buttonCount)](#ResponseAssert_AnyResponseAssert_buttonTemplate)
        * [.AnyResponseAssert#passThread([appId])](#ResponseAssert_AnyResponseAssert_passThread) ⇒ <code>this</code>
        * [.AnyResponseAssert#attachmentType(type)](#ResponseAssert_AnyResponseAssert_attachmentType) ⇒ <code>this</code>

{% raw %}<div id="new_ResponseAssert_new">&nbsp;</div>{% endraw %}

### new ResponseAssert()
Utility for asserting single response

{% raw %}<div id="ResponseAssert_contains">&nbsp;</div>{% endraw %}

### responseAssert.contains(search) ⇒ <code>this</code>
Checks, that response contains text

**Kind**: instance method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- search <code>string</code>

{% raw %}<div id="ResponseAssert_quickReplyAction">&nbsp;</div>{% endraw %}

### responseAssert.quickReplyAction(action) ⇒ <code>this</code>
Checks quick response action

**Kind**: instance method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- action <code>string</code>

{% raw %}<div id="ResponseAssert_templateType">&nbsp;</div>{% endraw %}

### responseAssert.templateType(type) ⇒ <code>this</code>
Checks template type

**Kind**: instance method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- type <code>string</code>

{% raw %}<div id="ResponseAssert_passThread">&nbsp;</div>{% endraw %}

### responseAssert.passThread([appId]) ⇒ <code>this</code>
Checks pass thread control

**Kind**: instance method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- [appId] <code>string</code> <code> = null</code>

{% raw %}<div id="ResponseAssert_attachmentType">&nbsp;</div>{% endraw %}

### responseAssert.attachmentType(type) ⇒ <code>this</code>
Checks attachment type

**Kind**: instance method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- type <code>string</code>

{% raw %}<div id="ResponseAssert_AnyResponseAssert_contains">&nbsp;</div>{% endraw %}

### ResponseAssert.AnyResponseAssert#contains(search) ⇒ <code>this</code>
Checks, that response contains text

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- search <code>string</code>

{% raw %}<div id="ResponseAssert_AnyResponseAssert_quickReplyAction">&nbsp;</div>{% endraw %}

### ResponseAssert.AnyResponseAssert#quickReplyAction(action) ⇒ <code>this</code>
Checks quick response action

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- action <code>string</code>

{% raw %}<div id="ResponseAssert_AnyResponseAssert_quickReplyTextContains">&nbsp;</div>{% endraw %}

### ResponseAssert.AnyResponseAssert#quickReplyTextContains(search) ⇒ <code>this</code>
Checks quick response text

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- search <code>string</code>

{% raw %}<div id="ResponseAssert_AnyResponseAssert_templateType">&nbsp;</div>{% endraw %}

### ResponseAssert.AnyResponseAssert#templateType(type) ⇒ <code>this</code>
Checks template type

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- type <code>string</code>

{% raw %}<div id="ResponseAssert_AnyResponseAssert_genericTemplate">&nbsp;</div>{% endraw %}

### ResponseAssert.AnyResponseAssert#genericTemplate(itemCount)
Checks for generic template

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- itemCount <code>number</code> <code> = </code> - specified item count

{% raw %}<div id="ResponseAssert_AnyResponseAssert_buttonTemplate">&nbsp;</div>{% endraw %}

### ResponseAssert.AnyResponseAssert#buttonTemplate(search, buttonCount)
Checks for button template

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- search <code>string</code>
- buttonCount <code>number</code> <code> = </code> - specified button count

{% raw %}<div id="ResponseAssert_AnyResponseAssert_passThread">&nbsp;</div>{% endraw %}

### ResponseAssert.AnyResponseAssert#passThread([appId]) ⇒ <code>this</code>
Checks pass thread control

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- [appId] <code>string</code> <code> = null</code>

{% raw %}<div id="ResponseAssert_AnyResponseAssert_attachmentType">&nbsp;</div>{% endraw %}

### ResponseAssert.AnyResponseAssert#attachmentType(type) ⇒ <code>this</code>
Checks attachment type

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  
**Params**

- type <code>string</code>

{% raw %}<div id="AnyResponseAssert">&nbsp;</div>{% endraw %}

## AnyResponseAssert
**Kind**: global class  
{% raw %}<div id="new_AnyResponseAssert_new">&nbsp;</div>{% endraw %}

### new AnyResponseAssert()
Utility for searching among responses

{% raw %}<div id="ConversationTester">&nbsp;</div>{% endraw %}

## ConversationTester
Automated Conversation tests runner

**Kind**: global class  

* [ConversationTester](#ConversationTester)
    * [new ConversationTester(testsSource, botFactory, [options])](#new_ConversationTester_new)
    * [.test(validationRequestBody, step)](#ConversationTester_test) ⇒ [<code>Promise.&lt;TestsOutput&gt;</code>](#TestsOutput)
    * [._getLists(testCases)](#ConversationTester__getLists) ⇒ [<code>Array.&lt;List&gt;</code>](#List)
    * [._getListCases(testCases)](#ConversationTester__getListCases) ⇒ <code>Map.&lt;string, (Array.&lt;TestCase&gt;\|Array.&lt;TextCase&gt;)&gt;</code>
    * [._getGroups(testCases)](#ConversationTester__getGroups) ⇒ [<code>Array.&lt;TestsGroup&gt;</code>](#TestsGroup)
    * [._getTestsGroups(testsGroups, step)](#ConversationTester__getTestsGroups)
    * [._createTester(testsGroup, [botconfig])](#ConversationTester__createTester) ⇒ [<code>Tester</code>](#Tester)
    * [._runTextCaseTests(testsGroup, botconfig)](#ConversationTester__runTextCaseTests)
    * [._runStepCaseTests(testsGroup, botconfig)](#ConversationTester__runStepCaseTests)
    * [.executeTextCase(testsGroup, t, textCase, botconfig, longestText)](#ConversationTester_executeTextCase)
    * [.executeStep(t, step)](#ConversationTester_executeStep)

{% raw %}<div id="new_ConversationTester_new">&nbsp;</div>{% endraw %}

### new ConversationTester(testsSource, botFactory, [options])
**Params**

- testsSource [<code>TestSource</code>](#TestSource)
- botFactory <code>function</code>
- [options] <code>object</code>
    - [.disableAssertActions] <code>boolean</code>
    - [.disableAssertTexts] <code>boolean</code>
    - [.disableAssertQuickReplies] <code>boolean</code>
    - [.useConversationForTextTestCases] <code>boolean</code>
    - [.textThreshold] <code>boolean</code>
    - [.stepCasesPerStep] <code>number</code>
    - [.textCasesPerStep] <code>number</code>
    - [.textCaseParallel] <code>number</code>
    - [.testerFactory] [<code>testerFactory</code>](#testerFactory)

{% raw %}<div id="ConversationTester_test">&nbsp;</div>{% endraw %}

### conversationTester.test(validationRequestBody, step) ⇒ [<code>Promise.&lt;TestsOutput&gt;</code>](#TestsOutput)
Runs the conversation test

**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  
**Params**

- validationRequestBody <code>object</code> <code> = </code>
- step <code>number</code> <code> = </code>

{% raw %}<div id="ConversationTester__getLists">&nbsp;</div>{% endraw %}

### conversationTester.\_getLists(testCases) ⇒ [<code>Array.&lt;List&gt;</code>](#List)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  
**Params**

- testCases [<code>Array.&lt;TestCase&gt;</code>](#TestCase) | [<code>Array.&lt;TextCase&gt;</code>](#TextCase)

{% raw %}<div id="ConversationTester__getListCases">&nbsp;</div>{% endraw %}

### conversationTester.\_getListCases(testCases) ⇒ <code>Map.&lt;string, (Array.&lt;TestCase&gt;\|Array.&lt;TextCase&gt;)&gt;</code>
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  
**Params**

- testCases [<code>Array.&lt;TestCase&gt;</code>](#TestCase) | [<code>Array.&lt;TextCase&gt;</code>](#TextCase)

{% raw %}<div id="ConversationTester__getGroups">&nbsp;</div>{% endraw %}

### conversationTester.\_getGroups(testCases) ⇒ [<code>Array.&lt;TestsGroup&gt;</code>](#TestsGroup)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  
**Params**

- testCases <code>\*</code>

{% raw %}<div id="ConversationTester__getTestsGroups">&nbsp;</div>{% endraw %}

### conversationTester.\_getTestsGroups(testsGroups, step)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  
**Params**

- testsGroups [<code>Array.&lt;TestsGroup&gt;</code>](#TestsGroup)
- step <code>number</code>

{% raw %}<div id="ConversationTester__createTester">&nbsp;</div>{% endraw %}

### conversationTester.\_createTester(testsGroup, [botconfig]) ⇒ [<code>Tester</code>](#Tester)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  
**Params**

- testsGroup [<code>TestsGroup</code>](#TestsGroup)
- [botconfig] <code>object</code> <code> = </code>

{% raw %}<div id="ConversationTester__runTextCaseTests">&nbsp;</div>{% endraw %}

### conversationTester.\_runTextCaseTests(testsGroup, botconfig)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  
**Params**

- testsGroup [<code>TestsGroup</code>](#TestsGroup)
- botconfig <code>object</code> <code> = </code>

{% raw %}<div id="ConversationTester__runStepCaseTests">&nbsp;</div>{% endraw %}

### conversationTester.\_runStepCaseTests(testsGroup, botconfig)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  
**Params**

- testsGroup [<code>TestsGroup</code>](#TestsGroup)
- botconfig <code>object</code> <code> = </code>

{% raw %}<div id="ConversationTester_executeTextCase">&nbsp;</div>{% endraw %}

### conversationTester.executeTextCase(testsGroup, t, textCase, botconfig, longestText)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  
**Params**

- testsGroup [<code>TestsGroup</code>](#TestsGroup)
- t [<code>Tester</code>](#Tester)
- textCase [<code>TextTest</code>](#TextTest)
- botconfig <code>\*</code>
- longestText <code>number</code>

{% raw %}<div id="ConversationTester_executeStep">&nbsp;</div>{% endraw %}

### conversationTester.executeStep(t, step)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  
**Params**

- t [<code>Tester</code>](#Tester)
- step [<code>TestCaseStep</code>](#TestCaseStep)

{% raw %}<div id="TestSource">&nbsp;</div>{% endraw %}

## TestSource : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| getTestCases | <code>function</code> | 

{% raw %}<div id="TestCase">&nbsp;</div>{% endraw %}

## TestCase : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| list | <code>string</code> | 
| name | <code>string</code> | 
| steps | [<code>Array.&lt;TestCaseStep&gt;</code>](#TestCaseStep) | 

{% raw %}<div id="TextCase">&nbsp;</div>{% endraw %}

## TextCase : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| list | <code>string</code> | 
| name | <code>string</code> | 
| texts | [<code>Array.&lt;TextTest&gt;</code>](#TextTest) | 

{% raw %}<div id="TextTest">&nbsp;</div>{% endraw %}

## TextTest : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| appId | <code>string</code> | 
| text | <code>string</code> | 
| action | <code>string</code> | 
| intent | <code>string</code> | 

{% raw %}<div id="TestCaseStep">&nbsp;</div>{% endraw %}

## TestCaseStep : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| step | <code>number</code> | 
| rowNum | <code>number</code> | 
| action | <code>string</code> | 
| passedAction | <code>string</code> | 
| textContains | <code>string</code> | 
| quickRepliesContains | <code>string</code> | 
| stepDescription | <code>string</code> | 

{% raw %}<div id="TestsGroup">&nbsp;</div>{% endraw %}

## TestsGroup : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| listId | <code>number</code> | 
| list | <code>string</code> | 
| type | <code>string</code> | 
| testCases | [<code>Array.&lt;TestCase&gt;</code>](#TestCase) \| [<code>Array.&lt;TextTest&gt;</code>](#TextTest) | 

{% raw %}<div id="List">&nbsp;</div>{% endraw %}

## List : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| id | <code>number</code> | 
| name | <code>string</code> | 
| type | <code>string</code> | 
| testCases | [<code>Array.&lt;TestCase&gt;</code>](#TestCase) \| [<code>Array.&lt;TextTest&gt;</code>](#TextTest) | 

{% raw %}<div id="TestsDefinition">&nbsp;</div>{% endraw %}

## TestsDefinition : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| lists | [<code>Array.&lt;List&gt;</code>](#List) | 

{% raw %}<div id="testerFactory">&nbsp;</div>{% endraw %}

## testerFactory ⇒ [<code>Tester</code>](#Tester)
Callback for getting a tester

**Kind**: global typedef  
**Params**

- bot <code>Router</code> | <code>ReducerWrapper</code> - the chatbot itself
- test [<code>TestsGroup</code>](#TestsGroup) - the chatbot itself

{% raw %}<div id="TestsOutput">&nbsp;</div>{% endraw %}

## TestsOutput : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| total | <code>number</code> | 
| passed | <code>number</code> | 
| failed | <code>number</code> | 
| skipped | <code>number</code> | 
| output | <code>string</code> | 
| summaryOutput | <code>string</code> | 
| step | <code>number</code> | 
| stepCount | <code>number</code> | 

