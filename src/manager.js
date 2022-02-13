const { EventEmitter } = require("events")
const merge = require("deepmerge")
const { Client, MessageEmbed } = require("discord.js")

const { promisify } = require('util')
const { writeFile, readFile, exists } = require("fs")
const writeFileAsync = promisify(writeFile)
const readFileAsync = promisify(readFile)
const existsAsync = promisify(exists)

const { DefaultPollManagerOptions, DefaultPollOptions, PollAnswersData } = require("./constants.js")
const Poll = require("./poll.js")

/** 
 * Poll Manager
 * @example
 * const { PollManager } = require("discord.js-poll-tool")
 * 
 * client.pollManager = new PollManager(client, {
 *     storage: "./Poll.json",
 *     updateEvery: 5000
 * })
 */
class PollManager extends EventEmitter {
    /**
     * 
     * @param {Client} client The discord client 
     * @param {DefaultPollManagerOptions} [options] the managers options
     */
    constructor(client, options) {
        super()
        /**
         * The discord client
         * @type {Client}
         */
        this.client = client

        /**
         * The manager options
         * @type {DefaultPollManagerOptions}
         */
        this.options = merge(DefaultPollManagerOptions, options || {})

        /**
         * All the poll managed by this manager
         * @type {Poll[]}
         */
        this.polls = []

        this.client.on('ready', (client) => this._init())
    }

    /**
     * Get all the polls from the storage
     * @ignore
     * @returns  {Promise<PollData[]>}
     */
    async getAllPolls() {
        const storage = await existsAsync(this.options.storage)
        if(!storage) {
            await writeFileAsync(this.options.storage, '[]', 'utf-8')
            return []
        }

        const content = await readFileAsync(this.options.storage)

        try {
            const polls = await JSON.parse(content);

            if(Array.isArray(polls)) return polls
            else throw new SyntaxError('invalide')

        } catch(e) {
            await writeFileAsync(this.options.storage, '[]', 'utf-8')
            return []
        }
    }

    /**
     * Save the giveaway in the database
     * @param {Snowflake} messageId The message id who identifying the poll
     * @param {PollData} pollData The poll data to save
     */
    async savePoll(messageId, pollData) {
        await writeFileAsync(this.options.storage, JSON.stringify(this.polls.map(p => p.data)), 'utf-8')

        await this.refreshStorage()

        return
    }

    /**
     * Edit the giveaway in the database
     * @param {Snowflake} messageId The message id who identifying the poll
     * @param {PollData} pollData The poll data to save
     */
    async editPoll(messageId, pollData) {
        await writeFileAsync(this.options.storage, JSON.stringify(this.polls.map(p => p.data)), 'utf-8')

        await this.refreshStorage()
        
        return
    }

    /**
     * delete the giveaway in the database
     * @param {Snowflake} messageId The message id who identifying the poll
     */
    async deletePoll(messageId) {
        this.polls.filter(p => p.messageId != messageId)

        await writeFileAsync(this.options.storage, JSON.stringify(this.polls.map(p => p.data)), 'utf-8')

        await this.refreshStorage()
        
        return
    }

    /**
     * refresh the storage file
     * @returns {Boolean} a boolean (by default true)
     */
    async refreshStorage() {
        return true
    }

    /**
     * Generate an embed displayed when a poll is running
     * @param {Poll} poll The poll the embed needs to be generated for 
     * @returns {MessageEmbed} the generated embed
     */
    generateMainEmbed(poll) {
        const result = poll.mainEmbedFunction(poll)
        return new MessageEmbed(result)
    }

    /**
     * Generate an embed displayed when a poll is ended
     * @param {Poll} poll The poll the embed needs to be generated for 
     * @returns {MessageEmbed} the generated embed
     */
    generateEndEmbed(poll) {
        const result = poll.endEmbedFunction(poll)
        return new MessageEmbed(result)
    }

