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

<div id="Tester">&nbsp;</div>

## Tester
**Kind**: global class  

* [Tester](#Tester)
    * [new Tester()](#new_Tester_new)
    * _instance_
        * [.processor](#Tester_processor) : <code>Processor</code>
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

<div id="new_Tester_new">&nbsp;</div>

### new Tester()
Utility for testing requests

<div id="Tester_processor">&nbsp;</div>

### tester.processor : <code>Processor</code>
**Kind**: instance property of [<code>Tester</code>](#Tester)  
<div id="Tester_testData">&nbsp;</div>

### tester.testData
**Kind**: instance property of [<code>Tester</code>](#Tester)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| predefined | <code>object</code> | test data to use |

<div id="Tester_allowEmptyResponse">&nbsp;</div>

### tester.allowEmptyResponse
**Kind**: instance property of [<code>Tester</code>](#Tester)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| allow | <code>boolean</code> | tester to process empty responses |

<div id="Tester_senderLogger">&nbsp;</div>

### tester.senderLogger
**Kind**: instance property of [<code>Tester</code>](#Tester)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| use | <code>console</code> | own loggger |

<div id="Tester_setExpandRandomTexts">&nbsp;</div>

### tester.setExpandRandomTexts()
Enable tester to expand random texts
It joins them into a single sting

**Kind**: instance method of [<code>Tester</code>](#Tester)  
<div id="Tester_cleanup">&nbsp;</div>

### tester.cleanup()
Clear acquired responses and data

**Kind**: instance method of [<code>Tester</code>](#Tester)  
<div id="Tester_processMessage">&nbsp;</div>

### tester.processMessage(message, senderId, pageId) ⇒ <code>Promise.&lt;any&gt;</code>
Use tester as a connector :)

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>object</code> | wingbot chat event |
| senderId | <code>string</code> | chat event sender identifier |
| pageId | <code>string</code> | channel/page identifier |

<div id="Tester_res">&nbsp;</div>

### tester.res([index]) ⇒ [<code>ResponseAssert</code>](#ResponseAssert)
Returns single response asserter

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [index] | <code>number</code> | <code>0</code> | response index |

<div id="Tester_any">&nbsp;</div>

### tester.any() ⇒ [<code>AnyResponseAssert</code>](#AnyResponseAssert)
Returns any response asserter

**Kind**: instance method of [<code>Tester</code>](#Tester)  
<div id="Tester_lastRes">&nbsp;</div>

### tester.lastRes() ⇒ [<code>ResponseAssert</code>](#ResponseAssert)
Returns last response asserter

**Kind**: instance method of [<code>Tester</code>](#Tester)  
<div id="Tester_passedAction">&nbsp;</div>

### tester.passedAction(path) ⇒ <code>this</code>
Checks, that app past the action

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type |
| --- | --- |
| path | <code>string</code> | 

<div id="Tester_respondedWithBlock">&nbsp;</div>

### tester.respondedWithBlock(blockName) ⇒ <code>this</code>
Checks, that a plugin used a block as a responde

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type |
| --- | --- |
| blockName | <code>string</code> | 

<div id="Tester_getState">&nbsp;</div>

### tester.getState() ⇒ <code>object</code>
Returns state

**Kind**: instance method of [<code>Tester</code>](#Tester)  
<div id="Tester_setState">&nbsp;</div>

### tester.setState([state])
Sets state with `Object.assign()`

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type | Default |
| --- | --- | --- |
| [state] | <code>object</code> | <code>{}</code> | 

<div id="Tester_text">&nbsp;</div>

### tester.text(text) ⇒ <code>Promise</code>
Makes text request

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type |
| --- | --- |
| text | <code>string</code> | 

<div id="Tester_intent">&nbsp;</div>

### tester.intent(intent, [text], [score]) ⇒ <code>Promise</code>
Makes recognised AI intent request

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type | Default |
| --- | --- | --- |
| intent | <code>string</code> \| <code>Array.&lt;string&gt;</code> |  | 
| [text] | <code>string</code> | <code>null</code> | 
| [score] | <code>number</code> |  | 

<div id="Tester_intentWithEntity">&nbsp;</div>

### tester.intentWithEntity(intent, entity, [value], [text], [score]) ⇒ <code>Promise</code>
Makes recognised AI intent request with entity

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type | Default |
| --- | --- | --- |
| intent | <code>string</code> |  | 
| entity | <code>string</code> |  | 
| [value] | <code>string</code> |  | 
| [text] | <code>string</code> |  | 
| [score] | <code>number</code> | <code>1</code> | 

<div id="Tester_optin">&nbsp;</div>

### tester.optin(action, [data], [userRef]) ⇒ <code>Promise</code>
Make optin call

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| action | <code>string</code> |  |  |
| [data] | <code>object</code> | <code>{}</code> |  |
| [userRef] | <code>string</code> | <code>null</code> | specific ref string |

<div id="Tester_quickReply">&nbsp;</div>

### tester.quickReply(action, [data]) ⇒ <code>Promise</code>
Send quick reply

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type | Default |
| --- | --- | --- |
| action | <code>string</code> |  | 
| [data] | <code>object</code> | <code>{}</code> | 

<div id="Tester_quickReplyText">&nbsp;</div>

### tester.quickReplyText(text) ⇒ <code>Promise.&lt;boolean&gt;</code>
Send quick reply if text exactly matches, otherwise returns false

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type |
| --- | --- |
| text | <code>string</code> | 

<div id="Tester_postBack">&nbsp;</div>

### tester.postBack(action, [data], [refAction], [refData]) ⇒ <code>Promise</code>
Sends postback, optionally with referrer action

**Kind**: instance method of [<code>Tester</code>](#Tester)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| action | <code>string</code> |  |  |
| [data] | <code>object</code> | <code>{}</code> |  |
| [refAction] | <code>string</code> | <code>null</code> | referred action |
| [refData] | <code>object</code> | <code>{}</code> | referred action data |

<div id="Tester_Tester">&nbsp;</div>

### Tester.Tester
**Kind**: static class of [<code>Tester</code>](#Tester)  
<div id="new_Tester_Tester_new">&nbsp;</div>

#### new Tester(reducer, [senderId], [pageId], [processorOptions], [storage])
Creates an instance of Tester.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| reducer | <code>Router</code> \| <code>ReducerWrapper</code> \| <code>function</code> |  |  |
| [senderId] | <code>string</code> | <code>null</code> |  |
| [pageId] | <code>string</code> | <code>null</code> |  |
| [processorOptions] | <code>object</code> | <code>{}</code> | options for Processor |
| [storage] | <code>MemoryStateStorage</code> |  | place to override the storage |

<div id="ResponseAssert">&nbsp;</div>

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
        * [.AnyResponseAssert#notContains(search)](#ResponseAssert_AnyResponseAssert_notContains) ⇒ <code>this</code>
        * [.AnyResponseAssert#quickReplyAction(action)](#ResponseAssert_AnyResponseAssert_quickReplyAction) ⇒ <code>this</code>
        * [.AnyResponseAssert#quickReplyTextContains(search)](#ResponseAssert_AnyResponseAssert_quickReplyTextContains) ⇒ <code>this</code>
        * [.AnyResponseAssert#templateType(type)](#ResponseAssert_AnyResponseAssert_templateType) ⇒ <code>this</code>
        * [.AnyResponseAssert#genericTemplate(itemCount)](#ResponseAssert_AnyResponseAssert_genericTemplate)
        * [.AnyResponseAssert#buttonTemplate(search, buttonCount)](#ResponseAssert_AnyResponseAssert_buttonTemplate)
        * [.AnyResponseAssert#passThread([appId])](#ResponseAssert_AnyResponseAssert_passThread) ⇒ <code>this</code>
        * [.AnyResponseAssert#attachmentType(type)](#ResponseAssert_AnyResponseAssert_attachmentType) ⇒ <code>this</code>

<div id="new_ResponseAssert_new">&nbsp;</div>

### new ResponseAssert()
Utility for asserting single response

<div id="ResponseAssert_contains">&nbsp;</div>

### responseAssert.contains(search) ⇒ <code>this</code>
Checks, that response contains text

**Kind**: instance method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type |
| --- | --- |
| search | <code>string</code> | 

<div id="ResponseAssert_quickReplyAction">&nbsp;</div>

### responseAssert.quickReplyAction(action) ⇒ <code>this</code>
Checks quick response action

**Kind**: instance method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type |
| --- | --- |
| action | <code>string</code> | 

<div id="ResponseAssert_templateType">&nbsp;</div>

### responseAssert.templateType(type) ⇒ <code>this</code>
Checks template type

**Kind**: instance method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 

<div id="ResponseAssert_passThread">&nbsp;</div>

### responseAssert.passThread([appId]) ⇒ <code>this</code>
Checks pass thread control

**Kind**: instance method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type | Default |
| --- | --- | --- |
| [appId] | <code>string</code> | <code>null</code> | 

<div id="ResponseAssert_attachmentType">&nbsp;</div>

### responseAssert.attachmentType(type) ⇒ <code>this</code>
Checks attachment type

**Kind**: instance method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 

<div id="ResponseAssert_AnyResponseAssert_contains">&nbsp;</div>

### ResponseAssert.AnyResponseAssert#contains(search) ⇒ <code>this</code>
Checks, that response contains a text

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type |
| --- | --- |
| search | <code>string</code> | 

<div id="ResponseAssert_AnyResponseAssert_notContains">&nbsp;</div>

### ResponseAssert.AnyResponseAssert#notContains(search) ⇒ <code>this</code>
Checks, that response does NOT contain a text

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type |
| --- | --- |
| search | <code>string</code> | 

<div id="ResponseAssert_AnyResponseAssert_quickReplyAction">&nbsp;</div>

### ResponseAssert.AnyResponseAssert#quickReplyAction(action) ⇒ <code>this</code>
Checks quick response action

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type |
| --- | --- |
| action | <code>string</code> | 

<div id="ResponseAssert_AnyResponseAssert_quickReplyTextContains">&nbsp;</div>

### ResponseAssert.AnyResponseAssert#quickReplyTextContains(search) ⇒ <code>this</code>
Checks quick response text

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type |
| --- | --- |
| search | <code>string</code> | 

<div id="ResponseAssert_AnyResponseAssert_templateType">&nbsp;</div>

### ResponseAssert.AnyResponseAssert#templateType(type) ⇒ <code>this</code>
Checks template type

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 

<div id="ResponseAssert_AnyResponseAssert_genericTemplate">&nbsp;</div>

### ResponseAssert.AnyResponseAssert#genericTemplate(itemCount)
Checks for generic template

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| itemCount | <code>number</code> | <code></code> | specified item count |

<div id="ResponseAssert_AnyResponseAssert_buttonTemplate">&nbsp;</div>

### ResponseAssert.AnyResponseAssert#buttonTemplate(search, buttonCount)
Checks for button template

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| search | <code>string</code> |  |  |
| buttonCount | <code>number</code> | <code></code> | specified button count |

<div id="ResponseAssert_AnyResponseAssert_passThread">&nbsp;</div>

### ResponseAssert.AnyResponseAssert#passThread([appId]) ⇒ <code>this</code>
Checks pass thread control

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type | Default |
| --- | --- | --- |
| [appId] | <code>string</code> | <code>null</code> | 

<div id="ResponseAssert_AnyResponseAssert_attachmentType">&nbsp;</div>

### ResponseAssert.AnyResponseAssert#attachmentType(type) ⇒ <code>this</code>
Checks attachment type

**Kind**: static method of [<code>ResponseAssert</code>](#ResponseAssert)  

| Param | Type |
| --- | --- |
| type | <code>string</code> | 

<div id="AnyResponseAssert">&nbsp;</div>

## AnyResponseAssert
**Kind**: global class  
<div id="new_AnyResponseAssert_new">&nbsp;</div>

### new AnyResponseAssert()
Utility for searching among responses

<div id="ConversationTester">&nbsp;</div>

## ConversationTester
Automated Conversation tests runner

**Kind**: global class  

* [ConversationTester](#ConversationTester)
    * [new ConversationTester(testsSource, botFactory, [options])](#new_ConversationTester_new)
    * [._getTestCases(lang)](#ConversationTester__getTestCases) ⇒ [<code>Promise.&lt;TestsDefinition&gt;</code>](#TestsDefinition)
    * [.test(validationRequestBody, [step], [lang])](#ConversationTester_test) ⇒ [<code>Promise.&lt;TestsOutput&gt;</code>](#TestsOutput)
    * [._getLists(testCases)](#ConversationTester__getLists) ⇒ [<code>Array.&lt;List&gt;</code>](#List)
    * [._getListCases(testCases)](#ConversationTester__getListCases) ⇒ <code>Map.&lt;string, (Array.&lt;TestCase&gt;\|Array.&lt;TextCase&gt;)&gt;</code>
    * [._getGroups(testCases)](#ConversationTester__getGroups) ⇒ [<code>Array.&lt;TestsGroup&gt;</code>](#TestsGroup)
    * [._getTestsGroups(testsGroups, step)](#ConversationTester__getTestsGroups)
    * [._createTester(testsGroup, [botconfig], [lang])](#ConversationTester__createTester) ⇒ [<code>Tester</code>](#Tester)
    * [._runTextCaseTests(testsGroup, botconfig, [lang])](#ConversationTester__runTextCaseTests)
    * [._runStepCaseTests(testsGroup, botconfig, [lang])](#ConversationTester__runStepCaseTests)
    * [.executeTextCase(testsGroup, t, textCase, botconfig, longestText, [lang])](#ConversationTester_executeTextCase)
    * [.executeStep(t, step)](#ConversationTester_executeStep)

<div id="new_ConversationTester_new">&nbsp;</div>

### new ConversationTester(testsSource, botFactory, [options])

| Param | Type | Description |
| --- | --- | --- |
| testsSource | [<code>TestSource</code>](#TestSource) \| <code>Object.&lt;string, TestSource&gt;</code> | single source or localized list |
| botFactory | <code>function</code> |  |
| [options] | <code>object</code> |  |
| [options.disableAssertActions] | <code>boolean</code> |  |
| [options.disableAssertTexts] | <code>boolean</code> |  |
| [options.disableAssertQuickReplies] | <code>boolean</code> |  |
| [options.useConversationForTextTestCases] | <code>boolean</code> |  |
| [options.textThreshold] | <code>boolean</code> |  |
| [options.stepCasesPerStep] | <code>number</code> |  |
| [options.textCasesPerStep] | <code>number</code> |  |
| [options.textCaseParallel] | <code>number</code> |  |
| [options.testerFactory] | [<code>testerFactory</code>](#testerFactory) |  |

<div id="ConversationTester__getTestCases">&nbsp;</div>

### conversationTester.\_getTestCases(lang) ⇒ [<code>Promise.&lt;TestsDefinition&gt;</code>](#TestsDefinition)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type |
| --- | --- |
| lang | <code>string</code> | 

<div id="ConversationTester_test">&nbsp;</div>

### conversationTester.test(validationRequestBody, [step], [lang]) ⇒ [<code>Promise.&lt;TestsOutput&gt;</code>](#TestsOutput)
Runs the conversation test

**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type | Default |
| --- | --- | --- |
| validationRequestBody | <code>object</code> | <code></code> | 
| [step] | <code>number</code> | <code></code> | 
| [lang] | <code>string</code> | <code>null</code> | 

<div id="ConversationTester__getLists">&nbsp;</div>

### conversationTester.\_getLists(testCases) ⇒ [<code>Array.&lt;List&gt;</code>](#List)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type |
| --- | --- |
| testCases | [<code>Array.&lt;TestCase&gt;</code>](#TestCase) \| [<code>Array.&lt;TextCase&gt;</code>](#TextCase) | 

<div id="ConversationTester__getListCases">&nbsp;</div>

### conversationTester.\_getListCases(testCases) ⇒ <code>Map.&lt;string, (Array.&lt;TestCase&gt;\|Array.&lt;TextCase&gt;)&gt;</code>
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type |
| --- | --- |
| testCases | [<code>Array.&lt;TestCase&gt;</code>](#TestCase) \| [<code>Array.&lt;TextCase&gt;</code>](#TextCase) | 

<div id="ConversationTester__getGroups">&nbsp;</div>

### conversationTester.\_getGroups(testCases) ⇒ [<code>Array.&lt;TestsGroup&gt;</code>](#TestsGroup)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type |
| --- | --- |
| testCases | <code>\*</code> | 

<div id="ConversationTester__getTestsGroups">&nbsp;</div>

### conversationTester.\_getTestsGroups(testsGroups, step)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type |
| --- | --- |
| testsGroups | [<code>Array.&lt;TestsGroup&gt;</code>](#TestsGroup) | 
| step | <code>number</code> | 

<div id="ConversationTester__createTester">&nbsp;</div>

### conversationTester.\_createTester(testsGroup, [botconfig], [lang]) ⇒ [<code>Tester</code>](#Tester)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type | Default |
| --- | --- | --- |
| testsGroup | [<code>TestsGroup</code>](#TestsGroup) |  | 
| [botconfig] | <code>object</code> | <code></code> | 
| [lang] | <code>string</code> | <code>null</code> | 

<div id="ConversationTester__runTextCaseTests">&nbsp;</div>

### conversationTester.\_runTextCaseTests(testsGroup, botconfig, [lang])
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type | Default |
| --- | --- | --- |
| testsGroup | [<code>TestsGroup</code>](#TestsGroup) |  | 
| botconfig | <code>object</code> | <code></code> | 
| [lang] | <code>string</code> | <code>null</code> | 

<div id="ConversationTester__runStepCaseTests">&nbsp;</div>

### conversationTester.\_runStepCaseTests(testsGroup, botconfig, [lang])
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type | Default |
| --- | --- | --- |
| testsGroup | [<code>TestsGroup</code>](#TestsGroup) |  | 
| botconfig | <code>object</code> | <code></code> | 
| [lang] | <code>string</code> | <code>null</code> | 

<div id="ConversationTester_executeTextCase">&nbsp;</div>

### conversationTester.executeTextCase(testsGroup, t, textCase, botconfig, longestText, [lang])
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type | Default |
| --- | --- | --- |
| testsGroup | [<code>TestsGroup</code>](#TestsGroup) |  | 
| t | [<code>Tester</code>](#Tester) |  | 
| textCase | [<code>TextTest</code>](#TextTest) |  | 
| botconfig | <code>\*</code> |  | 
| longestText | <code>number</code> |  | 
| [lang] | <code>string</code> | <code>null</code> | 

<div id="ConversationTester_executeStep">&nbsp;</div>

### conversationTester.executeStep(t, step)
**Kind**: instance method of [<code>ConversationTester</code>](#ConversationTester)  

| Param | Type |
| --- | --- |
| t | [<code>Tester</code>](#Tester) | 
| step | [<code>TestCaseStep</code>](#TestCaseStep) | 

<div id="TestSource">&nbsp;</div>

## TestSource : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| getTestCases | <code>function</code> | 

<div id="TestCase">&nbsp;</div>

## TestCase : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| list | <code>string</code> | 
| name | <code>string</code> | 
| steps | [<code>Array.&lt;TestCaseStep&gt;</code>](#TestCaseStep) | 

<div id="TextCase">&nbsp;</div>

## TextCase : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| list | <code>string</code> | 
| name | <code>string</code> | 
| texts | [<code>Array.&lt;TextTest&gt;</code>](#TextTest) | 

<div id="TextTest">&nbsp;</div>

## TextTest : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| appId | <code>string</code> | 
| text | <code>string</code> | 
| action | <code>string</code> | 
| intent | <code>string</code> | 

<div id="TestCaseStep">&nbsp;</div>

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

<div id="TestsGroup">&nbsp;</div>

## TestsGroup : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| listId | <code>number</code> | 
| list | <code>string</code> | 
| type | <code>string</code> | 
| testCases | [<code>Array.&lt;TestCase&gt;</code>](#TestCase) \| [<code>Array.&lt;TextTest&gt;</code>](#TextTest) | 

<div id="List">&nbsp;</div>

## List : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| id | <code>number</code> | 
| name | <code>string</code> | 
| type | <code>string</code> | 
| testCases | [<code>Array.&lt;TestCase&gt;</code>](#TestCase) \| [<code>Array.&lt;TextTest&gt;</code>](#TextTest) | 

<div id="TestsDefinition">&nbsp;</div>

## TestsDefinition : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| lists | [<code>Array.&lt;List&gt;</code>](#List) | 

<div id="testerFactory">&nbsp;</div>

## testerFactory ⇒ [<code>Tester</code>](#Tester)
Callback for getting a tester

**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| bot | <code>Router</code> \| <code>ReducerWrapper</code> | the chatbot itself |
| test | [<code>TestsGroup</code>](#TestsGroup) | the chatbot itself |

<div id="TestsOutput">&nbsp;</div>

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

