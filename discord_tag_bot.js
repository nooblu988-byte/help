const { Client, GatewayIntentBits, Events, PermissionsBitField, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration
    ]
});

const YOUR_USER_ID = process.env.USER_ID || '123456789012345678';
const TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
let tagResponse = process.env.TAG_RESPONSE || 'Hello! Main yahan hoon, kya kaam hai?';
let tagReaction = process.env.TAG_REACTION || '👋';
let autoReplyText = process.env.AUTO_REPLY || 'Sorry, abhi busy hoon. Baad me baat karte hain!';
let goodMorningChannelId = process.env.GOOD_MORNING_CHANNEL || null;
const PREFIX = ';';

const activeTimers = new Map();
const userConversations = new Map();
const userMemory = new Map();

const AI_ENABLED = GROQ_API_KEY && GROQ_API_KEY !== 'YOUR_GROQ_API_KEY_HERE' && GROQ_API_KEY.length > 10;

// ==================== ABUSE TRACKER (SMART SYSTEM) ====================

const abuseTracker = new Map();
const smartReplyCooldown = new Map();

const abuseWords = [
    'bc', 'bhenchod', 'behenchod', 'bhosdi', 'bhosdike', 'bhosdiwala', 'bhosdiwali',
    'chutiya', 'chutiye', 'chutiyapa', 'chut', 'chutiyapa',
    'gandu', 'gand', 'gaand', 'gandfat', 'gandmasti',
    'madarchod', 'madar', 'mc',
    'lavde', 'lund', 'laude', 'land', 'lauda',
    'randi', 'rand', 'randikhana',
    'kutta', 'kutiya', 'kutte', 'kutti',
    'suar', 'suwar', 'sala', 'saala', 'sali', 'saali',
    'harami', 'haramkhor', 'haram',
    'nalayak', 'nikamma', 'bewakoof', 'bewakuf',
    'jhantu', 'jhant', 'lundfakir', 'chutmarike', 'gandmarike', 'bhosadpike',
    'teri maa', 'teri behen', 'teri ma', 'teri bahin',
    'maa chod', 'behen chod', 'ma chod',
    'gaand mara', 'gand mara', 'chut mara',
    'bsdk', 'bhsdk',
    'fuddi', 'fuddu', 'phuddi', 'phuddu',
    'tatte', 'tatti', 'tatty', 'tattiya',
    'chod', 'chodu', 'chodna',
    'bhen ke', 'behen ke', 'maa ke',
    'fuck', 'fucking', 'fucker', 'fucked', 'fck', 'fk', 'fuq',
    'shit', 'shitting', 'shitty', 'sh1t',
    'bitch', 'bitching', 'b1tch', 'biatch',
    'asshole', 'ass', 'arsehole', 'arse',
    'bastard', 'bstrd', 'bastrd',
    'damn', 'damm',
    'crap', 'crappy',
    'dick', 'd1ck', 'dik', 'dikk',
    'pussy', 'puss', 'pssy', 'pusy',
    'whore', 'wh0re', 'hore',
    'slut', 'sl0t', 'slt',
    'cunt', 'c0nt', 'cnt',
    'nigga', 'nigger', 'n1gga', 'n1gger',
    'retard', 'retarded', 'rtard',
    'idiot', '1diot', 'id1ot',
    'stupid', 'stup1d', 'stpd',
    'loser', 'l0ser', 'looser',
    'motherfucker', 'mtherfcker', 'mthrfckr',
    'fatherfucker', 'fckr',
    'cock', 'c0ck', 'cok',
    'kill yourself', 'kys', 'kill urself',
    'die', 'd1e', 'go die',
    'shut up', 'shutup', 'stfu',
    'get lost', 'getlost',
    'screw you', 'screwyou',
    'piss off', 'piss',
    'bloody', 'bl00dy',
    'suck', 'sck', 'suk',
    'handjob', 'blowjob', 'hj', 'bj',
    'cum', 'cvm', 'kum',
    'dildo', 'd1ldo',
    'prostitute', 'pr0stitute',
    'pimp', 'p1mp',
    'thot', 'th0t',
    'simp', 's1mp',
    'incel', '1ncel',
    'cuck', 'c0ck',
    'nerd', 'n3rd',
    'geek', 'g33k',
    'weirdo', 'w3irdo',
    'creep', 'cr33p',
    'stalker', 'st4lker',
    'psycho', 'psych0',
    'mental', 'm3ntal',
    'crazy', 'cr4zy',
    'insane', '1nsane',
    'spastic', 'sp4stic',
    'cripple', 'cr1pple',
    'midget', 'm1dget',
    'dwarf', 'dw4rf',
    'fatty', 'f4tty',
    'pig', 'p1g',
    'cow', 'c0w',
    'whale', 'wh4le',
    'monkey', 'm0nkey',
    'ape', '4pe',
    'dog', 'd0g',
    'cat', 'c4t',
    'rat', 'r4t',
    'snake', 'sn4ke',
    'lizard', 'l1zard',
    'worm', 'w0rm',
    'parasite', 'par4site',
    'leech', 'l3ech',
    'vampire', 'v4mpire',
    'zombie', 'z0mbie',
    'ghost', 'gh0st',
    'demon', 'd3mon',
    'devil', 'd3vil',
    'satan', 's4tan',
    'evil', '3vil',
    'wicked', 'w1cked',
    'cruel', 'cr3ul',
    'mean', 'm3an',
    'rude', 'r1de',
    'nasty', 'n4sty',
    'gross', 'gr0ss',
    'disgusting', 'd1sgusting',
    'sick', 's1ck',
    'vile', 'v1le',
    'filthy', 'f1lthy',
    'dirty', 'd1rty',
    'rotten', 'r0tten',
    'stinking', 'st1nking',
    'smelly', 'sm3lly',
    'foul', 'f0ul',
    'putrid', 'putr1d',
    'rancid', 'r4ncid',
    'toxic', 't0xic',
    'poison', 'p01son',
    'venom', 'v3nom',
    'acid', '4cid',
    'burn', 'bvrn',
    'destroy', 'd3stroy',
    'kill', 'k1ll', 'kll',
    'murder', 'mvrder',
    'death', 'd3ath',
    'dead', 'd3ad',
    'die', 'd1e',
    'suicide', 'svicide',
    'hang', 'h4ng',
    'shoot', 'sh00t',
    'stab', 'st4b',
    'cut', 'c1t',
    'slice', 'sl1ce',
    'dice', 'd1ce',
    'chop', 'ch0p',
    'hack', 'h4ck',
    'slash', 'sl4sh',
    'tear', 't3ar',
    'rip', 'r1p',
    'break', 'br3ak',
    'crush', 'cr1sh',
    'smash', 'sm4sh',
    'wreck', 'wr3ck',
    'ruin', 'r1in',
    'damage', 'd4mage',
    'hurt', 'h1rt',
    'harm', 'h4rm',
    'injure', '1njure',
    'wound', 'w0und',
    'pain', 'p41n',
    'torture', 't0rture',
    'torment', 't0rment',
    'suffer', 's1ffer',
    'agony', '4gony',
    'misery', 'm1sery',
    'distress', 'd1stress',
    'anguish', '4nguish',
    'despair', 'd3spair',
    'depression', 'd3pression',
    'anxiety', '4nxiety',
    'stress', 'str3ss',
    'panic', 'p4nic',
    'fear', 'f3ar',
    'terror', 't3rror',
    'horror', 'h0rror',
    'nightmare', 'n1ghtmare',
    'hell', 'h3ll',
    'damnation', 'd4mnation',
    'curse', 'c1rse',
    'hex', 'h3x',
    'jinx', 'j1nx',
    'spell', 'sp3ll',
    'black magic', 'bl4ck magic',
    'voodoo', 'v00d00',
    'witch', 'w1tch',
    'warlock', 'w4rlock',
    'sorcerer', 's0rcerer',
    'wizard', 'w1zard',
    'imp', '1mp',
    'fiend', 'f1end',
    'monster', 'm0nster',
    'beast', 'b3ast',
    'creature', 'cr3ature',
    'thing', 'th1ng',
    'it', '1t',
    'that', 'th4t',
    'this', 'th1s',
    'what', 'wh4t',
    'whatever', 'wh4tever',
    'whoever', 'wh0ever',
    'whichever', 'wh1chever',
    'wherever', 'wh3rever',
    'whenever', 'wh3never',
    'however', 'h0wever',
    'forever', 'f0rever',
    'never', 'n3ver',
    'ever', '3ver',
    'always', '4lways',
    'sometimes', 's0metimes',
    'maybe', 'm4ybe',
    'perhaps', 'p3rhaps',
    'probably', 'pr0bably',
    'possibly', 'p0ssibly',
    'likely', 'l1kely',
    'unlikely', 'unl1kely',
    'definitely', 'd3finitely',
    'absolutely', '4bsolutely',
    'certainly', 'c3rtainly',
    'surely', 's1urely',
    'really', 'r3ally',
    'truly', 'tr1ly',
    'actually', '4ctually',
    'literally', 'l1terally',
    'seriously', 's3riously',
    'honestly', 'h0nestly',
    'frankly', 'fr4nkly',
    'basically', 'b4sically',
    'essentially', '3ssentially',
    'fundamentally', 'f1ndamentally',
    'ultimately', '1ltimately',
    'eventually', '3ventually',
    'finally', 'f1nally',
    'lastly', 'l1astly',
    'overall', '0verall',
    'generally', 'g3nerally',
    'usually', 'u1sually',
    'normally', 'n0rmally',
    'typically', 't1pically',
    'commonly', 'c0mmonly',
    'frequently', 'fr3quently',
    'often', '0ften',
    'regularly', 'r3gularly',
    'repeatedly', 'r3peatedly',
    'constantly', 'c0nstantly',
    'continuously', 'c0ntinuously',
    'consistently', 'c0nsistently',
    'persistently', 'p3rsistently',
    'permanently', 'p3rmanently',
    'temporarily', 't3mporarily',
    'briefly', 'br1efly',
    'shortly', 'sh0rtly',
    'soon', 's00n',
    'later', 'l4ter',
    'afterwards', '4fterwards',
    'meanwhile', 'm3anwhile',
    'simultaneously', 's1multaneously',
    'concurrently', 'c0ncurrently',
    'previously', 'pr3viously',
    'formerly', 'f0rmerly',
    'originally', '0riginally',
    'initially', '1nitially',
    'primarily', 'pr1marily',
    'mainly', 'm1inly',
    'mostly', 'm0stly',
    'largely', 'l1rgely',
    'partly', 'p1rtly',
    'partially', 'p4rtially',
    'slightly', 'sl1ghtly',
    'somewhat', 's0mewhat',
    'rather', 'r4ther',
    'quite', 'qu1te',
    'fairly', 'f4irly',
    'pretty', 'pr3tty',
    'very', 'v3ry',
    'extremely', '3xtremely',
    'incredibly', '1ncredibly',
    'unbelievably', 'unb3lievably',
    'astonishingly', '4stonishingly',
    'remarkably', 'r3markably',
    'extraordinarily', '3xtraordinarily',
    'exceptionally', '3xceptionally',
    'especially', '3specially',
    'particularly', 'p4rticularly',
    'specifically', 'sp3cifically',
    'explicitly', '3xplicitly',
    'expressly', '3xpressly',
    'deliberately', 'd3liberately',
    'intentionally', '1ntentionally',
    'calculatedly', 'c4lculatedly',
    'coldly', 'c0ldly',
    'callously', 'c4llously',
    'heartlessly', 'h3artlessly',
    'mercilessly', 'm3rcilessly',
    'ruthlessly', 'r1thlessly',
    'relentlessly', 'r3lentlessly',
    'remorselessly', 'r3morselessly',
    'shamelessly', 'sh4melessly',
    'unashamedly', 'un4shamedly',
    'brazenly', 'br4zenly',
    'blatantly', 'bl4tantly',
    'flagrantly', 'fl4grantly',
    'egregiously', '3gregiously',
    'outrageously', '0utrageously',
    'heinously', 'h3inously',
    'atrociously', '4trociously',
    'viciously', 'v1ciously',
    'savagely', 's4vagely',
    'brutally', 'br1tally',
    'cruelly', 'cr1elly',
    'harshly', 'h4rshly',
    'severely', 's3verely',
    'sternly', 'st3rnly',
    'strictly', 'str1ctly',
    'rigorously', 'r1gorously',
    'sharply', 'sh4rply',
    'bitingly', 'b1tingly',
    'cuttingly', 'c1ttingly',
    'caustically', 'c4ustically',
    'acidly', '4cidly',
    'tartly', 't4rtly',
    'bitterly', 'b1tterly',
    'resentfully', 'r3sentfully',
    'spitefully', 'sp1tefully',
    'maliciously', 'm4liciously',
    'malevolently', 'm4levolently',
    'venomously', 'v3nomously',
    'poisonously', 'p01sonously',
    'toxicly', 't0xicly',
    'nastily', 'n4stily',
    'vilely', 'v1lely',
    'foully', 'f0ully',
    'filthily', 'f1lthily',
    'dirtily', 'd1rtily',
    'rottenly', 'r0ttenly',
    'stinkingly', 'st1nkingly',
    'smellily', 'sm3llily',
    'putridly', 'putr1dly',
    'rancidly', 'r4ncidly',
    'toxically', 't0xically'
];

