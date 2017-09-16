const fs = require("fs");
const requestify = require("requestify");
const discord = require("discord.js-commando");
const bot = new discord.Client();

bot.on('guildBanAdd', (guild, user) => {
    guild.channels.find('name', "general").send(user + " has been banned!", {tts: true});
});
bot.on('guildBanRemove', (guild, user) => {
    guild.channels.find('name', "general").send(user + " is not banned anymore!", {tts: true});
});

bot.on('guildMemberRemove', member => {
    member.guild.channels.find('name', "general").send("Bye bye, " + member.user + "!", {tts: true});
});

bot.registry.registerDefaults();
bot.registry.registerGroup('cleanchat', "For a cleaner chat");
bot.registry.registerGroup('random', "Random");
bot.registry.registerGroup('misc', "Miscellaneous");
bot.registry.registerCommands([
    class extends discord.Command {
    constructor(client) {
        super(client, {
            name: 'roll',
            group: 'random',
            memberName: 'roll',
            description: "Get a random number within a range",
            args: [
                {
                    key: 'max',
                    prompt: "The maximum value the generated number can have",
                    type: 'integer'
                },
                {
                    key: 'min',
                    prompt: "The minimum value the generated number can have",
                    type: 'integer',
                    default: 1
                }
            ],
            examples: ["!roll 5", "!roll 2 10"]
        });
    }

    async run(message, args) {
        let min = args.min, max = args.max;
        message.reply("The random number is: " + (Math.floor(Math.random() * (max - min)) + min));
    }
}, class extends discord.Command {
    constructor(client) {
        super(client, {
            name: 'giveaway',
            group: 'random',
            memberName: 'giveaway',
            description: "Start the giveaway.",
            args: [
                {
                    key: 'role',
                    prompt: "The role to give away",
                    type: 'role'
                }
            ]
        });
    }

    hasPermission(msg) {
        if(!msg.guild) return this.client.isOwner(msg.author);
        return msg.member.hasPermission('ADMINISTRATOR');
    }

    async run(message, args) {
        try {
            message.delete();
            let participants = message.guild.members.filter(member => !(member.roles.has(args.role.id) || member.user.bot));
            message.channel.send("Giveaway of " + args.role + " is starting! Who is going to win it?");
            if(participants.size === 0) {
                message.channel.send("No one is left in the giveaway.");
                return;
            }
            let winner = participants.random();
            winner.addRole(args.role).then(member => {
                message.channel.send("Winner is: " + winner.user + ". They are now " + args.role);
            }, error => {
                message.reply("Error assigning role: " + error);
            });
        } catch(e) {
            message.reply("An error occurred: " + e);
        }
    }
}, class extends discord.Command {
    constructor(client) {
        super(client, {
            name: 'timeout',
            group: 'cleanchat',
            memberName: 'timeout',
            description: "Timeout a user.",
            detail: "This requires you to have a JAILED role which cannot write messages.",
            args: [
                {
                    key: 'target',
                    prompt: "Who to timeout",
                    type: 'member'
                }, {
                    key: 'role',
                    prompt: "The JAILED role",
                    type: 'role'
                }, {
                    key: 'time',
                    prompt: "The amount of time to timeout for (in seconds)",
                    type: 'integer',
                    default: 60
                }
            ]
        });
    }

    hasPermission(msg) {
        if(!msg.guild) return this.client.isOwner(msg.author);
        return msg.member.hasPermission('kickMembers') || msg.member.hasPermission('banMembers');
    }

    async run(message, args) {
        message.delete();
        args.target.addRole(args.role);
        message.reply(args.target.user + " is timeouted for " + args.time + " seconds.");
        setTimeout(() => {
            if(!(args.target.roles.has(args.role.id))) {
                args.target.removeRole(args.role);
                message.reply(args.target.user + " is now free.");
            }
        }, args.time * 1000);
    }
}, class extends discord.Command {
    constructor(client) {
        super(client, {
            name: 'repeat',
            group: 'util',
            memberName: 'repeat',
            description: "Make this repeat a message a certain amount of times",
            args: [
                {
                    key: 'times',
                    prompt: "Amount of times to repeat",
                    type: 'integer'
                },
                {
                    key: 'message',
                    prompt: "The message to repeat",
                    type: 'string'
                }
            ]
        });
    }

    hasPermission(msg) {
        if(!msg.guild) return this.client.isOwner(msg.author);
        return msg.member.hasPermission('MANAGE_MESSAGES');
    }

    async run(message, args) {
        for(let n=0;n<args.times;n++) {
            message.channel.send(args.message);
        }
    }
}]);

fs.readFile("bot-token.txt", (err, data) => {
    if(err) throw err;
    // language=TEXT
    if(data.toString().split('\n', 1)[0].trim() === "<put your bot's token here>") console.warn("Please paste your bot token in bot-token.txt!");
    bot.login(data.toString().split('\n', 1)[0].trim()).then(token => console.log("Connected to Discord!"), error => setTimeout(() => {throw error}));
});