    /**
     * Start a new poll
     * @param {TextChannel} channel The channel in which the poll will be created
     * @param {DefautlPollOptions} options The options for the poll
     * 
     * @example
     * manager.start(interaction.channel, {
     *      name: "Do you like me ?", //i'm so only
     *      // the poll will last 10 seconds
     *      duration: 10000,
     * })
     */
    async createPoll(channel, options) {
        const mergedOptions = merge(DefaultPollOptions, options)

        if (!mergedOptions.name) throw new Error('options.name is a required parameter')
        if (!mergedOptions.duration) throw new Error('options.name is a requored parameter')

        const startTimestamp = Date.now()

        const poll = new Poll(this, {
            name: mergedOptions.name,
            answers: mergedOptions.answers,
            startAt: startTimestamp,
            endAt: startTimestamp + mergedOptions.duration,
            mainEmbed: mergedOptions.mainEmbed,
            endEmbed: mergedOptions.endEmbed,
            optionsFormat: mergedOptions.optionsFormat,
            resultsFormat: mergedOptions.resultsFormat,
            ended: false
        })

        var pollEmbed = this.generateMainEmbed(poll)

        var message = await channel.send({embeds: [pollEmbed]})

        mergedOptions.answers.map(o => {
            message.react(o.emoji)
            o.votes = 0
        })

        poll.message = await message

        this.polls.push(poll)

        await this.savePoll(message.id, poll.data)

        this.emit("pollCreated", poll)
    }

    /**
     * check the packet
     * @ignore
     * @param {any} packet 
     */
    async _rawPacket(packet) {
        if(!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return

        const poll = this.polls.find(p => p.message.id == packet.d.message_id)
        if(!poll) return

        if(!poll.answers.map(a => a.emoji).includes(packet.d.emoji.name)) return

        const member = poll.message.guild.members.cache.filter(m => !m.user.bot).get(packet.d.user_id)
        if(!member) return

        //packet.d.user.remove(member.id)
            
        if(packet.t == "MESSAGE_REACTION_ADD") await poll.addReaction(packet.d.emoji.name, member)
        else await poll.removeReaction(packet.d.emoji.name, member)
    }

    /**
     * Check each poll and update it
     * @ignore
     */
    async _checkPolls() {
        const time = Date.now()
        this.polls.map(async p => {
            if(p.ended) return

            if(p.endAt <= time) {
                p.end()
            } else {
                var pollEmbed = this.generateMainEmbed(p)

                p.message.edit({embeds: [pollEmbed]})
            }
        })
    }

    /**
     * Init the manager
     * @ignore
     */
    async _init() {
        const polls = await this.getAllPolls()
        polls.map(p => this.polls.push(new Poll(this, p)))

        setInterval(async () => {
            await this._checkPolls.call(this)
        }, this.options.updateEvery)

        this.client.on("raw", p => this._rawPacket(p))
    }
}

module.exports = PollManager

/**
 * Emitted when a poll create
 * @event PollManager#pollCreated
 * @param {Poll} poll The poll instance
 * 
 * @example
 * manager.on("pollCreated", (poll) => {
 *     console.log(`new poll created: ${poll.name}`)
 * })
 */

/**
 * Emitted when a poll ended
 * @event PollManager#pollEnded
 * @param {Poll} poll The poll instance
 * 
 * @example
 * manager.on("pollEnded", (poll) => {
 *     console.log(`new poll ended: ${poll.name}`)
 * })
 */

/**
 * Emitted when someone add a reaction in the poll
 * @event PollManager#addVote
 * @param {Poll} poll The poll instance
 * @param {PollAnswersData} vote The vote
 * @param {GuilMember} member The member who voted
 * 
 * @example
 * manager.on("addVote", (poll) => {
 *     console.log(`${member.nickname} has voted ${vote.name} to the poll ${poll.name}`)
 * })
 */

/**
 * Emitted when someone remove a reaction in the poll
 * @event PollManager#removeVote
 * @param {Poll} poll The poll instance
 * @param {PollAnswersData} vote The vote
 * @param {GuilMember} member The member who voted
 * 
 * @example
 * manager.on("removeVote", (poll) => {
 *     console.log(`${member.nickname} has unvoted ${vote.name} to the poll ${poll.name}`)
 * })
 */