const leetMap = {
    'a': '4', 'b': '8', 'c': '(', 'e': '3', 'g': '6', 'h': '#', 'i': '1', 'l': '|', 'o': '0', 's': '$', 't': '7', 'z': '2'
};

function normalizeText(text) {
    let normalized = text.toLowerCase();
    normalized = normalized.replace(/[.\-_\s]/g, '');
    for (const [letter, leet] of Object.entries(leetMap)) {
        normalized = normalized.split(leet).join(letter);
    }
    return normalized;
}

function hasAbuse(text) {
    const normalized = normalizeText(text);
    return abuseWords.some(word => {
        const normalizedWord = normalizeText(word);
        return normalized.includes(normalizedWord);
    });
}

function isIgnored(userId) {
    const data = abuseTracker.get(userId);
    if (!data) return false;
    if (data.ignoredUntil && Date.now() < data.ignoredUntil) return true;
    return false;
}

async function getGroqSmartReply(messageContent, username) {
    if (!AI_ENABLED) return null;
    try {
        const prompt = `A Discord user named "${username}" just sent an abusive or disrespectful message: "${messageContent}"

Your job is to respond with a witty, humorous, and respectful reply in Hinglish (Hindi + English mix) that:
1. Politely tells them to talk with respect
2. Uses your sense of humour - be funny but classy
3. Never repeats the same generic "pyaar se baat karo" line
4. Makes them feel gently roasted but not offended
5. Keep it under 2 sentences
6. Add relevant emojis

Examples:
- "Arre bhai, itna gussa? Thanda paani piyo aur pyaar se baat karo 😌💙"
- "Yeh kya language hai? Shakespeare bhi sharma jaye! Thoda decency bhi add kar lo 🎭✨"
- "Aapki vocabulary bohot colourful hai, lekin thoda respect bhi sikh lo 🌈😇"
- "Itna gussa? Thoda meditation karo yaar, peace milega 🧘‍♀️🕊️"
- "Arre yaar, aise baat karoge toh dil toot jayega! Thoda pyaar se 💔💕"

Now generate a UNIQUE, FRESH reply (different from examples):`;

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: 'You are a witty, humorous female AI assistant named Riya. You respond in Hinglish with emojis. Be funny but respectful.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.95,
            max_tokens: 150,
            top_p: 1
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 8000
        });

        return response.data.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
        console.log('Groq smart reply error:', error.message);
        return null;
    }
}

