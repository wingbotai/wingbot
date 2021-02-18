# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.10.0] 2021-01-13
### Added

-  support for controlling quick reply and button source (`req.actionData()._ca`);
-  support for modification of senderIds when subscribing them
-  [WIN-367] Added `orchestratorClient` with calling `getConversationToken` to orchestrator inside the Request
- support for "delayed" notifications
- support for "§" orchestrator variables

### Fixed

- `res.currentPath()` method now returns correct path at root routes
- AI `#tags` now scores with 1.0 score, when matched fully
- non-empty not equal condition at entity now requires it's presence (`@entity!=1`)
- setState now works within entity handlers

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
