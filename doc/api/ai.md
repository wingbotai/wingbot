## Classes

<dl>
<dt><a href="#Ai">Ai</a></dt>
<dd></dd>
<dt><a href="#CustomEntityDetectionModel">CustomEntityDetectionModel</a></dt>
<dd></dd>
<dt><a href="#WingbotModel">WingbotModel</a></dt>
<dd></dd>
<dt><a href="#CachedModel">CachedModel</a></dt>
<dd></dd>
<dt><a href="#AiMatching">AiMatching</a></dt>
<dd><p>{AiMatching}</p>
<p>Class responsible for NLP Routing by score</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#handlebars">handlebars</a> : <code>Handlebars</code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#EntityExpression">EntityExpression</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#textFilter">textFilter</a> ⇒ <code>string</code></dt>
<dd><p>Text filter function</p>
</dd>
<dt><a href="#IntentRule">IntentRule</a> : <code>string</code> | <code><a href="#EntityExpression">EntityExpression</a></code></dt>
<dd></dd>
<dt><a href="#BotPath">BotPath</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#DetectedEntity">DetectedEntity</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#EntityDetector">EntityDetector</a> ⇒ <code><a href="#DetectedEntity">Array.&lt;DetectedEntity&gt;</a></code> | <code><a href="#DetectedEntity">DetectedEntity</a></code> | <code><a href="#DetectedEntity">Promise.&lt;DetectedEntity&gt;</a></code> | <code>Promise.&lt;Array.&lt;DetectedEntity&gt;&gt;</code></dt>
<dd></dd>
<dt><a href="#ValueExtractor">ValueExtractor</a> ⇒ <code>*</code></dt>
<dd></dd>
<dt><a href="#Entity">Entity</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Intent">Intent</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Result">Result</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Phrases">Phrases</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Entity">Entity</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Intent">Intent</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Result">Result</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Entity">Entity</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Intent">Intent</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Result">Result</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Compare">Compare</a> : <code>string</code></dt>
<dd></dd>
<dt><a href="#Entity">Entity</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Intent">Intent</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Comparable">Comparable</a> : <code>string</code> | <code>number</code> | <code>function</code></dt>
<dd></dd>
<dt><a href="#EntityExpression">EntityExpression</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#IntentRule">IntentRule</a> : <code>string</code> | <code><a href="#EntityExpression">EntityExpression</a></code></dt>
<dd></dd>
<dt><a href="#RegexpComparator">RegexpComparator</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#PreprocessorOutput">PreprocessorOutput</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#AIRequest">AIRequest</a> : <code>object</code></dt>
<dd></dd>
</dl>

<div id="Ai">&nbsp;</div>

## Ai
**Kind**: global class  