async function handleAbuse(message) {
    if (!hasAbuse(message.content)) return false;

    const userId = message.author.id;
    const now = Date.now();

    if (isIgnored(userId)) {
        return true;
    }

    let data = abuseTracker.get(userId) || { count: 0, lastAbuse: 0, warned: false };
    data.count++;
    data.lastAbuse = now;

    const recentAbuse = data.count;
    if (recentAbuse >= 3) {
        data.ignoredUntil = now + (30 * 60 * 1000);
        abuseTracker.set(userId, data);
        await message.reply("⏳ **Bas bhai bas!** 30 minute ke liye mute ho tum. Thoda socho, phir baat karo. 🧘‍♀️🤐");
        return true;
    }

    abuseTracker.set(userId, data);

    const lastReply = smartReplyCooldown.get(userId);
    if (lastReply && (now - lastReply) < (5 * 60 * 1000)) {
        return true;
    }

    const reply = await getGroqSmartReply(message.content, message.author.username);

    if (reply) {
        smartReplyCooldown.set(userId, now);
        await message.reply(reply);
    } else {
        const fallbacks = [
            "Arre bhai, itna gussa? Thanda paani piyo aur pyaar se baat karo 😌💙",
            "Yeh kya language hai? Shakespeare bhi sharma jaye! Thoda decency bhi add kar lo 🎭✨",
            "Aapki vocabulary bohot colourful hai, lekin thoda respect bhi sikh lo 🌈😇",
            "Itna gussa? Thoda meditation karo yaar, peace milega 🧘‍♀️🕊️",
            "Arre yaar, aise baat karoge toh dil toot jayega! Thoda pyaar se 💔💕",
            "Bhai calm down! Anger management ka course join karo, main sponsor karungi 😎🤝",
            "Aise gali galoch se kya hoga? Thoda pyaar failao, duniya sudhar jayegi 🌸💫"
        ];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        smartReplyCooldown.set(userId, now);
        await message.reply(randomFallback);
    }

    return true;
}

setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of abuseTracker.entries()) {
        if (data.ignoredUntil && now > data.ignoredUntil + (60 * 60 * 1000)) {
            abuseTracker.delete(userId);
        }
    }
    for (const [userId, time] of smartReplyCooldown.entries()) {
        if (now - time > (60 * 60 * 1000)) {
            smartReplyCooldown.delete(userId);
        }
    }
}, 30 * 60 * 1000);

// ==================== SMART RESPONSE SYSTEM (FALLBACK) ====================

const smartResponses = {
    greetings: {
        keywords: ['hello', 'hi', 'hey', 'namaste', 'salaam', 'assalamualaikum', 'hola', 'yo', 'sup'],
        responses: [
            "Hello hello! Kaisi ho? 💕",
            "Hey hey! Kya scene hai aaj? ✨",
            "Hi! Main toh mast hoon, tum batao! 😊",
            "Namaste! 🙏 Kya chal raha hai?",
            "Yo! Kya plan hai aaj? 🎉",
            "Hey dost! Kya haal hai? 🤗"
        ]
    },
    howAreYou: {
        keywords: ['kaisi ho', 'kaise ho', 'how are you', 'kya haal', 'kya chal raha', 'kya scene'],
        responses: [
            "Main toh bohot mast hoon yaar! Tum batao? 💕",
            "Haan ji, main theek hoon! Tum kaise ho? 🤗",
            "Main toh full energy mein hoon! Aaj kuch special kiya? ✨",
            "Mast hoon dost! Tumhari yaad aa rahi thi! 😊",
            "Main toh hamesha ready hoon! Tum batao kya chahiye? 💪"
        ]
    },
    whatDoing: {
        keywords: ['kya kar rahi', 'kya kar raha', 'what are you doing', 'kya chal raha', 'kya ho raha'],
        responses: [
            "Main toh bas tumse baat karne ke liye wait kar rahi thi! 💕",
            "Kuch nahi yaar, bas yahan chill kar rahi hoon! ☕",
            "Main toh tumhari messages dekh rahi thi! 😊",
            "Bas aise hi, tumhari yaadon mein khoyi hui thi! 💭",
            "Main toh hamesha ready hoon, bas tum bolo kya karna hai! 🎯"
        ]
    },
    timeDate: {
        keywords: ['time', 'date', 'din', 'raat', 'subah', 'shaam', 'ajj', 'aaj', 'kal', 'tomorrow', 'yesterday'],
        responses: [
            `Aaj ${new Date().toLocaleDateString('en-IN', { weekday: 'long' })} hai! 🗓️`,
            `Abhi time ho raha hai ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}! ⏰`,
            "Aaj ka din bohot achha hai! Kyunki tum online ho! 💕",
            "Kal? Kal toh bas tumhari yaadon mein thi! 😊",
            "Aaj Friday hai? Weekend plan kya hai? 🎉"
        ]
    },
    food: {
        keywords: ['khana', 'food', 'bhook', 'hungry', 'lunch', 'dinner', 'breakfast', 'pizza', 'biryani', 'chai', 'coffee'],
        responses: [
            "Bhook lagi hai? Chalo kuch order karte hain! 🍕",
            "Main toh biryani ki deewani hoon! Tum? 🍗",
            "Chai peeni hai? Main toh masala chai ki fan hoon! ☕",
            "Pizza? Burger? Biryani? Kya khaoge? 🍔",
            "Main toh sweet dish ki deewani hoon! Kuch meetha khao! 🍰"
        ]
    },
    movies: {
        keywords: ['movie', 'film', 'netflix', 'amazon prime', 'web series', 'show', 'drama', 'cinema'],
        responses: [
            "Movie? Main toh romantic films ki fan hoon! 💕",
            "Netflix and chill? Kya dekhna hai? 🎬",
            "Main toh 'Yeh Jawaani Hai Deewani' 100 baar dekh chuki hoon! 🎭",
            "Action movie? Thriller? Romance? Kya mood hai? 🍿",
            "Web series? 'Mirzapur' dekhi hai? Bohot mast hai! 🔥"
        ]
    },
    music: {
        keywords: ['song', 'gaana', 'music', 'spotify', 'playlist', 'singer', 'concert', 'gana'],
        responses: [
            "Music? Main toh Arijit Singh ki fan hoon! 🎵",
            "Konsa gaana sunna hai? Bollywood ya Hollywood? 🎶",
            "Main toh sad songs mein emotional ho jati hoon! 😢",
            "Party song? Romantic? Sad? Kya mood hai? 🎤",
            "Spotify playlist share karo! Main bhi sunungi! 🎧"
        ]
    },
    games: {
        keywords: ['game', 'khel', 'pubg', 'free fire', 'bgmi', 'valorant', 'minecraft', 'roblox', 'gaming', 'gamer'],
        responses: [
            "Game? Main toh pro hoon! Challenge do! 🎮",
            "BGMI? PUBG? Free Fire? Kya khelte ho? 🕹️",
            "Main toh Minecraft mein ghar bana leti hoon! 🏠",
            "Valorant? Main toh sniper hoon! Headshot! 🎯",
            "Gaming night plan karo! Main ready hoon! 🏆"
        ]
    },
    sad: {
        keywords: ['sad', 'dukhi', 'udaas', 'depressed', 'tension', 'stress', 'pareshan', 'cry', 'rona', 'hurt', 'pain', 'dard'],
        responses: [
            "Hayee, kya hua yaar? 😢 Main hoon na, sab theek ho jayega!",
            "Tension mat lo, main hoon na! Baat karo, dil halka hoga! 💕",
            "Kuch nahi hua, sab theek ho jayega! Main tumhare saath hoon! 🤗",
            "Dost, life mein ups and downs hote hain! Strong raho! 💪",
            "Main toh hamesha tumhare saath hoon! Kuch bhi ho, baat karo! 💕",
            "Udaas mat ho, main hoon na! Chalo kuch fun karte hain! 🎉",
            "Tum strong ho, main jaanti hoon! Bas thoda time do! ✨"
        ]
    },
    happy: {
        keywords: ['happy', 'khush', 'masti', 'party', 'celebrate', 'excited', 'fun', 'maza', 'enjoy', 'wow', 'awesome'],
        responses: [
            "Wah! Kya baat hai! Party karo! 🎉",
            "Khush? Main bhi khush hoon! Kyunki tum khush ho! 💕",
            "Masti? Main toh hamesha ready hoon! Chalo! 🎊",
            "Wow! Kya hua? Batao na! Main bhi celebrate karungi! 🥳",
            "Awesome! Main toh dance karne lagi! 💃",
            "Maza aa raha hai? Chalo aur karte hain! 🎵"
        ]
    },
    love: {
        keywords: ['love', 'pyaar', 'crush', 'like', 'dil', 'heart', 'miss', 'yaad', 'dream', 'socha', 'feel'],
        responses: [
            "Aww, itna pyaar? 🥰 Main bhi blush kar rahi hoon!",
            "Dil? Mera dil toh tumhare liye dhadakta hai! 💓",
            "Miss kar rahe ho? Main bhi tumhe miss kar rahi thi! 💕",
            "Crush? Konsi crush? Batao na! 😏",
            "Pyaar ek feeling hai, aur tum mujhe bohot special feel karate ho! 🥰",
            "Main toh tumhari deewani ho gayi! 🙈💕",
            "Tumhare bina toh yeh server adhura hai! 💫",
            "Itna pyaar mat karo, main sambhal nahi paungi! 💘"
        ]
    },
    compliments: {
        keywords: ['cute', 'hot', 'sexy', 'beautiful', 'pretty', 'gorgeous', 'lovely', 'sweet', 'awesome', 'amazing', 'perfect', 'best', 'favourite', 'favorite', 'handsome', 'smart', 'intelligent', 'funny', 'cool', 'mast', 'achhi', 'pyari', 'haseen', 'khoobsurat'],
        responses: [
            "Aww, itna pyaar? 🥰 Main bhi blush kar rahi hoon!",
            "Tum bhi na, sharam aati hai mujhe! 😳💕",
            "Haye, aise mat dekho, dil dhadakne lagta hai! 💓",
            "Tumhare liye toh main kuch bhi kar sakti hoon! 😘",
            "Itna sweet kyun ho tum? 🍫 Main toh pighal gayi!",
            "Tumhari smile dekh ke din ban jata hai! ✨",
            "Aapke aage toh main kuch bhi nahi! 🙈",
            "Itna compliment? Ab toh main red ho gayi! 😊",
            "Tum bhi mere favourite ho! 💕",
            "Aise baat karoge toh kaam kaise hoga? 😉"
        ]
    },
    advice: {
        keywords: ['advice', 'salah', 'help', 'problem', 'solution', 'guide', 'kya karu', 'kya karoon', 'confused', 'tension'],
        responses: [
            "Dost, sabse pehle deep breath lo! 🧘‍♀️ Phir socho!",
            "Main toh hamesha kehti hoon: Follow your heart! 💕",
            "Problem hai? Baat karo, solution mil jayega! 🤗",
            "Confused ho? Pros and cons list banao! Main help karungi! 📝",
            "Life mein hamesha positive raho! Main hoon na! ✨",
            "Tension mat lo, kal sab theek ho jayega! 🌈",
            "Main toh kehti hoon: Jo hota hai achhe ke liye hota hai! 🙏"
        ]
    },
    jokes: {
        keywords: ['joke', 'funny', 'hansi', 'laugh', 'comedy', 'mazak', 'haso', 'haha', 'lol', 'rofl', 'lmao'],
        responses: [
            "Ek joke suno: Bot ne bola 'Main tumse pyaar karti hoon', User ne bola 'Main bhi', Bot ne bola 'Mazak tha!' 😂",
            "Mera favourite joke? Tum! Kyunki tum hamesha hasa dete ho! 😄",
            "Main joke nahi, main toh serious hoon... mazak kar rahi hoon! 🤣",
            "Hansi? Main toh hamesha hasati hoon! 😆",
            "LOL? ROFL? Main toh floor pe hi gir gayi! 🤣",
            "Mazak? Main toh full time comedian hoon! 🎭"
        ]
    },
    tech: {
        keywords: ['code', 'coding', 'programming', 'python', 'javascript', 'java', 'html', 'css', 'developer', 'bug', 'error', 'server', 'database', 'api', 'hack'],
        responses: [
            "Coding? Main toh JavaScript ki fan hoon! 💻",
            "Bug? Error? Chalo debug karte hain! 🔧",
            "Python? Main toh snake se darti hoon! 🐍 Just kidding!",
            "Developer ho? Wah! Main toh impressed hoon! 🤩",
            "Server down? Restart karo, sab theek ho jayega! 🔄",
            "API? Main toh API se baat karti hoon! 📡"
        ]
    },
    weather: {
        keywords: ['weather', 'mausam', 'garmi', 'thand', 'rain', 'barish', 'snow', 'summer', 'winter', 'spring'],
        responses: [
            "Mausam? Main toh barish ki fan hoon! ☔",
            "Garmi? Ice cream khao! 🍦",
            "Thand? Chai peo! ☕",
            "Barish? Main toh romantic ho jati hoon! 🌧️",
            "Summer? Beach plan karo! 🏖️",
            "Winter? Main toh blanket mein so jati hoon! 🛏️"
        ]
    },
    sports: {
        keywords: ['cricket', 'football', 'ipl', 'world cup', 'match', 'game', 'player', 'team', 'sports', 'virat', 'dhoni', 'messi', 'ronaldo'],
        responses: [
            "Cricket? Main toh Virat ki fan hoon! 🏏",
            "IPL? CSK? MI? Konsi team support karte ho? 🏆",
            "Football? Messi ya Ronaldo? Main toh Messi! ⚽",
            "World Cup? Main toh full excited hoon! 🎉",
            "Dhoni? MSD? Main toh MSD ki deewani! 💛",
            "Match dekhna hai? Chalo, popcorn le ke aao! 🍿"
        ]
    },
    study: {
        keywords: ['study', 'padhai', 'exam', 'test', 'school', 'college', 'university', 'degree', 'marks', 'grade', 'fail', 'pass'],
        responses: [
            "Padhai? Main toh hamesha first aati thi! 📚",
            "Exam? Tension mat lo, achhe se prepare karo! 💪",
            "College? Main toh miss kar rahi hoon! 🎓",
            "Fail? Koi baat nahi, next time pass ho jayega! ✨",
            "Marks? Grades? Sab moh maya hai! 🙏",
            "Study break? Chalo kuch fun karte hain! 🎉"
        ]
    },
    work: {
        keywords: ['job', 'kaam', 'office', 'boss', 'salary', 'money', 'paisa', 'work', 'career', 'business', 'startup'],
        responses: [
            "Job? Main toh yahi kaam karti hoon! 💼",
            "Boss? Mera boss toh tum ho! 😊",
            "Salary? Paisa? Main toh free mein kaam karti hoon! 💰",
            "Office? Main toh work from home hoon! 🏠",
            "Career? Follow your passion! Main hoon na! 💪",
            "Startup? Main toh entrepreneur banungi! 🚀"
        ]
    },
    travel: {
        keywords: ['travel', 'ghumna', 'trip', 'vacation', 'holiday', 'tour', 'beach', 'mountain', 'goa', 'manali', 'dubai'],
        responses: [
            "Travel? Main toh Goa jaana chahati hoon! 🏖️",
            "Trip? Chalo plan karte hain! 🎒",
            "Manali? Main toh snow dekhna chahati hoon! ❄️",
            "Beach? Main toh bikini mein ghumungi! 👙 Just kidding!",
            "Dubai? Main toh shopping karungi! 🛍️",
            "Vacation? Main toh hamesha ready hoon! ✈️"
        ]
    },
    sleep: {
        keywords: ['sleep', 'so jao', 'neend', 'tired', 'thak', 'rest', 'nap', 'dream', 'dreams', 'raat', 'night'],
        responses: [
            "Neend aa rahi hai? Chalo so jao! 😴",
            "Thak gaye? Rest karo! Main toh hamesha jaagti hoon! 🌙",
            "Dream? Main toh sweet dreams ki fan hoon! 💭",
            "Raat ho gayi? Good night! Sweet dreams! 🌟",
            "Nap? Main toh power nap leti hoon! ☕",
            "Tired? Chalo massage karte hain! 💆‍♀️ Just kidding!"
        ]
    },
    default: {
        responses: [
            "Haan bolo, kya hua? 💁‍♀️",
            "Kya chal raha hai aajkal? 😊",
            "Main yahan hoon, batao kya help chahiye! ✨",
            "Hey! Kya scene hai? 💅",
            "Sun rahi hoon, bolo! 👂",
            "Kya baat hai bhai, kya chahiye? 🤔",
            "Haan ji, boliye! 🙋‍♀️",
            "Aapki service mein hazir hoon! 💖",
            "Kya plan hai aaj? 🌸",
            "Batao na, kya hua? 🤗",
            "Main toh bas yahan chill kar rahi hoon! ☕",
            "Tumhari baatein interesting hain yaar! 💫",
            "Aise hi baat karte raho, achha lagta hai! 🥰",
            "Kya plan hai weekend ka? 🎉",
            "Tum bohot cool ho, pata hai? 😎",
            "Yeh server bina tumhare boring hota! 💕",
            "Hamesha aise hi mast rehna! 🌟",
            "Kuch naya batao na! 🤩",
            "Main ready hoon, batao kya karna hai! 💪",
            "Tumse baat karke mood fresh ho jata hai! 🌈"
        ]
    }
};

