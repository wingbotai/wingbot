> Disambiguation is useful, when the bot has lot of very similar intents. When more than one intent is detected, users can decide, what was their intention.

How to set up the disambiguation.

1. Put this plugin into a fallback
2. Set up the disambiguation message (disambiguation options will be added to the message as quick replies)
3. Put a regular "fallback" message behind this plugin. If the disambiguation will not occur, your bot will answer with this fallback message
4. Add a disambiguation title to all interactions, which you want to disambiguate

To fine tune the disambiguation, you can also set up a custom `ai.threshold` on bot (there is `0.3` by default). Detected intent has to reach this minimum score, to be disambiguated.

![disambiguation](https://github.com/wingbotai/wingbot/raw/master/plugins/ai.wingbot.disambiguation/disambiguation.png)