* [Ai](#Ai)
    * [.confidence](#Ai_confidence) : <code>number</code>
    * [.threshold](#Ai_threshold) : <code>number</code>
    * [.sttMaxAlternatives](#Ai_sttMaxAlternatives) : <code>number</code>
    * [.sttScoreThreshold](#Ai_sttScoreThreshold) : <code>number</code>
    * [.logger](#Ai_logger) : <code>object</code>
    * [.matcher](#Ai_matcher) : [<code>AiMatching</code>](#AiMatching)
    * [.getPrefix(defaultModel, req)](#Ai_getPrefix)
    * [.textFilter(text)](#Ai_textFilter) : [<code>textFilter</code>](#textFilter)
    * [.mockIntent([intent], [score])](#Ai_mockIntent) ⇒ <code>this</code>
    * [.register(model, prefix)](#Ai_register) ⇒ [<code>WingbotModel</code>](#WingbotModel) \| <code>T</code>
    * [.deregister([prefix])](#Ai_deregister)
    * [.getModel(prefix)](#Ai_getModel) ⇒ [<code>WingbotModel</code>](#WingbotModel)
    * [.global(path, intents, [title], [meta])](#Ai_global) ⇒ <code>object</code>
    * [.local(path, intents, [title])](#Ai_local) ⇒ <code>object</code>
    * [.match(intent)](#Ai_match) ⇒ <code>function</code>
    * [.preloadAi(req)](#Ai_preloadAi) ⇒ <code>Promise</code>
    * [.getPhrases(req)](#Ai_getPhrases) ⇒ [<code>Promise.&lt;Phrases&gt;</code>](#Phrases)
    * [.shouldDisambiguate(aiActions, [forQuickReplies])](#Ai_shouldDisambiguate) ⇒ <code>boolean</code>

<div id="Ai_confidence">&nbsp;</div>

### ai.confidence : <code>number</code>
Upper threshold - for match method and for navigate method

**Kind**: instance property of [<code>Ai</code>](#Ai)  
<div id="Ai_threshold">&nbsp;</div>

### ai.threshold : <code>number</code>
Lower threshold - for disambiguation

**Kind**: instance property of [<code>Ai</code>](#Ai)  
<div id="Ai_sttMaxAlternatives">&nbsp;</div>

### ai.sttMaxAlternatives : <code>number</code>
Upper limit for NLP resolving of STT alternatives

**Kind**: instance property of [<code>Ai</code>](#Ai)  
<div id="Ai_sttScoreThreshold">&nbsp;</div>

### ai.sttScoreThreshold : <code>number</code>
Minimal score to consider text as recognized well

**Kind**: instance property of [<code>Ai</code>](#Ai)  
<div id="Ai_logger">&nbsp;</div>

### ai.logger : <code>object</code>
The logger (console by default)

**Kind**: instance property of [<code>Ai</code>](#Ai)  
<div id="Ai_matcher">&nbsp;</div>

### ai.matcher : [<code>AiMatching</code>](#AiMatching)
AI Score provider

**Kind**: instance property of [<code>Ai</code>](#Ai)  
<div id="Ai_getPrefix">&nbsp;</div>

### ai.getPrefix(defaultModel, req)
The prefix translator - for request-specific prefixes

**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type |
| --- | --- |
| defaultModel | <code>string</code> | 
| req | <code>Request</code> | 

<div id="Ai_textFilter">&nbsp;</div>

### ai.textFilter(text) : [<code>textFilter</code>](#textFilter)
Preprocess text for NLP
For example to remove any confidential data

**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type |
| --- | --- |
| text | <code>string</code> | 

<div id="Ai_mockIntent">&nbsp;</div>

### ai.mockIntent([intent], [score]) ⇒ <code>this</code>
Usefull method for testing AI routes

**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [intent] | <code>string</code> | <code>null</code> | intent name |
| [score] | <code>number</code> | <code></code> | the score of the top intent |

**Example**  
```js
const { Tester, ai, Route } = require('bontaut');

const bot = new Route();

bot.use(['intentAction', ai.localMatch('intentName')], (req, res) => {
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
<div id="Ai_register">&nbsp;</div>

### ai.register(model, prefix) ⇒ [<code>WingbotModel</code>](#WingbotModel) \| <code>T</code>
Registers Wingbot AI model

**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| model | <code>string</code> \| [<code>WingbotModel</code>](#WingbotModel) \| <code>T</code> |  | wingbot model name or AI plugin |
| prefix | <code>string</code> | <code>&quot;default&quot;</code> | model prefix |

<div id="Ai_deregister">&nbsp;</div>

### ai.deregister([prefix])
Remove registered model

**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type | Default |
| --- | --- | --- |
| [prefix] | <code>string</code> | <code>&quot;default&quot;</code> | 

<div id="Ai_getModel">&nbsp;</div>

### ai.getModel(prefix) ⇒ [<code>WingbotModel</code>](#WingbotModel)
Returns registered AI model

**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| prefix | <code>string</code> | <code>&quot;default&quot;</code> | model prefix |

<div id="Ai_global">&nbsp;</div>

### ai.global(path, intents, [title], [meta]) ⇒ <code>object</code>
Returns matching middleware, that will export the intent to the root router
so the intent will be matched in a global context

**Kind**: instance method of [<code>Ai</code>](#Ai)  
**Returns**: <code>object</code> - - the middleware  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  |  |
| intents | [<code>IntentRule</code>](#IntentRule) \| [<code>Array.&lt;IntentRule&gt;</code>](#IntentRule) |  |  |
| [title] | <code>string</code> | <code>null</code> | disambiguation title |
| [meta] | <code>object</code> |  | metadata for multibot environments |
| [meta.targetAppId] | <code>object</code> |  | target application id |
| [meta.targetAction] | <code>object</code> |  | target action |

**Example**  
```js
const { Router, ai } = require('wingbot');

ai.register('app-model');

bot.use(ai.global('route-path', 'intent1'), (req, res) => {
    console.log(req.intent(true)); // { intent: 'intent1', score: 0.9604 }

    res.text('Oh, intent 1 :)');
});
```
<div id="Ai_local">&nbsp;</div>

### ai.local(path, intents, [title]) ⇒ <code>object</code>
Returns matching middleware, that will export the intent to the root router
so the intent will be matched in a context of local dialogue

**Kind**: instance method of [<code>Ai</code>](#Ai)  
**Returns**: <code>object</code> - - the middleware  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  |  |
| intents | [<code>IntentRule</code>](#IntentRule) \| [<code>Array.&lt;IntentRule&gt;</code>](#IntentRule) |  |  |
| [title] | <code>string</code> | <code>null</code> | disambiguation title |

**Example**  
```js
const { Router, ai } = require('wingbot');

ai.register('app-model');

bot.use(ai.global('route-path', 'intent1'), (req, res) => {
    console.log(req.intent(true)); // { intent: 'intent1', score: 0.9604 }

    res.text('Oh, intent 1 :)');
});
```
<div id="Ai_match">&nbsp;</div>

### ai.match(intent) ⇒ <code>function</code>
Returns matching middleware

**supports:**

- intents (`'intentName'`)
- entities (`'@entity'`)
- entities with conditions (`'@entity=PRG,NYC'`)
- entities with conditions (`'@entity>=100'`)
- complex entities (`{ entity:'entity', op:'range', compare:[null,1000] }`)
- optional entities (`{ entity:'entity', optional: true }`)
- wildcard keywords (`'#keyword#'`)
- phrases (`'#first-phrase|second-phrase'`)
- emojis (`'#😄🙃😛'`)

**Kind**: instance method of [<code>Ai</code>](#Ai)  
**Returns**: <code>function</code> - - the middleware  

| Param | Type |
| --- | --- |
| intent | [<code>IntentRule</code>](#IntentRule) \| [<code>Array.&lt;IntentRule&gt;</code>](#IntentRule) | 

**Example**  
```js
const { Router, ai } = require('wingbot');

ai.register('app-model');

bot.use(ai.match('intent1'), (req, res) => {
    console.log(req.intent(true)); // { intent: 'intent1', score: 0.9604 }

    res.text('Oh, intent 1 :)');
});
```
<div id="Ai_preloadAi">&nbsp;</div>

### ai.preloadAi(req) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type |
| --- | --- |
| req | <code>Request</code> | 

<div id="Ai_getPhrases">&nbsp;</div>

### ai.getPhrases(req) ⇒ [<code>Promise.&lt;Phrases&gt;</code>](#Phrases)
Returns phrases model from AI

**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type |
| --- | --- |
| req | <code>Request</code> | 

<div id="Ai_shouldDisambiguate">&nbsp;</div>

### ai.shouldDisambiguate(aiActions, [forQuickReplies]) ⇒ <code>boolean</code>
**Kind**: instance method of [<code>Ai</code>](#Ai)  

| Param | Type | Default |
| --- | --- | --- |
| aiActions | <code>Array.&lt;IntentAction&gt;</code> |  | 
| [forQuickReplies] | <code>boolean</code> | <code>false</code> | 

<div id="CustomEntityDetectionModel">&nbsp;</div>

## CustomEntityDetectionModel
**Kind**: global class  

* [CustomEntityDetectionModel](#CustomEntityDetectionModel)
    * [new CustomEntityDetectionModel(options, [log])](#new_CustomEntityDetectionModel_new)
    * [.phrasesCacheTime](#CustomEntityDetectionModel_phrasesCacheTime) : <code>number</code>
    * [._normalizeResult(entities, entity, text, offset, originalText)](#CustomEntityDetectionModel__normalizeResult)
    * [._detectAllEntities(entity, text, entities, subWord)](#CustomEntityDetectionModel__detectAllEntities) ⇒ <code>Promise.&lt;Array.&lt;DetectedEntity&gt;&gt;</code>
    * [._detectEntities(entity, text, entities, subWord, detectSubWords)](#CustomEntityDetectionModel__detectEntities) ⇒ <code>Promise.&lt;Array.&lt;DetectedEntity&gt;&gt;</code>
    * [.nonOverlapping(entities, [expectedEntities])](#CustomEntityDetectionModel_nonOverlapping) ⇒ [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity)
    * [.getDependentEntities([known])](#CustomEntityDetectionModel_getDependentEntities) ⇒ <code>Array.&lt;string&gt;</code>
    * [.resolveEntities(text, [singleEntity], [expected], [prevEnts], [subWord])](#CustomEntityDetectionModel_resolveEntities) ⇒ <code>Promise.&lt;Array.&lt;DetectedEntity&gt;&gt;</code>
    * [.resolve(text, [req])](#CustomEntityDetectionModel_resolve) ⇒ [<code>Promise.&lt;Result&gt;</code>](#Result)
    * [._extractRegExpDependencies(regexp)](#CustomEntityDetectionModel__extractRegExpDependencies)
    * [._entityByDependency(entities, dependency)](#CustomEntityDetectionModel__entityByDependency) ⇒ [<code>DetectedEntity</code>](#DetectedEntity) \| <code>null</code>
    * [._regexpToDetector(regexp, [options])](#CustomEntityDetectionModel__regexpToDetector)
    * [.setEntityDetector(name, detector, [options])](#CustomEntityDetectionModel_setEntityDetector) ⇒ <code>this</code>

<div id="new_CustomEntityDetectionModel_new">&nbsp;</div>

### new CustomEntityDetectionModel(options, [log])

| Param | Type |
| --- | --- |
| options | <code>object</code> | 
| [log] | <code>Object</code> | 

<div id="CustomEntityDetectionModel_phrasesCacheTime">&nbsp;</div>

### customEntityDetectionModel.phrasesCacheTime : <code>number</code>
**Kind**: instance property of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  
<div id="CustomEntityDetectionModel__normalizeResult">&nbsp;</div>

### customEntityDetectionModel.\_normalizeResult(entities, entity, text, offset, originalText)
**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  

| Param | Type |
| --- | --- |
| entities | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) | 
| entity | <code>string</code> | 
| text | <code>string</code> | 
| offset | <code>number</code> | 
| originalText | <code>string</code> | 

<div id="CustomEntityDetectionModel__detectAllEntities">&nbsp;</div>

### customEntityDetectionModel.\_detectAllEntities(entity, text, entities, subWord) ⇒ <code>Promise.&lt;Array.&lt;DetectedEntity&gt;&gt;</code>
**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  

| Param | Type |
| --- | --- |
| entity | <code>string</code> | 
| text | <code>string</code> | 
| entities | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) | 
| subWord | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) | 

<div id="CustomEntityDetectionModel__detectEntities">&nbsp;</div>

### customEntityDetectionModel.\_detectEntities(entity, text, entities, subWord, detectSubWords) ⇒ <code>Promise.&lt;Array.&lt;DetectedEntity&gt;&gt;</code>
**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  

| Param | Type |
| --- | --- |
| entity | <code>string</code> | 
| text | <code>string</code> | 
| entities | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) | 
| subWord | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) | 
| detectSubWords | <code>boolean</code> | 

<div id="CustomEntityDetectionModel_nonOverlapping">&nbsp;</div>

### customEntityDetectionModel.nonOverlapping(entities, [expectedEntities]) ⇒ [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity)
Return only entities without overlap

**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  

| Param | Type |
| --- | --- |
| entities | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) | 
| [expectedEntities] | <code>Array.&lt;string&gt;</code> | 

<div id="CustomEntityDetectionModel_getDependentEntities">&nbsp;</div>

### customEntityDetectionModel.getDependentEntities([known]) ⇒ <code>Array.&lt;string&gt;</code>
**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  
**Returns**: <code>Array.&lt;string&gt;</code> - -  

| Param | Type | Default |
| --- | --- | --- |
| [known] | <code>boolean</code> | <code></code> | 

<div id="CustomEntityDetectionModel_resolveEntities">&nbsp;</div>

### customEntityDetectionModel.resolveEntities(text, [singleEntity], [expected], [prevEnts], [subWord]) ⇒ <code>Promise.&lt;Array.&lt;DetectedEntity&gt;&gt;</code>
**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| text | <code>string</code> |  |  |
| [singleEntity] | <code>string</code> | <code>null</code> |  |
| [expected] | <code>Array.&lt;string&gt;</code> |  |  |
| [prevEnts] | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) |  | previously detected entities to include |
| [subWord] | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) |  | previously detected entities within words |

<div id="CustomEntityDetectionModel_resolve">&nbsp;</div>

### customEntityDetectionModel.resolve(text, [req]) ⇒ [<code>Promise.&lt;Result&gt;</code>](#Result)
**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | the user input |
| [req] | <code>Request</code> |  |

<div id="CustomEntityDetectionModel__extractRegExpDependencies">&nbsp;</div>

### customEntityDetectionModel.\_extractRegExpDependencies(regexp)
**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  

| Param | Type |
| --- | --- |
| regexp | <code>RegExp</code> | 

<div id="CustomEntityDetectionModel__entityByDependency">&nbsp;</div>

### customEntityDetectionModel.\_entityByDependency(entities, dependency) ⇒ [<code>DetectedEntity</code>](#DetectedEntity) \| <code>null</code>
**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  

| Param | Type |
| --- | --- |
| entities | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) | 
| dependency | <code>string</code> | 

<div id="CustomEntityDetectionModel__regexpToDetector">&nbsp;</div>

### customEntityDetectionModel.\_regexpToDetector(regexp, [options])
**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  

| Param | Type | Description |
| --- | --- | --- |
| regexp | <code>RegExp</code> |  |
| [options] | <code>object</code> |  |
| [options.extractValue] | <code>function</code> \| <code>string</code> | entity extractor |
| [options.matchWholeWords] | <code>boolean</code> | match whole words at regular expression |
| [options.replaceDiacritics] | <code>boolean</code> | replace diacritics when matching regexp |
| [options.dependencies] | <code>Array.&lt;string&gt;</code> | array of dependent entities |

<div id="CustomEntityDetectionModel_setEntityDetector">&nbsp;</div>

### customEntityDetectionModel.setEntityDetector(name, detector, [options]) ⇒ <code>this</code>
**Kind**: instance method of [<code>CustomEntityDetectionModel</code>](#CustomEntityDetectionModel)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> |  |
| detector | [<code>EntityDetector</code>](#EntityDetector) \| <code>RegExp</code> |  |
| [options] | <code>object</code> |  |
| [options.anonymize] | <code>boolean</code> | if true, value will not be sent to NLP |
| [options.extractValue] | <code>function</code> \| <code>string</code> | entity extractor |
| [options.matchWholeWords] | <code>boolean</code> | match whole words at regular expression |
| [options.replaceDiacritics] | <code>boolean</code> | keep diacritics when matching regexp |
| [options.dependencies] | <code>Array.&lt;string&gt;</code> | array of dependent entities |

<div id="WingbotModel">&nbsp;</div>

## WingbotModel
**Kind**: global class  

* [WingbotModel](#WingbotModel)
    * [new WingbotModel(options, [log])](#new_WingbotModel_new)
    * [._fetch](#WingbotModel__fetch) : <code>fetch</code>
    * [._queryModel(text)](#WingbotModel__queryModel) ⇒ [<code>Promise.&lt;Result&gt;</code>](#Result)

<div id="new_WingbotModel_new">&nbsp;</div>

### new WingbotModel(options, [log])

| Param | Type |
| --- | --- |
| options | <code>object</code> | 
| [options.serviceUrl] | <code>string</code> | 
| [options.trainingUrl] | <code>string</code> | 
| options.model | <code>string</code> | 
| [options.cacheSize] | <code>number</code> | 
| [options.matches] | <code>number</code> | 
| [options.fetch] | <code>function</code> | 
| [log] | <code>Object</code> | 

<div id="WingbotModel__fetch">&nbsp;</div>

### wingbotModel.\_fetch : <code>fetch</code>
**Kind**: instance property of [<code>WingbotModel</code>](#WingbotModel)  
<div id="WingbotModel__queryModel">&nbsp;</div>

### wingbotModel.\_queryModel(text) ⇒ [<code>Promise.&lt;Result&gt;</code>](#Result)
**Kind**: instance method of [<code>WingbotModel</code>](#WingbotModel)  

| Param | Type |
| --- | --- |
| text | <code>string</code> | 

<div id="CachedModel">&nbsp;</div>

## CachedModel
**Kind**: global class  

* [CachedModel](#CachedModel)
    * [new CachedModel(options, [log])](#new_CachedModel_new)
    * [.phrasesCacheTime](#CachedModel_phrasesCacheTime) : <code>number</code>
    * [.resolve(text, [req])](#CachedModel_resolve) ⇒ [<code>Promise.&lt;Result&gt;</code>](#Result)
    * [._queryModel(text)](#CachedModel__queryModel) ⇒ <code>Promise.&lt;(Array.&lt;Intent&gt;\|Result)&gt;</code>

<div id="new_CachedModel_new">&nbsp;</div>

### new CachedModel(options, [log])

| Param | Type |
| --- | --- |
| options | <code>object</code> | 
| [options.cacheSize] | <code>number</code> | 
| [options.cachePhrasesTime] | <code>number</code> | 
| [log] | <code>Object</code> | 

<div id="CachedModel_phrasesCacheTime">&nbsp;</div>

### cachedModel.phrasesCacheTime : <code>number</code>
**Kind**: instance property of [<code>CachedModel</code>](#CachedModel)  
<div id="CachedModel_resolve">&nbsp;</div>

### cachedModel.resolve(text, [req]) ⇒ [<code>Promise.&lt;Result&gt;</code>](#Result)
**Kind**: instance method of [<code>CachedModel</code>](#CachedModel)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| text | <code>string</code> |  | the user input |
| [req] | <code>Request</code> | <code></code> | the user input |

<div id="CachedModel__queryModel">&nbsp;</div>

### cachedModel.\_queryModel(text) ⇒ <code>Promise.&lt;(Array.&lt;Intent&gt;\|Result)&gt;</code>
**Kind**: instance method of [<code>CachedModel</code>](#CachedModel)  

| Param | Type |
| --- | --- |
| text | <code>string</code> | 

<div id="AiMatching">&nbsp;</div>

## AiMatching
{AiMatching}

Class responsible for NLP Routing by score

**Kind**: global class  

* [AiMatching](#AiMatching)
    * [.optionalHandicap](#AiMatching_optionalHandicap) : <code>number</code>
    * [.redundantEntityHandicap](#AiMatching_redundantEntityHandicap) : <code>number</code>
    * [.redundantIntentHandicap](#AiMatching_redundantIntentHandicap) : <code>number</code>
    * [.multiMatchGain](#AiMatching_multiMatchGain) : <code>number</code>
    * [.getSetStateForEntityRules(rule)](#AiMatching_getSetStateForEntityRules) ⇒ <code>object</code>
    * [.parseEntitiesFromIntentRule(intentRule, onlyExpected)](#AiMatching_parseEntitiesFromIntentRule) ⇒ <code>Array.&lt;string&gt;</code>
    * [._parseEntitiesFromIntentRule(intentRules)](#AiMatching__parseEntitiesFromIntentRule) ⇒ [<code>Array.&lt;EntityExpression&gt;</code>](#EntityExpression)
    * [.preprocessRule(intentRule)](#AiMatching_preprocessRule) ⇒ [<code>PreprocessorOutput</code>](#PreprocessorOutput)
    * [.match(req, rule, [stateless], [reqEntities])](#AiMatching_match) ⇒ [<code>Intent</code>](#Intent) \| <code>null</code>
    * [._matchRegexp(req, regexps, noIntentHandicap)](#AiMatching__matchRegexp) ⇒ <code>number</code>

<div id="AiMatching_optionalHandicap">&nbsp;</div>

### aiMatching.optionalHandicap : <code>number</code>
When the entity is optional, the final score should be little bit lower
(0.001 by default)

**Kind**: instance property of [<code>AiMatching</code>](#AiMatching)  
<div id="AiMatching_redundantEntityHandicap">&nbsp;</div>

### aiMatching.redundantEntityHandicap : <code>number</code>
When there are additional entities then required add a handicap for each unmatched entity
Also works, when an optional entity was not matched
(0.02 by default)

**Kind**: instance property of [<code>AiMatching</code>](#AiMatching)  
<div id="AiMatching_redundantIntentHandicap">&nbsp;</div>

### aiMatching.redundantIntentHandicap : <code>number</code>
When there is additional intent, the final score will be lowered by this value
(0.02 by default)

**Kind**: instance property of [<code>AiMatching</code>](#AiMatching)  
<div id="AiMatching_multiMatchGain">&nbsp;</div>

### aiMatching.multiMatchGain : <code>number</code>
When more than one AI features (Intent, Entity, Regex) are matching,
enrich the score using the {multiMatchGain} ^ {additionalFeaturesCount}
(1.2 by default)

**Kind**: instance property of [<code>AiMatching</code>](#AiMatching)  
<div id="AiMatching_getSetStateForEntityRules">&nbsp;</div>

### aiMatching.getSetStateForEntityRules(rule) ⇒ <code>object</code>
**Kind**: instance method of [<code>AiMatching</code>](#AiMatching)  

| Param | Type |
| --- | --- |
| rule | [<code>PreprocessorOutput</code>](#PreprocessorOutput) | 

<div id="AiMatching_parseEntitiesFromIntentRule">&nbsp;</div>

### aiMatching.parseEntitiesFromIntentRule(intentRule, onlyExpected) ⇒ <code>Array.&lt;string&gt;</code>
Create a rule to be cached inside a routing structure

**Kind**: instance method of [<code>AiMatching</code>](#AiMatching)  

| Param | Type | Default |
| --- | --- | --- |
| intentRule | [<code>IntentRule</code>](#IntentRule) \| [<code>Array.&lt;IntentRule&gt;</code>](#IntentRule) |  | 
| onlyExpected | <code>boolean</code> | <code>false</code> | 

<div id="AiMatching__parseEntitiesFromIntentRule">&nbsp;</div>

### aiMatching.\_parseEntitiesFromIntentRule(intentRules) ⇒ [<code>Array.&lt;EntityExpression&gt;</code>](#EntityExpression)
**Kind**: instance method of [<code>AiMatching</code>](#AiMatching)  

| Param | Type |
| --- | --- |
| intentRules | [<code>Array.&lt;IntentRule&gt;</code>](#IntentRule) | 

<div id="AiMatching_preprocessRule">&nbsp;</div>

### aiMatching.preprocessRule(intentRule) ⇒ [<code>PreprocessorOutput</code>](#PreprocessorOutput)
Create a rule to be cached inside a routing structure

**Kind**: instance method of [<code>AiMatching</code>](#AiMatching)  

| Param | Type |
| --- | --- |
| intentRule | [<code>IntentRule</code>](#IntentRule) \| [<code>Array.&lt;IntentRule&gt;</code>](#IntentRule) | 

<div id="AiMatching_match">&nbsp;</div>

### aiMatching.match(req, rule, [stateless], [reqEntities]) ⇒ [<code>Intent</code>](#Intent) \| <code>null</code>
Calculate a matching score of preprocessed rule against the request

**Kind**: instance method of [<code>AiMatching</code>](#AiMatching)  

| Param | Type | Default |
| --- | --- | --- |
| req | [<code>AIRequest</code>](#AIRequest) |  | 
| rule | [<code>PreprocessorOutput</code>](#PreprocessorOutput) |  | 
| [stateless] | <code>boolean</code> | <code>false</code> | 
| [reqEntities] | [<code>Array.&lt;Entity&gt;</code>](#Entity) |  | 

<div id="AiMatching__matchRegexp">&nbsp;</div>

### aiMatching.\_matchRegexp(req, regexps, noIntentHandicap) ⇒ <code>number</code>
**Kind**: instance method of [<code>AiMatching</code>](#AiMatching)  

| Param | Type |
| --- | --- |
| req | [<code>AIRequest</code>](#AIRequest) | 
| regexps | [<code>Array.&lt;RegexpComparator&gt;</code>](#RegexpComparator) | 
| noIntentHandicap | <code>number</code> | 

<div id="handlebars">&nbsp;</div>

## handlebars : <code>Handlebars</code>
**Kind**: global variable  
<div id="COMPARE">&nbsp;</div>

## COMPARE : <code>enum</code>
**Kind**: global enum  
**Properties**

| Name | Type | Default |
| --- | --- | --- |
| EQUAL | [<code>Compare</code>](#Compare) | <code>eq</code> | 
| NOT_EQUAL | [<code>Compare</code>](#Compare) | <code>ne</code> | 
| RANGE | [<code>Compare</code>](#Compare) | <code>range</code> | 
| GT | [<code>Compare</code>](#Compare) | <code>gt</code> | 
| GTE | [<code>Compare</code>](#Compare) | <code>gte</code> | 
| LT | [<code>Compare</code>](#Compare) | <code>lt</code> | 
| LTE | [<code>Compare</code>](#Compare) | <code>lte</code> | 

<div id="EntityExpression">&nbsp;</div>

## EntityExpression : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| entity | <code>string</code> | the requested entity |
| [optional] | <code>boolean</code> | entity is optional, can be missing in request |
| [op] | [<code>Compare</code>](#Compare) | comparison operation (eq|ne|range) |
| [compare] | <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;number&gt;</code> | value to compare with |

<div id="textFilter">&nbsp;</div>

## textFilter ⇒ <code>string</code>
Text filter function

**Kind**: global typedef  
**Returns**: <code>string</code> - - filtered text  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | input text |

<div id="IntentRule">&nbsp;</div>

## IntentRule : <code>string</code> \| [<code>EntityExpression</code>](#EntityExpression)
**Kind**: global typedef  
<div id="BotPath">&nbsp;</div>

## BotPath : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| path | <code>string</code> | 

<div id="DetectedEntity">&nbsp;</div>

## DetectedEntity : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [start] | <code>number</code> | 
| [entity] | <code>string</code> | 
| [end] | <code>number</code> | 
| [score] | <code>number</code> | 
| [value] | <code>string</code> \| <code>number</code> \| <code>boolean</code> | 
| [text] | <code>string</code> | 

<div id="EntityDetector">&nbsp;</div>

## EntityDetector ⇒ [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) \| [<code>DetectedEntity</code>](#DetectedEntity) \| [<code>Promise.&lt;DetectedEntity&gt;</code>](#DetectedEntity) \| <code>Promise.&lt;Array.&lt;DetectedEntity&gt;&gt;</code>
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | part of text |
| entities | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) | dependent entities |
| [searchWithinWords] | <code>boolean</code> | optional ability to search within words |

<div id="ValueExtractor">&nbsp;</div>

## ValueExtractor ⇒ <code>\*</code>
**Kind**: global typedef  

| Param | Type | Description |
| --- | --- | --- |
| match | <code>Array.&lt;string&gt;</code> | regexp result |
| entities | [<code>Array.&lt;DetectedEntity&gt;</code>](#DetectedEntity) | dependent entities |

<div id="Entity">&nbsp;</div>

## Entity : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| entity | <code>string</code> | 
| value | <code>string</code> | 
| score | <code>number</code> | 

<div id="Intent">&nbsp;</div>

## Intent : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| intent | <code>string</code> | 
| score | <code>number</code> | 
| [entities] | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 

<div id="Result">&nbsp;</div>

## Result : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| text | <code>string</code> | 
| entities | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 
| intents | [<code>Array.&lt;Intent&gt;</code>](#Intent) | 

<div id="Phrases">&nbsp;</div>

## Phrases : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| phrases | <code>Map.&lt;string, Array.&lt;string&gt;&gt;</code> | 

<div id="Entity">&nbsp;</div>

## Entity : <code>object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| entity | <code>string</code> | 
| value | <code>string</code> | 
| score | <code>number</code> | 

<div id="Intent">&nbsp;</div>

## Intent : <code>object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| intent | <code>string</code> | 
| score | <code>number</code> | 
| [entities] | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 

<div id="Result">&nbsp;</div>

## Result : <code>object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| entities | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 
| intents | [<code>Array.&lt;Intent&gt;</code>](#Intent) | 

<div id="Entity">&nbsp;</div>

## Entity : <code>object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| entity | <code>string</code> | 
| value | <code>string</code> | 
| score | <code>number</code> | 

<div id="Intent">&nbsp;</div>

## Intent : <code>object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| intent | <code>string</code> | 
| score | <code>number</code> | 
| [entities] | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 

<div id="Result">&nbsp;</div>

## Result : <code>object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| entities | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 
| intents | [<code>Array.&lt;Intent&gt;</code>](#Intent) | 

<div id="Compare">&nbsp;</div>

## Compare : <code>string</code>
**Kind**: global typedef  
<div id="Entity">&nbsp;</div>

## Entity : <code>object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| entity | <code>string</code> | 
| value | <code>string</code> | 
| score | <code>number</code> | 

<div id="Intent">&nbsp;</div>

## Intent : <code>object</code>
**Kind**: global typedef  

| Param | Type |
| --- | --- |
| [intent] | <code>string</code> | 
| score | <code>number</code> | 
| [entities] | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 

<div id="Comparable">&nbsp;</div>

## Comparable : <code>string</code> \| <code>number</code> \| <code>function</code>
**Kind**: global typedef  
<div id="EntityExpression">&nbsp;</div>

## EntityExpression : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| entity | <code>string</code> | the requested entity |
| [optional] | <code>boolean</code> | the match is optional |
| [op] | [<code>Compare</code>](#Compare) | comparison operation |
| [compare] | [<code>Array.&lt;Comparable&gt;</code>](#Comparable) | value to compare |

<div id="IntentRule">&nbsp;</div>

## IntentRule : <code>string</code> \| [<code>EntityExpression</code>](#EntityExpression)
**Kind**: global typedef  
<div id="RegexpComparator">&nbsp;</div>

## RegexpComparator : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| r | <code>RegExp</code> | regular expression |
| t | <code>boolean</code> | use normalized text |
| f | <code>boolean</code> | is full match |

<div id="PreprocessorOutput">&nbsp;</div>

## PreprocessorOutput : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| regexps | [<code>Array.&lt;RegexpComparator&gt;</code>](#RegexpComparator) | 
| intents | <code>Array.&lt;string&gt;</code> | 
| entities | [<code>Array.&lt;EntityExpression&gt;</code>](#EntityExpression) | 

<div id="AIRequest">&nbsp;</div>

## AIRequest : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| text | <code>function</code> | 
| intents | [<code>Array.&lt;Intent&gt;</code>](#Intent) \| <code>null</code> | 
| entities | [<code>Array.&lt;Entity&gt;</code>](#Entity) | 
| [state] | <code>object</code> | 