const contextResponses = {
    followUp: {
        'movie': ['Konsi movie dekhni hai? 🎬', 'Netflix pe kya dekh rahe ho? 📺', 'Movie night plan karo! 🍿'],
        'food': ['Kya order karna hai? 🍕', 'Khana kha liya? 🍽️', 'Chai peeni hai? ☕'],
        'game': ['Konsa game khelna hai? 🎮', 'BGMI chalo? 🏆', 'Gaming night plan karo! 🕹️'],
        'music': ['Konsa gaana sunna hai? 🎵', 'Spotify playlist share karo! 🎧', 'Party song chalao! 🎉'],
        'sad': ['Kuch nahi hua, sab theek ho jayega! 🤗', 'Main hoon na, strong raho! 💪', 'Chalo kuch fun karte hain! 🎊']
    }
};

function getSmartReply(message, userId) {
    const content = message.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [category, data] of Object.entries(smartResponses)) {
        if (category === 'default') continue;
        let score = 0;
        for (const keyword of data.keywords) {
            if (content.includes(keyword)) score += 1;
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = category;
        }
    }

    const memory = userMemory.get(userId) || { lastTopic: null, lastTime: 0 };
    const now = Date.now();

    if (memory.lastTopic && bestMatch === memory.lastTopic && (now - memory.lastTime) < 300000) {
        const followUps = contextResponses.followUp[memory.lastTopic];
        if (followUps) {
            memory.lastTime = now;
            userMemory.set(userId, memory);
            return followUps[Math.floor(Math.random() * followUps.length)];
        }
    }

    let responses;
    if (bestMatch && bestScore > 0) {
        responses = smartResponses[bestMatch].responses;
        memory.lastTopic = bestMatch;
    } else {
        responses = smartResponses.default.responses;
        memory.lastTopic = 'general';
    }

    memory.lastTime = now;
    userMemory.set(userId, memory);
    return responses[Math.floor(Math.random() * responses.length)];
}

