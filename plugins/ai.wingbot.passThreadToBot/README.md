> One of base pillars of masterbot architecture

## Passing thread to another bot

The action is determined by metadata JSON string.

1. **Pass thread with text (leave action and intent fields empty)**

	Let the target bot's NLP to decide.

2. **Pass thread to specific action**

	Target bot will response with a predefined interaction

3. **Trigger a specific intent at a target bot**

	Intent will be enforced at target bot

![pass thread to bot](https://github.com/wingbotai/wingbot/raw/master/plugins/ai.wingbot.passThreadToBot/passThreadToBot.png)