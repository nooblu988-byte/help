const { Client, GatewayIntentBits, Events, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Use environment variables for Render (safer than hardcoding)
const YOUR_USER_ID = process.env.USER_ID || 'YOUR_USER_ID_HERE';
const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
let tagResponse = process.env.TAG_RESPONSE || 'Hello! Main yahan hoon, kya kaam hai?';
let tagReaction = process.env.TAG_REACTION || '👋';
let autoReplyText = process.env.AUTO_REPLY || 'Sorry, abhi busy hoon. Baad me baat karte hain!';
const PREFIX = ';';

const activeTimers = new Map();

client.once(Events.ClientReady, () => {
    console.log('Bot login ho gaya:', client.user.tag);
    console.log('Bot ID:', client.user.id);
    console.log('Prefix:', PREFIX);
    console.log('------');
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const userMentionPattern = new RegExp("<@!?" + YOUR_USER_ID + ">", 'g');

    // IGNORE if YOU tagged YOURSELF
    if (message.author.id === YOUR_USER_ID && userMentionPattern.test(message.content)) {
        console.log('Self-tag ignored:', message.content);
        return;
    }

    if (userMentionPattern.test(message.content)) {
        message.react(tagReaction).catch(err => console.log('Reaction error:', err));

        const replyMsg = await message.reply(tagResponse);

        const timerKey = message.channel.id + '-' + message.id;

        if (activeTimers.has(timerKey)) {
            clearTimeout(activeTimers.get(timerKey));
        }

        const timer = setTimeout(async () => {
            try {
                await message.reply({
                    content: autoReplyText,
                    allowedMentions: { repliedUser: true }
                });
            } catch (err) {
                console.log('Auto-reply error:', err);
            }
            activeTimers.delete(timerKey);
        }, 20000);

        activeTimers.set(timerKey, timer);
        return;
    }

    if (message.author.id === YOUR_USER_ID && message.reference) {
        const refMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
        if (refMsg && userMentionPattern.test(refMsg.content)) {
            const timerKey = message.channel.id + '-' + message.reference.messageId;
            if (activeTimers.has(timerKey)) {
                clearTimeout(activeTimers.get(timerKey));
                activeTimers.delete(timerKey);
                console.log('Auto-reply cancelled - user responded!');
            }
        }
    }

    if (message.mentions.has(client.user)) {
        await message.reply('Hello! Main ek bot hoon, ;help se commands dekh sakte ho.');
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'setresponse') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('Yeh command sirf admin use kar sakta hai!');
        }
        const newResponse = args.join(' ');
        if (!newResponse) return message.reply('Text bhi toh do! Example: ;setresponse Hello bro!');
        tagResponse = newResponse;
        return message.reply('Response update ho gayi: **' + newResponse + '**');
    }

    if (command === 'setreaction') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('Yeh command sirf admin use kar sakta hai!');
        }
        const newReaction = args[0];
        if (!newReaction) return message.reply('Emoji do! Example: ;setreaction 🔥');
        tagReaction = newReaction;
        return message.reply('Reaction emoji update ho gaya: ' + newReaction);
    }

    if (command === 'setautoreply') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('Yeh command sirf admin use kar sakta hai!');
        }
        const newText = args.join(' ');
        if (!newText) return message.reply('Text bhi toh do! Example: ;setautoreply Sorry busy hoon!');
        autoReplyText = newText;
        return message.reply('Auto-reply text update ho gaya: **' + newText + '**');
    }

    if (command === 'setid') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('Yeh command sirf admin use kar sakta hai!');
        }
        const newId = args[0];
        if (!newId || !/^\d{17,19}$/.test(newId)) {
            return message.reply('Valid Discord User ID do! 17-19 digits wali.');
        }
        return message.reply('User ID ' + newId + ' set karni hai? Bot restart karo config update karke. Current ID: ' + YOUR_USER_ID);
    }

    if (command === 'status') {
        const embed = {
            color: 0x3498db,
            title: 'Bot Status',
            fields: [
                { name: 'Monitored User ID', value: YOUR_USER_ID, inline: true },
                { name: 'Response Text', value: tagResponse, inline: true },
                { name: 'Reaction Emoji', value: tagReaction, inline: true },
                { name: 'Auto-Reply Text', value: autoReplyText, inline: true },
                { name: 'Auto-Reply Timer', value: '20 seconds', inline: true },
                { name: 'Prefix', value: PREFIX, inline: true }
            ],
            timestamp: new Date().toISOString()
        };
        return message.reply({ embeds: [embed] });
    }

    if (command === 'help') {
        const embed = {
            color: 0x2ecc71,
            title: '🤖 Bot Commands',
            description: 'Prefix: **;**',
            fields: [
                { name: ';setresponse <text>', value: 'Tag response text set karo (Admin only)', inline: false },
                { name: ';setreaction <emoji>', value: 'Reaction emoji set karo (Admin only)', inline: false },
                { name: ';setautoreply <text>', value: '20 sec auto-reply text set karo (Admin only)', inline: false },
                { name: ';setid <user_id>', value: 'Monitored user ID set karo (Admin only)', inline: false },
                { name: ';status', value: 'Current bot settings dekho', inline: false },
                { name: ';help', value: 'Yeh help message', inline: false },
                { name: 'Auto-Response', value: 'Jab koi <@' + YOUR_USER_ID + '> ko tag karega: instant ' + tagReaction + ' + reply + 20sec auto-reply', inline: false }
            ],
            footer: { text: 'Discord Tag Response Bot' },
            timestamp: new Date().toISOString()
        };
        return message.reply({ embeds: [embed] });
    }
});

client.on(Events.Error, (error) => {
    console.error('Bot error:', error);
});

client.login(TOKEN).catch(err => {
    console.error('Login failed:', err.message);
    process.exit(1);
});

// Keep alive for Render (optional but recommended)
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running!');
});
server.listen(process.env.PORT || 3000, () => {
    console.log('Keep-alive server running on port', process.env.PORT || 3000);
});
