# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.73.7]

### Added

- llmSessionWithHistory takes two new optional arguments 

## [3.73.6]

### Added

- MemoryStateStorage drop function

## [3.73.4]

### Fixed

- MemoryStateStorage supports filtration

## [3.73.3]

### Fixed

- Mock orch client

## [3.73.2]

### Fixed

- Starting slash

## [3.73.0]

### Added

- Vector search documents support

## [3.72.0]

### Added

- LLM rules handling

## [3.71.0]

### Added

- new LLM history support

## [3.70.0-]

### Added

- new LLM support

## [3.69.8]

### Fixes

- session creation
- build perf boost

## [3.69.7]

### Added

- The library calls translate function with extra pamarater {quickReply:true} when translating quick replies

## [3.69.6]

### Fixed

- `Plugins#getWrappedPlugin()` accepts an object of strings

## [3.69.5]

### Fixed

- tracking plugin allows -1

## [3.69.0-2]

### Added

- support for notifications with data

## [3.68.4]

### Fixed

- wholewords for case sensitive regexes

## [3.68.3]

### Fixed

- support for case sensitive regexes

## [3.67.28]

### Fixed

- chatbot apis now supports async botFactory

## [3.67.27]

### Fixed

- reporting now uses an updated state instead of the initial

## [3.67.20-6]

### Fixed

- issue with multiple optional entities
- better fuzzy comparison
- chatgpt issue

## [3.67.19]

### Fixed

- missing assertion for nonexisting quick replies

## [3.67.18]

### Fixed

- last set_context event is now sent within a last message

## [3.67.17]

### Fixed

- added missing JSDOC

## [3.67.16]

### Fixed

- fuzzy search and numbers handling by levenshtein

## [3.67.15]

### Fixed

- transcript now contains last message

## [3.67.14]

### Fixed

- support for large conversations in storage

## [3.67.13]

### Fixed

- shorter NLP timeout

## [3.67.12]

### Fixed

- email entity regexp

## [3.67.11]

### Fixed

- possible duplicate entities eliminated when detected both on server and NLP

## [3.67.10]

### Fixed

- replaced vulnerable version of axios

## [3.67.9]

### Fixed

- fuzzy matching

## [3.67.8]

### Fixed

- tracking of custom dimensions

## [3.67.7]

### Fixed

- email entity detection regex behavior with comma

## [3.67.4-6]

### Fixed

- Word entity detector now fixes searched data

## [3.67.3]

### Fixed

- Word entity detector now normalizes entites

## [3.67.2]

### Fixed

- Word entity detector maxWord config support

## [3.67.0] 2023-10-16

### Added

- `<ChatGpt>` class to provide general support for chatgpt answering
- Support for `Router/BuildRouter` configuration as a promise
- Support for async word entity detector

## [3.66.4] 2023-10-16

### Fixed

- preloading word detectors

## [3.66.0-3] 2023-10-10

### Added

- `Ai.setWordEntityDetector()` method
- `defaultPlugin` for `BuildRouter` - for testing conversations
- `updateConfiguration()` method at `Router`
- `preloader` param for `Processor` options
- `dontWaitForDeferredOps` param for `ReturnSender` and `BotApp` as optimization for Docker apps

## [3.65.11] 2023-09-15

### Fixed

- redundant entity matching clamped

## [3.65.11] 2023-09-15

### Fixed

- lazyload of GQL and plugins

## [3.65.10] 2023-09-15

### Fixed

- updated graphql

## [3.65.9] 2023-09-05

### Fixed

- AI matching score for hashtags and keywords

## [3.65.8] 2023-08-18

### Fixed

- onInteractionTracker removes setContext events

## [3.65.7] 2023-08-18

### Fixed

- added missing senderId to data

## [3.65.6] 2023-08-17

### Fixed

- entity matching with state

## [3.65.5] 2023-08-17

### Added

- Expected keywords now uses keywords

## [3.65.3-4] 2023-08-08

### Fixed

- Expected keywords now uses keywords

## [3.65.0-1] 2023-08-02

### Added

- "continue" quick reply for ChatGPT plugin

### Fixed

- ChatGPT plugins now filters longer text in chat history
- `Tester.debug()` method now shows the whole message structure

## [3.64.0-1] 2023-08-01

### Added

- support for compression of bot definition

## [3.63.0-1] 2023-08-01

### Added

- upload plugin received attachment suffix check

## [3.62.1] 2023-06-29

### Fixed

