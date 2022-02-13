# discord.js-poll-tool
[![downloadsBadge](https://img.shields.io/npm/dt/discord.js-poll-tool?style=for-the-badge)](https://npmjs.com/discord.js-poll-tool) [![versionBadge](https://img.shields.io/npm/v/discord.js-poll-tool?style=for-the-badge)](https://npmjs.com/discord.js-poll-tool) [![documentationBadge](https://img.shields.io/badge/Documentation-Click%20here-blue?style=for-the-badge)](https://ena0.github.io/discord.js-poll-tool/)
## To-do
-   Control features(stop, add/remove time, add/remove responses and other)
-   Sharding support
-   Extend event features
-   Improve README.md
-   Fix all bugs

## Installation
```js
npm i discord.js-poll-tool
```

## Example

### Launch of the module

```js
const { PollManager } = require("discord.js-poll-tool")

client.poll  = new PollManager(client, {
	storage: "./Poll.js",
	updateEvery: 5000 //in ms
})
```
view all the options in the [documentation](https://ena0.github.io/discord.js-poll-tool/PollManager.html#PollManager)

## Start a poll
```js
const ms = require("ms")

client.on("messageCreate", (message) => {
	if(message.content == '!start-poll') {
		client.poll.startPoll(message.channel, {
			duration: ms("20s"),
			name: "Do you love me ?" 
			answers: [
				{name: "Yes", emoji: "✅"},
				{name: "No", emoji: "❌"}
			],
		})
		
	}
})
```

view all the options in the [documentation](https://ena0.github.io/discord.js-poll-tool/pollManager.html#startPoll)
