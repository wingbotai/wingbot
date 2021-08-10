# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- processor now waits for firing it's eventnpm
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
-  array of sent responses to the Responder class under `res.textResponses`

## [3.8.0] - 2020-12-14

### Added

- exports for `CustomEntityDetectionModel`
- support for `_$text` and `_$entity` at quick replies

### Fixed

- examples in docs
## [3.7.5] - 2020-12-01

### Fixed

- keeps also limited score/life variables, when using `req.expectedContext()`
## [3.7.4] - 2020-11-26

### Changed

- prolonged automatic typing
- orchestrator API url is no longer required (default is used)

## [3.7.0] - 2020-11-16

### Added

- system entities for `email` and `phone`

### Fixed

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
  + entites are persisted inside a dialoge
  + they're accessible under `@<entity>` state variable
- Support for designers FAQ Bounce
- Support for state variable metadata
  + `vars.dialogContext()`
  + `vars.expiresAfter()`
  + `vars.preserveMeta()`
- Support for system entities
- new `botbuild.plugin` resolver, which combines snippets (inlineCode) and plugins (customCode) resolvers
  + public plugin library is now a part of the core Wingbot lib
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