- non interactive events tracking

## [3.62.0] 2023-06-29

### Added

- `<Notifications>.sendLimit` prop added to be able to throttle requests

## [3.61.1] 2023-06-13

### Fixed

- missing support for FE tracking

## [3.61.0] 2023-06-13

### Added

- FE tracking test

## [3.60.0] 2023-05-12

### Added

- upload plugin

## [3.59.2] 2023-05-10

### Fixed

- persist responder meta through postbacks

## [3.59.1] 2023-05-03

### Fixed

- workaround for repeating annotations

## [3.59.0] 2023-05-03

### Added

- support for gpt flags
- `res.setFlag()`
- `onlyFlag` param for `res.getTranscript()` method

### Fixed

- gpt context limit

## [3.58.0-2] 2023-04-28

### Added

- configuration options `openAiEndpoint` and `openAiApiKey` for ChatGPT plugin
- ChatGPT plugin inputs: `persona` and `annotation`

### Fixed

- azure openai url

## [3.57.1] 2023-04-19

### Fixed

- slot filling shared state issue

## [3.57.0] 2023-04-13

### Added

- `<Router>` now accepts configuration object in `constructor` and offers configuration with a getter
- new Persona plugin
- `persona` configuration property with `_default` option
- Testers assert method `any().contains()` now supports objects to validate output messages

## [3.56.1] 2023-04-11

### Fixed

- extended tracking

## [3.56.0] 2023-03-28

### Added

- `skill` and `prevSkill` now in tracking metadata

## [3.55.1] 2023-03-22

### Fixed

- compound regexp entities uses first non optional entity as value

## [3.55.1] 2023-03-20

### Fixed

- fixed object boolean comparison

## [3.55.0] 2023-03-13

### Added

- `interaction` event now adds `prevSkill` and `pathname` properties
- those new properties became a part of CONVERSATION event

## [3.54.0] 2023-03-03

### Added

- OpenAI plugin for ChatGPT
- `res.getTranscript()` method
- public `chatLogStorage` property on `<ReturnSender>`

## [3.53.5] - 2023-03-01

### Fixed

- unmatched covering entity now degrades score of context requests

## [3.53.3-4] - 2023-02-22

### Fixed

- covering entity handicap behavior

## [3.53.2] - 2023-02-22

### Fixed

- rendering of empty message

## [3.53.0] - 2023-02-21

### Added

- variable expires with a new session `vars.sessionContext()`
- sequence messages

## [3.52.6] - 2023-02-18

### Fixed

- plugin factory now receives chatbot configuration

## [3.52.3-5] - 2023-02-17

### Fixed

- router JSDOC typings

## [3.52.2] - 2023-02-15

### Fixed

- optionally equal entities now works

## [3.52.1] - 2023-02-15

###  Fixed

- behavior of empty messages

## [3.52.0] - 2023-02-08

### Added

- added support for recognition props in voice control.

## [3.51.0] - 2023-02-03

### Added

- added `deep` option to `Tester#stateContains()` method

## [3.50.0] - 2023-01-31

### Added

- support for parsing user agent at `onInteractionHandler` from `§ua` state property

## [3.49.0] - 2023-01-25

### Added

- `pageCategory` var at event tracking
- `pathCategoryExtractor` option to override default category selection

## [3.48.1] - 2023-01-25

### Fixed

- missing `pagePath` at event tracking

## [3.48.0] - 2023-01-24

### Added

- voice control param for `timeout`

## [3.47.2] - 2023-01-16

### Fixed

- `null` should be treated as `0` in numeric custom conditions

## [3.47.0-1] - 2023-01-12

### Added

- better logs for text test cases

## [3.46.4] - 2022-12-29

### Fixed

- session tracking

### Fixed

- updated vulnerable JWT lib

## [3.46.3] - 2022-12-28

### Fixed

- updated vulnerable JWT lib

## [3.46.2] - 2022-12-14

### Added

- support for multi language markdown attachment

## [3.46.0] - 2022-12-12

### Added

- Skill tracking with designer categories
- New fields in interaction tracking
- Stronger sessionId
- Support for BigQuery tracking
- `preLoad()` support for storages wired into the BotApp
- `extractText()`, `htmlBodyFromTranscript()`, `textBodyFromTranscript()`, `transcriptFromHistory()` methods

## [3.45.1] - 2022-11-30

### Fixed

- async onInteraction handlers in lambda

## [3.45.0] - 2022-11-30

