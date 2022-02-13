const { EventEmitter } = require("events")

const { MessageEmbed } = require("discord.js")
const { PollData, PollOptionsData, PollResultsData } = require("./constants.js")

class Poll extends EventEmitter {
    /**
     * 
     * @param {PollManager} manager 
     * @param {pollOptions} options 
     */
    constructor(manager, options) {
        super()

        /**
         * The poll manager
         * @type {PollManager}
         */
        this.manager = manager

        /**
         * The question for the poll
         * @type {String}
         */
        this.name = options.name

        /**
         * The answers for the poll
         * @type {PollAnswersData[]}
         */
        this.answers = options.answers

        /**
         * The start timestamp
         * @type {Number}
         * @readonly
         */
        this.startAt = options.startAt

        /**
         * The end timestamp
         * @type {Number}
         */
        this.endAt = options.endAt

        /**
         * if the poll ended or not
         * @type {Number}
         */
        this.ended = false

        /**
         * The message of the poll
         * @type {Message}
         * @readonly
         */
         this.message = options.message

        /**
         * The main embed
         * @type {MessageEmbed}
         */
        this.mainEmbed = options.mainEmbed

        /**
         * The end embed
         * @type {MessageEmbed}
         */
        this.endEmbed = options.endEmbed

        /**
         * The poll results
         * @type {PollResultsData[]}
         */
        this.results = []
    }

    /**
     * The total duration of the poll
     * @type {Number}
     * @readonly
     */
    get duration() {
        return this.endAt - this.startAt
    }

    /**
     * The remaining time of the poll
     * @type {Number}
     * @readonly
     */
    get remainingTime() {
        return this.endAt - Date.now()
    }

    /**
     * The main embed function
     * @type {Function}
     * @readonly
     */
    get mainEmbedFunction() {
        return typeof this.mainEmbed === 'string' && this.mainEmbed.includes('function anonymous') ? eval(`${this.mainEmbed}`) : eval(this.mainEmbed)
    }

    /**
     * The end embed function
     * @type {Function}
     * @readonly
     */
    get endEmbedFunction() {
        return typeof this.endEmbed === 'string' && this.endEmbed.includes('function anonymous') ? eval(`${this.endEmbed}`) : eval(this.endEmbed)
    }

    /**
     * The data of the poll
     * @type {PollData}
     * @readonly
     */
    get data() {
        const data = {
            name: this.name,
            answers: this.answers,
            startAt: this.startAt,
            endAt: this.endAt,
            message: this.message,
            ended: this.ended,
            results: this.results,
            mainEmbed: this.mainEmbed,
            endEmbed: this.endEmbed,
        }

        return data
    }

    /**
     * end the poll
     */
    async end() {
        this.ended = true

        this.results = this.answers.sort((a, b) => b.votes - a.votes)

        //this.message.reactions.removeAll()

        this.manager.editPoll(this.message.id, this.data)

        const endEmbed = this.manager.generateEndEmbed(this)

        this.message.edit({embeds: [endEmbed]})

        this.manager.emit("pollEnded", this)
    }

    /**
     * add a vote 
     * @param {Emoji} emoji 
     * @param {GuildMember} member 
     */
    async addReaction(emoji, member) {
        const vote = this.answers.find(o => o.emoji == emoji)

        vote.votes++

        await this.manager.editPoll(this.message.id, this.data)

        this.manager.emit("addVote", this, vote, member)
    }

    /**
     * remove a vote
     * @param {Emoji} emoji 
     * @param {GuildMember} member 
     */
    async removeReaction(emoji, member) {
        const vote = this.answers.find(o => o.emoji == emoji)

        vote.votes--

        await this.manager.editPoll(this.message.id, this.data)

        this.manager.emit("removeVote", this, vote, member)
    }
}

module.exports = Poll