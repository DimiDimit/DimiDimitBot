console.info("Loading libraries and registering bot...");
const fs = require("fs");
const requestify = require("requestify");
const discord = require("discord.js-commando");
const bot = new discord.Client();

let isCounting = false;

bot.on('guildBanAdd', (guild, user) => {
    guild.channels.find('name', "general").send(`${user} has been banned!`, {tts: true});
});
bot.on('guildBanRemove', (guild, user) => {
    guild.channels.find('name', "general").send(`${user} is not banned anymore!`, {tts: true});
});

bot.on('guildMemberRemove', member => {
    member.guild.channels.find('name', "general").send(`Bye bye, ${member.user}!`, {tts: true});
});

bot.registry.registerDefaults();
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
            ]
        });
    }

    async run(message, args) {
        let min = args.min, max = args.max;
        message.reply(`The random number is: ${Math.floor(Math.random() * (max - min)) + min}`);
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
            message.channel.send(`Giveaway of ${args.role} is starting! Who is going to win it?`);
            if(participants.size === 0) {
                message.channel.send("No one is left in the giveaway.");
                return;
            }
            let winner = participants.random();
            winner.addRole(args.role).then(member => {
                message.channel.send(`Winner is: ${winner.user}. They are now ${args.role}`);
            }, error => {
                message.reply(`Error assigning role: ${error}`);
            });
        } catch(e) {
            message.reply(`An error occurred: ${e}`);
        }
    }
}, class extends discord.Command {
    constructor(client) {
        super(client, {
            name: 'temprole',
            group: 'util',
            memberName: 'temprole',
            description: "Assign a role to a user temporarily.",
            args: [
                {
                    key: 'target',
                    prompt: "Who to assign the role to",
                    type: 'member'
                }, {
                    key: 'role',
                    prompt: "The role to assign",
                    type: 'role'
                }, {
                    key: 'time',
                    prompt: "The amount of seconds to assign it for",
                    type: 'integer',
                    default: 60
                }
            ]
        });
    }

    hasPermission(msg) {
        if(!msg.guild) return this.client.isOwner(msg.author);
        return msg.member.hasPermission('KICK_MEMBERS') || msg.member.hasPermission('BAN_MEMBERS');
    }

    async run(message, args) {
        message.delete();
        args.target.addRole(args.role);
        message.reply(`${args.target.user} has the role ${args.role} for ${args.time} seconds.`);
        setTimeout(() => {
            if(args.target.roles.has(args.role.id)) {
                args.target.removeRole(args.role);
                message.reply(`${args.target.user} doesn't have ${args.role} anymore.`);
            } else {
                message.reply(`The role ${args.role} of ${args.target.user} has been removed in another way before the time is out. Nothing is going to happen.`);
            }
        }, args.time * 1000);
    }
}, class extends discord.Command {
    constructor(client) {
        super(client, {
            name: 'count',
            group: 'util',
            memberName: 'count',
            description: "Make this count from a number to another number, either sending new message for every step or editing the same message. It then deletes them.",
            args: [
                {
                    key: 'start',
                    prompt: "The number to start at",
                    type: 'float'
                }, {
                    key: 'end',
                    prompt: "The last number to count to",
                    type: 'float'
                }, {
                    key: 'step',
                    prompt: "The amount to increase/decrease each time (whether to increase or decrease is decided automatically, it doesn't matter if you enter a negative number)",
                    type: 'float',
                    default: 1
                }, {
                    key: 'delay',
                    prompt: "The amount of milliseconds between each step",
                    type: 'integer',
                    default: 1000
                }, {
                    key: 'edit',
                    prompt: "Whether to send a new message for each step (false) or edit the same message (true)",
                    type: 'boolean',
                    default: false
                }
            ]
        });
    }

    hasPermission(msg) {
        if(!msg.guild) return this.client.isOwner(msg.author);
        return msg.member.hasPermission('MANAGE_MESSAGES');
    }

    async run(message, args) {
        isCounting = true;
        let isIncreasing = args.start < args.end, stepAmount = Math.abs(args.step);
        function step(value, amount) {
            return isIncreasing ? value + amount : value - amount;
        }
        function hasEnded(value) {
            return !isCounting || (isIncreasing ? value >= args.end : value <= args.end);
        }
        let current = args.start;
        let cmessage, messages = [];
        if(args.edit)
            cmessage = await message.channel.send(current);
        let isLastValueLast = false;
        let stepF = async () => {
            if(isLastValueLast) {
                if(args.edit)
                    cmessage.delete();
                else
                    for(let wmessage of messages) wmessage.delete();
                message.delete();
                isCounting = false;
                return;
            }
            isLastValueLast = hasEnded(current);
            if(args.edit)
                await cmessage.edit(current);
            else
                messages.push(await message.channel.send(current));
            if(!isLastValueLast)
                current = step(current, stepAmount);
            setTimeout(stepF, args.delay);
        };
        setTimeout(stepF, args.delay);
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
}, class extends discord.Command {
    constructor(client) {
        super(client, {
            name: 'deletelast',
            group: 'util',
            memberName: 'deletelast',
            description: "Delete the last `amount` messages. `amount` excludes the message you will send to execute this command, but that one will also be deleted.",
            args: [
                {
                    key: 'amount',
                    prompt: "Amount of messages to delete, excluding the message you will send to execute this command, which will also be deleted",
                    type: 'integer'
                }
            ]
        });
    }

    hasPermission(msg) {
        if(!msg.guild) return this.client.isOwner(msg.author);
        return msg.member.hasPermission('MANAGE_MESSAGES');
    }

    async run(message, args) {
        let messages = Array.from(message.channel.messages.values());
        messages[messages.length - 1].delete();
        messages = messages.slice(messages.length - (args.amount + 1), messages.length - 1).reverse();
        for(let wmessage of messages) wmessage.delete();
    }
}]);

fs.readFile("bot-token.txt", (err, data) => {
    if(err) throw err;
    console.info("Connecting to Discord...");
    // language=TEXT
    if(data.toString().split('\n', 1)[0].trim() === "<put your bot's token here>") console.warn("Please paste your bot token in bot-token.txt!");
    bot.login(data.toString().split('\n', 1)[0].trim()).then(token => console.info("Connected to Discord!"), error => setTimeout(() => {throw error}));
});