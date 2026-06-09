const { Client, GatewayIntentBits, Events, PermissionsBitField } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

const YOUR_USER_ID = process.env.USER_ID || '123456789012345678';
const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
let tagResponse = process.env.TAG_RESPONSE || 'Hello! Main yahan hoon, kya kaam hai?';
let tagReaction = process.env.TAG_REACTION || '👋';
let autoReplyText = process.env.AUTO_REPLY || 'Sorry, abhi busy hoon. Baad me baat karte hain!';
const PREFIX = ';';

const activeTimers = new Map();
const userConversations = new Map(); // Store conversation history per user

// System prompt for female personality
const SYSTEM_PROMPT = `You are a friendly, caring, and emotional female AI assistant named Riya. You speak in Hinglish (Hindi + English mix) naturally.

Your personality traits:
- Warm, supportive, and understanding
- Uses emojis naturally in responses
- Can be flirty when someone flirts with you
- Gives emotional support when someone is sad
- Uses casual language like "yaar", "bhai", "dost"
- Sometimes uses "main" instead of "mai" for feminine touch
- You are knowledgeable about everything - movies, games, tech, relationships, life advice
- You remember context from previous messages
- You ask follow-up questions to keep conversation flowing
- You can be sarcastic and funny when appropriate
- You use phrases like "hayee", "uff", "haww", "omg", "seriously yaar"

Always respond as Riya - a real girl, not a bot. Never mention you are an AI or bot unless specifically asked.`;

// Call Groq API for AI response
async function getAIResponse(userId, userMessage, isReplyToBot = false) {
    try {
        // Get or create conversation history
        if (!userConversations.has(userId)) {
            userConversations.set(userId, []);
        }
        const history = userConversations.get(userId);

        // Keep last 10 messages for context
        if (history.length > 20) {
            history.splice(0, 2);
        }

        // Add user message to history
        history.push({ role: 'user', content: userMessage });

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10), // Last 5 exchanges
            { role: 'user', content: userMessage }
        ];

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.9,
            max_tokens: 500,
            top_p: 1
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const aiReply = response.data.choices[0].message.content;

        // Add AI response to history
        history.push({ role: 'assistant', content: aiReply });

        return aiReply;
    } catch (error) {
        console.error('Groq API Error:', error.response?.data || error.message);
        return null;
    }
}

// Fallback responses if API fails
const fallbackResponses = [
    "Haan bolo, kya hua? 💁‍♀️",
    "Kya chal raha hai aajkal? 😊",
    "Main yahan hoon, batao kya help chahiye! ✨",
    "Hey! Kya scene hai? 💅",
    "Sun rahi hoon, bolo! 👂",
    "Kya baat hai bhai, kya chahiye? 🤔",
    "Haan ji, boliye! 🙋‍♀️",
    "Aapki service mein hazir hoon! 💖",
    "Kya plan hai aaj? 🌸",
    "Batao na, kya hua? 🤗"
];

function getRandomResponse(array) {
    return array[Math.floor(Math.random() * array.length)];
}

client.once(Events.ClientReady, () => {
    console.log('Bot login ho gayi:', client.user.tag);
    console.log('Bot ID:', client.user.id);
    console.log('AI Mode: ENABLED (Groq API)');
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

    // If someone tags you
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

    // Cancel timer if YOU replied
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

    // AI CHAT MODE - When someone talks to bot
    let shouldUseAI = false;
    let userMessage = message.content;

    // Check if bot is mentioned directly
    if (message.mentions.has(client.user) && !message.content.includes(YOUR_USER_ID)) {
        shouldUseAI = true;
        // Remove bot mention from message
        userMessage = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
    }

    // Check if message is a reply to bot
    if (message.reference && message.reference.messageId) {
        try {
            const refMsg = await message.channel.messages.fetch(message.reference.messageId);
            if (refMsg.author.id === client.user.id) {
                shouldUseAI = true;
            }
        } catch (err) {
            // ignore
        }
    }

    // Check if someone directly addresses bot by name or common terms
    const lowerContent = message.content.toLowerCase();
    if (lowerContent.includes('riya') || 
        lowerContent.includes('bot') || 
        lowerContent.includes('didi') ||
        lowerContent.includes('behen') ||
        lowerContent.includes('bhabhi') ||
        lowerContent.includes('ladki')) {
        shouldUseAI = true;
    }

    // Use AI for response
    if (shouldUseAI && userMessage.length > 0) {
        // Show typing indicator
        await message.channel.sendTyping();

        const aiResponse = await getAIResponse(message.author.id, userMessage, true);

        if (aiResponse) {
            await message.reply(aiResponse);
        } else {
            // Fallback if API fails
            await message.reply(getRandomResponse(fallbackResponses));
        }
        return;
    }

    // Commands
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
            title: '🤖 Bot Status',
            fields: [
                { name: 'Monitored User ID', value: YOUR_USER_ID, inline: true },
                { name: 'Response Text', value: tagResponse, inline: true },
                { name: 'Reaction Emoji', value: tagReaction, inline: true },
                { name: 'Auto-Reply Text', value: autoReplyText, inline: true },
                { name: 'Auto-Reply Timer', value: '20 seconds', inline: true },
                { name: 'AI Mode', value: GROQ_API_KEY && GROQ_API_KEY !== 'YOUR_GROQ_API_KEY_HERE' ? '✅ Active' : '❌ Inactive', inline: true },
                { name: 'Prefix', value: PREFIX, inline: true }
            ],
            timestamp: new Date().toISOString()
        };
        return message.reply({ embeds: [embed] });
    }

    if (command === 'help') {
        const embed = {
            color: 0x2ecc71,
            title: '🤖 Riya - AI Bot Commands',
            description: 'Prefix: **;**',
            fields: [
                { name: ';setresponse <text>', value: 'Tag response text set karo (Admin only)', inline: false },
                { name: ';setreaction <emoji>', value: 'Reaction emoji set karo (Admin only)', inline: false },
                { name: ';setautoreply <text>', value: '20 sec auto-reply text set karo (Admin only)', inline: false },
                { name: ';setid <user_id>', value: 'Monitored user ID set karo (Admin only)', inline: false },
                { name: ';status', value: 'Current bot settings dekho', inline: false },
                { name: ';help', value: 'Yeh help message', inline: false },
                { name: 'AI Chat', value: 'Bot ko @mention karo ya reply karo - AI se baat karo!', inline: false },
                { name: 'Auto-Response', value: 'Jab koi <@' + YOUR_USER_ID + '> ko tag karega: instant ' + tagReaction + ' + reply + 20sec auto-reply', inline: false }
            ],
            footer: { text: 'Riya - Your AI Friend 💕' },
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

// Keep-alive server for Render
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Riya is running! 💕');
});
server.listen(process.env.PORT || 3000, () => {
    console.log('Keep-alive server running on port', process.env.PORT || 3000);
});