### Added

- support for className at attachment button
- new input types at responder

## [3.44.5] - 2022-11-25

### Fixed

- slot filling - entities are nulled also in current state

## [3.44.4] - 2022-11-25

### Fixed

- voice control is properly generated for selected language.

## [3.44.3] - 2022-11-25

### Fixed

- added missing pageId at link translator

## [3.44.2] - 2022-11-25

### Fixed

- added missing solution for tracking events `BotApp#trackEvent()`

## [3.43.1] - 2022-11-24

### Fixed

- problem with `onInteractionHandler` interface

## [3.44.0] - 2022-11-24

### Added

- `onInteractionHandler` function as a Processor's "interaction" event handler
- `GA4()` class as a new GA4 adapter
- `BotApp#registerAnalyticsStorage()` - method simplifies attaching analytics storage

## [3.43.1] - 2022-11-17

### Fixed

- Weird bot build with voice control

## [3.43.0] - 2022-11-17

### Added

- `ai.registerEntityDetector()` registers detector to all known models any time
- `ai.configureEntityDetector()` configures all known models any time

### Fixed

- local entities are now detected with overlaps

## [3.42.1] - 2022-11-04

### Fixed

- `Responder.voiceControl` now accepts function

## [3.42.0] - 2022-11-04

### Added

- `Responder.voiceControl` property with default data for voice

## [3.41.0] - 2022-11-02

### Added

- slots plugin got a skip/reset fields

## [3.40.2] - 2022-10-24

### Fixed

- slot loader now accepts two filled entities at one

## [3.40.1] - 2022-10-21

### Fixed

- `Tester` now sets `automatedTesting` variable to `res.data`

## [3.40.0] - 2022-10-21

### Added

- `Responder.quickReply()` method, which replaces original `.addQuickReply()` method

### Deprecated

- `.addQuickReply()` method

## [3.39.1] - 2022-10-21

### Fixed

- exported `wingbotVersion` for

## [3.39.0] - 2022-10-19

### Added

- advanced slot filling plugin
- support for handlebars in quick replies
- `{{$today}}`, `{{$tomorrow}}`, `{{$now}}`, `{{$yesterday}}` variables
- `Tester.debug()` method for showing details of last turnaround
- `Tester.entity()` method for sending only entity

### Fixed

- variable parsing loop (in case of using `+`)

## [3.38.1] - 2022-09-29

### Fixed

- `{{lang}}` handlebars helper

## [3.38.0] - 2022-09-28

### Added

- support for `{{$this}}` and `{{$input}}` in conditions
- `lang` handlebars helper
- `Tester.stateContains(object)` method for asserting contents of the state

### Fixed

- array matching of custom conditions

## [3.37.3] - 2022-09-13

### Fixed

- pure entity matching lowers the score, when

## [3.37.2] - 2022-09-13

### Fixed

- AI preloading

## [3.37.1] - 2022-09-13

### Fixed

- test logging

## [3.37.0] - 2022-09-05

### Added

- typed state support

### Fixed

- behavior of router configuration

## [3.36.1-2] - 2022-08-11

### Fixed

- allow the NLP to beat local context entity
- added a bypass of webapp bug on Azure App Service

## [3.36.0] - 2022-07-12

### Added

- Entities are accessible with an array `{{[@].number.[0]}}`

## [3.35.1] - 2022-07-12

### Fixed

- BotApp does not pass appId

## [3.35.0] - 2022-07-12

### Added

- Attachment button with support for Markdown content. (`ButtonTemplate#attachmentButton()`)
- added `BotApp#createSender()` method

## [3.34.0] 2022-06-16

### Added

- AI model got method `#setDetectorOptions`, which allows to disable anonymization.

## [3.33.1-2] 2022-06-16

### Fixed

- quick replies handling at automated tests

## [3.33.0] 2022-06-03

### Added

- Support for configurations

## [3.32.0] 2022-06-03

### Added

- Support for tracking protocol feature

### Fixed

- Propagation of incoming `response_to_mid` values

## [3.31.9] 2022-05-24

### Fixed

- removed request lib

## [3.31.4+5] 2022-05-12

### Fixed

- behavior of local fallbacks in combination with Router-plugins

## [3.31.2-3] 2022-05-12

### Fixed

- do not track inside a plugin

## [3.31.1] 2022-05-12

### Fixed

- SSML filtration at ReturnSender
- Passing Sender options within a BotApp

## [3.31.0] 2022-04-28

