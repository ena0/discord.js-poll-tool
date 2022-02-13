/**
 * The default manager options
 * @typedef DefaultPollManagerOptions
 * 
 * @property {String} [storage='./Poll.json'] The storage path for the polls.
 * @property {Number} [updateEvery=5000] The time (in ms) where the polls are updated
 */
 exports.DefaultPollManagerOptions = {
    storage: "./Poll.json",
    updateEvery: 5000
}

/**
 * The default poll options
 * @typedef PollOptions
 * 
 * @property {String} name The name of the poll
 * @property {Number} duration The duration for the poll
 * @property {PollAnswersData[]} [answers=[{name: "Yes", emoji: "✅"},{name: "No", emoji: "❌"}]] The options for the poll
 * @property {Function} [mainEmbed] The main embed created for the poll
 * @property {Function} [endEmbed] The end embed created for the poll
 */
exports.DefaultPollOptions = {
    answers: [
        {
            name: "Yes",
            emoji: "✅",
        },
        {
            name: "No",
            emoji: "❌",
        }
    ],
    mainEmbed: (poll) => {},
    endEmbed: (poll) => {},
}

/**
 * @typedef PollData
 * 
 * @property {String} name The name of the poll 
 * @property {PollanswersData[]} answers The answers of the poll 
 * @property {Number} startAt the start date of the poll 
 * @property {Number} endAt The end date of the poll 
 * @property {Snowflake} guildId the id of the guild
 * @property {Snowflake} channelId the id of the channel 
 * @property {Snowflake} messageId the id of the message
 * @property {Boolean} ended if the poll was ended or not 
 * @property {PollResultsData[]} results The results of the poll 
 * @property {MessageEmbed} mainEmbed The main embed of the poll 
 * @property {MessageEmbed} endEmbed The end embed of the poll 
 */
exports.PollData = {}

/**
 * @typedef PollAnswersData
 * 
 * @property {String} name The name of the answer
 * @property {Emoji} emoji The emoji of the answer
 * @property {Number} votes the vote counter of the answer
 */
exports.PollAnswersData = {}

/**
 * @typedef PollResultsData
 * 
 * @property {String} name The name of the options
 * @property {Emoji} emoji The emoji of the options
 * @property {Number} votes the vote counter of the options
 * @property {Snowflake[]} users All the users id who voted for the options
 */
exports.PollResultsData = {}