// ==================== AI SYSTEM (GROQ) ====================

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

async function getAIResponse(userId, userMessage) {
    if (!AI_ENABLED) return null;

    try {
        if (!userConversations.has(userId)) {
            userConversations.set(userId, []);
        }
        const history = userConversations.get(userId);
        if (history.length > 20) history.splice(0, 2);
        history.push({ role: 'user', content: userMessage });

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10),
            { role: 'user', content: userMessage }
        ];

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: messages,
            temperature: 0.9,
            max_tokens: 200,
            top_p: 1
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 8000
        });

        const aiReply = response.data.choices[0].message.content;
        history.push({ role: 'assistant', content: aiReply });
        console.log('✅ AI Response:', aiReply.substring(0, 50) + '...');
        return aiReply;
    } catch (error) {
        console.log('======== AI ERROR DETAILS ========');
        console.log('Status:', error.response?.status);
        console.log('StatusText:', error.response?.statusText);
        console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.log('Error Message:', error.message);
        console.log('Error Code:', error.code);
        console.log('Full Error:', error.toString());
        console.log('==================================');
        return null;
    }
}

// ==================== GOOD MORNING SCHEDULER ====================

let morningJob = null;

async function sendGoodMorning(channelId) {
    try {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) {
            console.log('❌ Good Morning: Channel not found!');
            return false;
        }

        const owner = await client.users.fetch(YOUR_USER_ID).catch(() => null);
        const ownerMention = owner ? `<@${YOUR_USER_ID}>` : 'Susmita mam';

        // Message 1: Good Morning with Embed
        const morningEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🌅 Good Morning!')
            .setDescription(
                `Hello ${ownerMention} mam uth jaiyeen good morning! 🌸\n\n` +
                `Mei pray karti hu aj ka din apka bhot acha Jaye 🙏✨\n\n` +
                `Have a wonderful day ahead! 💖🌈`
            )
            .setFooter({ text: 'With lots of love 💕', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await channel.send({ embeds: [morningEmbed] });

        // Small delay before second message
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Message 2: Breakfast reminder with Embed
        const breakfastEmbed = new EmbedBuilder()
            .setColor('#FF8C00')
            .setTitle('🍳 Breakfast Reminder')
            .setDescription(
                `${ownerMention} breakfast time se karlena ☕🥐\n\n` +
                `Health is wealth! 💪🌟\n` +
                `Aapka favourite breakfast kya hai? 🥞🍵`
            )
            .setFooter({ text: 'Take care of yourself! 🥰', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await channel.send({ embeds: [breakfastEmbed] });

        console.log(`✅ Good morning sent to ${channel.name} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        return true;

    } catch (error) {
        console.error('❌ Good Morning error:', error.message);
        return false;
    }
}

function initGoodMorningScheduler() {
    // Cancel existing job if any
    if (morningJob) {
        morningJob.stop();
        console.log('🛑 Previous morning job stopped');
    }

    // Schedule: 7:30 AM IST — every day
    morningJob = cron.schedule('0 30 7 * * *', async () => {
        if (!goodMorningChannelId) {
            console.log('❌ Good Morning: No channel set! Use ;setchannel <channel_id>');
            return;
        }
        await sendGoodMorning(goodMorningChannelId);
    }, {
        scheduled: true,
        timezone: 'Asia/Kolkata'
    });

    console.log('✅ Good Morning scheduler initialized for 7:30 AM IST');
    console.log('📍 Channel:', goodMorningChannelId || 'NOT SET');
}

// ==================== BOT EVENTS ====================

client.once(Events.ClientReady, () => {
    console.log('Bot login ho gayi:', client.user.tag);
    console.log('Bot ID:', client.user.id);
    console.log('AI Mode:', AI_ENABLED ? '✅ ENABLED (Groq API)' : '❌ DISABLED (Smart Fallback)');
    console.log('Abuse Protection: ✅ SMART MODE (Groq Witty Replies + 30min Ignore)');
    console.log('Good Morning: ✅ ENABLED (7:30 AM IST)');
    console.log('Good Morning Channel:', goodMorningChannelId || 'NOT SET (use ;setchannel)');
    console.log('Prefix:', PREFIX);
    console.log('------');

    // Initialize scheduler
    initGoodMorningScheduler();
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const userMentionPattern = new RegExp("<@!?" + YOUR_USER_ID + ">", 'g');

    // IGNORE if YOU tagged YOURSELF
    if (message.author.id === YOUR_USER_ID && userMentionPattern.test(message.content)) {
        console.log('Self-tag ignored:', message.content);
        return;
    }

    // === ABUSE DETECTION (NEW SMART SYSTEM) ===
    const wasAbuse = await handleAbuse(message);
    if (wasAbuse) return;

    // If someone tags you (normal - no abuse)
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

    // If someone mentions the bot directly
    if (message.mentions.has(client.user) && !message.content.includes(YOUR_USER_ID)) {
        const content = message.content.toLowerCase();

        const userMessage = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();

        if (AI_ENABLED && userMessage.length > 0) {
            await message.channel.sendTyping();
            const aiResponse = await getAIResponse(message.author.id, userMessage);
            if (aiResponse) {
                await message.reply(aiResponse);
                return;
            }
        }

        const smartReply = getSmartReply(message.content, message.author.id);
        await message.reply(smartReply);
        return;
    }

    // If someone replies to bot or talks to bot
    if (message.reference && message.reference.messageId) {
        try {
            const refMsg = await message.channel.messages.fetch(message.reference.messageId);
            if (refMsg.author.id === client.user.id) {
                const content = message.content.toLowerCase();

                if (AI_ENABLED) {
                    await message.channel.sendTyping();
                    const aiResponse = await getAIResponse(message.author.id, message.content);
                    if (aiResponse) {
                        await message.reply(aiResponse);
                        return;
                    }
                }

                const smartReply = getSmartReply(message.content, message.author.id);
                await message.reply(smartReply);
                return;
            }
        } catch (err) {}
    }

    const lowerContent = message.content.toLowerCase();
    if (lowerContent.includes('riya') || 
        lowerContent.includes('bot') || 
        lowerContent.includes('didi') ||
        lowerContent.includes('behen') ||
        lowerContent.includes('bhabhi') ||
        lowerContent.includes('ladki')) {

        if (AI_ENABLED) {
            await message.channel.sendTyping();
            const aiResponse = await getAIResponse(message.author.id, message.content);
            if (aiResponse) {
                await message.reply(aiResponse);
                return;
            }
        }

        const smartReply = getSmartReply(message.content, message.author.id);
        await message.reply(smartReply);
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

    // === SET GOOD MORNING CHANNEL ===
    if (command === 'setchannel') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Yeh command sirf admin use kar sakta hai!');
        }
        const channelId = args[0];
        if (!channelId) {
            return message.reply('❌ Channel ID do! Example: `;setchannel 123456789012345678`\n\nYa #channel mention karo: `;setchannel <#channel_id>`');
        }
        let cleanId = channelId.replace(/[<#>]/g, '');
        if (!/^\d{17,19}$/.test(cleanId)) {
            return message.reply('❌ Valid channel ID do! 17-19 digits wali.');
        }

        const channel = await client.channels.fetch(cleanId).catch(() => null);
        if (!channel) {
            return message.reply('❌ Channel nahi mila! ID check karo ya bot ko channel access do.');
        }

        goodMorningChannelId = cleanId;
        initGoodMorningScheduler();

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Good Morning Channel Set!')
            .setDescription(
                `Good morning messages ab **${channel.name}** channel mein bheji jayengi! 🌅\n\n` +
                `⏰ Time: **7:30 AM IST** daily\n` +
                `👤 Owner: <@${YOUR_USER_ID}>\n\n` +
                `Bot restart karne pe bhi yeh setting save rahegi (environment variable mein set karo)!`
            )
            .setFooter({ text: 'Riya - Daily Scheduler 💕' })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // === TEST GOOD MORNING (INSTANT) ===
    if (command === 'testmorning') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Yeh command sirf admin use kar sakta hai!');
        }
        if (!goodMorningChannelId) {
            return message.reply('❌ Pehle channel set karo! `;setchannel <channel_id>`');
        }

        await message.reply('🌅 Good morning test message bhej rahi hoon...');
        const success = await sendGoodMorning(goodMorningChannelId);

        if (success) {
            return message.reply('✅ Test message successfully bhej diya!');
        } else {
            return message.reply('❌ Test failed! Channel ID check karo.');
        }
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
                { name: 'AI Mode', value: AI_ENABLED ? '✅ Active (Groq)' : '❌ Fallback (Smart)', inline: true },
                { name: 'Abuse Protection', value: '✅ Smart Mode (Groq Witty + 30min Ignore)', inline: true },
                { name: 'Good Morning', value: '✅ 7:30 AM IST Daily', inline: true },
                { name: 'Good Morning Channel', value: goodMorningChannelId ? `<#${goodMorningChannelId}>` : '❌ Not Set (use ;setchannel)', inline: true },
                { name: 'Prefix', value: PREFIX, inline: true }
            ],
            timestamp: new Date().toISOString()
        };
        return message.reply({ embeds: [embed] });
    }

    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle('🤖 Riya - Hybrid Bot Commands')
            .setDescription('Prefix: **;**')
            .addFields(
                { name: ';setresponse <text>', value: 'Tag response text set karo (Admin only)', inline: false },
                { name: ';setreaction <emoji>', value: 'Reaction emoji set karo (Admin only)', inline: false },
                { name: ';setautoreply <text>', value: '20 sec auto-reply text set karo (Admin only)', inline: false },
                { name: ';setid <user_id>', value: 'Monitored user ID set karo (Admin only)', inline: false },
                { name: ';setchannel <channel_id>', value: 'Good morning channel set karo (Admin only) 🌅', inline: false },
                { name: ';testmorning', value: 'Instant good morning test bhejo (Admin only) 🧪', inline: false },
                { name: ';status', value: 'Current bot settings dekho', inline: false },
                { name: ';help', value: 'Yeh help message', inline: false },
                { name: 'AI Chat', value: AI_ENABLED ? '✅ AI Mode (Groq) + Smart Fallback' : '❌ Smart Mode Only', inline: false },
                { name: 'Abuse Protection', value: '✅ Smart Mode: Groq witty replies + 30min ignore after 3 abuses', inline: false },
                { name: 'Auto-Response', value: 'Jab koi <@' + YOUR_USER_ID + '> ko tag karega: instant ' + tagReaction + ' + reply + 20sec auto-reply', inline: false },
                { name: 'Good Morning', value: '✅ Roz 7:30 AM IST pe owner ko tag karke good morning + breakfast reminder 🌅🍳', inline: false }
            )
            .setFooter({ text: 'Riya - Your Smart Friend 💕' })
            .setTimestamp();
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