### Added

- Support for orchestrator attachment upload

## [3.30.0] 2022-03-10

### Fixed

- Text alternatives sorting

### Added

- Support for subscriptions preprocessor

## [3.29.0] 2022-03-10

### Added

- Media conditions support

## [3.27.0] 2022-02-02

### Added

- sub-word entity support

## [3.26.1-3] 2021-12-17

### Fixed

- Compound entities with diacritics
- Handlebars within entity conditions when no intent is present

## [3.26.0] 2021-12-14

### Added

- Support mutual TLS
- Variables in entity conditions

## [3.25.0] 2021-12-01

### Added

- Support for Audit logs

## [3.24.5] 2021-12-01

### Fixed

- SetState from array when using

## [3.24.4] 2021-11-30

### Fixed

- Entity disambiguation now supports alternatives
- Intent disambiguation uses entities to compare

## [3.24.0] 2021-11-05

### Added

- `routeToEvents()` function for simple conversion from interaction definitions to messaging events
- `setState` array operators now supports `,` as separator of items (can be excaped by `\` backslash)

## [3.23.1] 2021-11-02

### Fixed

- missing `templateData` within disambiguation actions

## [3.23.0] 2021-11-01

### Added

- expected input type method `res.expectedInput()`

## [3.22.3] 2021-10-11

### Fixed

- expected keywords action

## [3.22.2] 2021-10-01

### Fixed

- handlebars at RegExp conditions

## [3.22.1] 2021-10-01

### Fixed

- `null` as input to condition

## [3.22.0] 2021-09-30

### Highlights

- STT features for better voice understanding
- introducing `features` array to support text+voice combined bots
- better error handling

### Added

- `Request` now has:
  - a new `features: string[]` property
  - a new `FEATURES_*` constants
  - the `supportsFeature(feature: string): boolean` method
  - the `textAlternatives(): {text:string,score:number}[]` method returning all texts sent to bot
- `Responder`'s `text()` got a new third argument with `VoiceControl` settings
- `Ai` got a new `getPhrases()` method, which is used by `ReturnSender` to enrich the last message with expected entities and phrases

### Changed

- Exception handling in Processor now propagates all conversational exceptions to `ChatLogStorage` (finally)
-

## [3.21.1] 2021-09-27

### Fixed

- conditions now support handlebars

### [3.21.0] 2021-09-24

### Added

- support for local handlers disambiguation

## [3.20.0] 2021-09-21

### Added

- support for setState array operators (`_$push`, `_$pop`, `_$shift`, `_$add`, `_$set` `_$rem`)

### Changed

- when using range comparison operators `>`, `<`, `>=`, `<=` against array, it's length is used

### Fixed

- data param of `res.addQuickReply()` method

## [3.19.3] 2021-09-06

### Fixed

- AI Entity context when using optional entity

## [3.19.3] 2021-09-06

### Fixed

- AI Entity context when using quick replies

## [3.19.2] 2021-08-24

### Fixed

- node modules problems
- entity persistence when using remebered entities

## [3.19.0] 2021-08-24

### Changed

- dialogue context now lasts through the whole conversation turnaround
- passing an interaction with an entity condition now prolongs the life of all mentioned entities

### Fixed

- setState after detected dictionary entity now persists the right value

## [3.18.0] 2021-08-10

### Added

- support for visual conditions

## [3.17.0] 2021-07-28

### Added

- regexp entities now can be treated without diacritics and with whole words matching

### Changed

- published entity matching methods on CustomEntityDetectionModel

## [3.16.1] 2021-06-21

### Fixed

- nested plugins returned by "wrapPluginFunction"

## [3.16.0] 2021-06-21

### Added

- jumpTo/jumpBack system plugins
- setState string now accepts handlebars templates
- regexp system plugin

## [3.15.0] 2021-06-18

### Added

- force the `BotApp` to send reponses synchronously

## [3.14.7] 2021-05-27

### Fixed

- `Notifications` now passes through postbacks even with unsubscribtions

## [3.14.6] 2021-05-20

### Fixed

- `ConversationTester` now caches chatbot configuration, so it makes test significantly faster

## [3.14.1] 2021-05-19

### Fixed

- Input params treated with more care at `compileWithState()`

## [3.14.0] 2021-05-12

### Added

- Support for Notifications on Wingbot orchestrator

### Fixed

- Notifications now works through postbacks
- Recovery, when keys download fails

## [3.13.2] 2021-03-26

### Fixed

- `Responder.isQuickReply()` now returns boolean
- `Responder.text()` with added quick replis now works

## [3.13.0] 2021-03-26

### Added

- `Responder.trackEvent()` method for tracking purposes
- `ReturnSender.tracking` object with tracked events
- `tracking` property in `Processor#interaction` event
- `ai.wingbot.trackingEvent` plugin

## [3.12.0] 2021-03-26

### Added

- `interaction` event at processor

## [3.11.0] 2021-03-25

### Added

- conversation tester now supports multilanguage configurations

## Changed

- processor now waits for firing it's event

## [3.10.1] 2021-03-19

### Fixed

- event emmiting at processor

## [3.10.0] 2021-03-19

### Added

- support for controlling quick reply and button source (`req.actionData()._ca`);
- support for modification of senderIds when subscribing them
- [WIN-367] Added `orchestratorClient` with calling `getConversationToken` to orchestrator inside the Request
- support for "delayed" notifications
- support for "§" orchestrator variables
- `Plugins.getWrappedPlugin()` now accepts items as an object (`{ itemName: (req, res) => { res.text('ok'); }}`)

### Fixed

- `res.currentPath()` method now returns correct path at root routes
- AI `#tags` now scores with 1.0 score, when matched fully
- non-empty not equal condition at entity now requires it's presence (`@entity!=1`)
- setState now works within entity handlers
- `BotApp` has now more straightforward configuration of the `apiUrl`
- `Plugins.getWrappedPlugin()` compatible with `Tester.espondedWithBlock()`

## [3.9.0] 2021-01-13

### Added

- array of sent responses to the Responder class under `res.textResponses`

## [3.8.0] - 2020-12-14

### Added

- exports for `CustomEntityDetectionModel`
- support for `_$text` and `_$entity` at quick replies

###  Fixed

- examples in docs

## [3.7.5] - 2020-12-01

###  Fixed

- keeps also limited score/life variables, when using `req.expectedContext()`

## [3.7.4] - 2020-11-26

### Changed

- prolonged automatic typing
- orchestrator API url is no longer required (default is used)

## [3.7.0] - 2020-11-16

### Added

- system entities for `email` and `phone`

###  Fixed

- entity transformation for regexp entities

## [3.6.1] - 2020-11-10

### Changed

- optional entity in quick reply accepts also entities in state

### Added

- public `.processor` property on BotApp class

## [3.6.0] - 2020-08-21

### Added

- Method `res.send()` is now public.
- New method `plugins.getWrappedPlugin()` simplifies testing of plugins
- Entity persistence
  - entites are persisted inside a dialoge
  - they're accessible under `@<entity>` state variable
- Support for designers FAQ Bounce
- Support for state variable metadata
  - `vars.dialogContext()`
  - `vars.expiresAfter()`
  - `vars.preserveMeta()`
- Support for system entities
- new `botbuild.plugin` resolver, which combines snippets (inlineCode) and plugins (customCode) resolvers
  - public plugin library is now a part of the core Wingbot lib
- New flight director adapter class `BotApp`

### Fixed

- designer resolver `botbuild.postback` now passes the text to next interaction
- fixes a problem, which affects the API, when an empty conversation occurs
- nice NLP & BuildRouted exceptions

### Changed

- Return sended now throws the exception through processor
- Replaced `request-promise-native` with `node-fetch`
- Raised code coverage threshold to 90-80-90

## [3.5.0] - 2020-06-25

### Added

- new public method `.expectedKeywords()` at Request, which exports expected intents and quick replies to be retained in next request
- new public method `.expectedConfidentInput()` at Responder, which marks the next input as confident
- new public method `.isConfidentInput()` at Request, which tells you, that confident input was expected
- new option `confidentInputFilter` for ReturnSender and all channel adapters, which overrides a default input filter for confident content
- new option `stateTextFilter` at conversationsApi(), which enables custom filtering of confident data

### Fixed

- designer resolver `botbuild.postback` now passes the text to next interaction
- fixes a problem, which affects the API, when an empty conversation occurs

### Changed

- updated node modules

## [3.4.1] - 2020-04-28

### Fixed

- `path.posix` replace by `(path.posix || path)` for using in browser

## [3.4.0] - 2020-04-28

### Added

- new public method `.emitAction()` at ReducerWrapper (Router, BuildRouter), which enables low level tracking

### Fixed

- `res.trackAs(false)` should not fire also the Processors `event`
