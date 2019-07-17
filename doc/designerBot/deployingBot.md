# Deploying a bot application

## Principle

There are two components:

- **wingbot.ai designer** - provides interactions and bot structure as interactions snapshot JSON
- **wingbot chatbot** - standalone chatbot application

And theese components communicates simply:

- a **chatbot** downloads current interactions snapshot from the **designer**
- when making a new interactions snapshot **designer** validates it on **chatbot** and then invalidates cached snapshot

Main chatbot endpoints

- `POST /bot` - where the conversation events are processed
- `POST /validate` - where **designer** validates new snapshot, before it's saved
- `POST /update` - after validation, **designer** invalidates cached snapshot on the bot

## Starting a new chatbot project

The best way to start is to use a `wingbot-cli` to generate a new project

```bash
npm i -g wingbot-cli
mkdir my-new-bot
cd my-new-bot
wingbot init
```

## Wingbot project structure

```
.
├── bin                  : runnables (express or deployment scripts)
├── bot      : controllers for all routes
|    ├── plugins         : chatbot integrations and business logic
|    └── anonymize.js    : place to attach chatbot middewares
|    └── bot.js          : place to attach chatbot middewares
|    └── botSettings.js  : called on bot update, sets start button or menu on FB
|    ├── onAction.js     : Analytics integration
|    └── index.js        : set up the Processor here
├── config      : project configuration for different environments
├── lib         : serverside libraries
|    ├── ***db           : database connection library
|    └── log             : logging service which replaces classic `console.log()`
├── test        : automatic tests
|    ├── bot             : write bot tests here
|    ├── lib             : libs unit tests
├── routes      : controllers for all routes
|    ├── bot.js          : chatbot endpoint, messenger integration is set here
|    ├── api.js          : chatbots GQL API
|    ├── tracker.js      : tracking of outgoing links
|    └── ...             : other endpoints
├── app.js      : webserver initialization (only express)
```