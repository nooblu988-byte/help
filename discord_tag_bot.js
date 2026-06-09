const { Client, GatewayIntentBits, Events, PermissionsBitField } = require('discord.js');
const axios = require('axios');

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
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
let tagResponse = process.env.TAG_RESPONSE || 'Hello! Main yahan hoon, kya kaam hai?';
let tagReaction = process.env.TAG_REACTION || '👋';
let autoReplyText = process.env.AUTO_REPLY || 'Sorry, abhi busy hoon. Baad me baat karte hain!';
const PREFIX = ';';

const activeTimers = new Map();
const userConversations = new Map();

// ==================== ABUSE DETECTION SYSTEM ====================

// Hindi + English abuse words (comprehensive list)
const abuseWords = [
    // Hindi Gaaliyan
    'bc', 'bhenchod', 'behenchod', 'bhosdi', 'bhosdike', 'bhosdiwala', 'bhosdiwali',
    'chutiya', 'chutiye', 'chutiyapa', 'chut', 'chutiya', 'chutiyapa',
    'gandu', 'gand', 'gaand', 'gandfat', 'gandmasti', 'gandu',
    'madarchod', 'madar', 'mc',
    'lavde', 'lund', 'laude', 'land', 'lauda',
    'randi', 'rand', 'randikhana', 'randi',
    'kutta', 'kutiya', 'kutte', 'kutti',
    'suar', 'suwar', 'sala', 'saala', 'sali', 'saali',
    'harami', 'haramkhor', 'haram',
    'nalayak', 'nikamma', 'bewakoof', 'bewakuf', 'bewakoof',
    'jhantu', 'jhant', 'jhantu',
    'lundfakir', 'chutmarike', 'gandmarike', 'bhosadpike',
    'teri maa', 'teri behen', 'teri ma', 'teri bahin',
    'maa chod', 'behen chod', 'ma chod',
    'gaand mara', 'gand mara', 'chut mara',
    'bsdk', 'bhsdk', 'bhosdike',
    'chutiya sala', 'gandu sala', 'madarchod sala',
    'teri', 'maaki', 'behenki', 'bhosdi',
    'fuddi', 'fuddu', 'phuddi', 'phuddu',
    'tatte', 'tatti', 'tatty', 'tattiya',
    'chod', 'chodu', 'chodna',
    'gaand', 'gand', 'gaandu',
    'lauda', 'lauda', 'land',
    'bhen ke', 'behen ke', 'maa ke',
    'chutiya', 'chutiyapa', 'chutiyapanti',
    'gandu', 'gandfat', 'gandmasti',
    'bhosdike', 'bhosdiwala', 'bhosdiwali',
    'madarchod', 'behenchod', 'bhenchod',
    'randi', 'rand', 'randikhana',
    'kutta', 'kutiya', 'kutte',
    'suar', 'harami', 'nalayak',
    'bewakoof', 'jhantu', 'lundfakir',
    'chutmarike', 'gandmarike',
    'teri maa ki', 'teri behen ki',
    'maa chod', 'behen chod',
    'gaand mar', 'chut mar',
    'bsdk', 'bhsdk',
    'chutiya', 'gandu', 'madarchod',
    'randi', 'kutta', 'suar',
    'harami', 'nalayak', 'bewakoof',
    'jhantu', 'lund', 'chut',
    'gand', 'bhosdi', 'mc', 'bc',

    // English Abuse
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
    'ugly', 'ug1y',
    'fat', 'f4t',
    'worthless', 'worth1ess',
    'useless', 'use1ess',
    'trash', 'tr4sh',
    'garbage', 'g4rbage',
    'damn', 'd4mn',
    'hell', 'h3ll',
    'crap', 'cr4p',
    'stupid', 'dumb', 'moron', 'imbecile',
    'jerk', 'douche', 'douchebag',
    'wanker', 'tosser', 'twat',
    'prick', 'knob', 'tool',
    'dipshit', 'dumbass', 'jackass',
    'motherfucker', 'mtherfcker', 'mthrfckr',
    'fatherfucker', 'fckr',
    'cock', 'c0ck', 'cok',
    'balls', 'b4lls',
    'tits', 't1ts', 'titty',
    'boobs', 'b00bs',
    'penis', 'p3nis', 'pen1s',
    'vagina', 'v4gina', 'vag1na',
    'sex', 's3x', 'sexx',
    'porn', 'p0rn', 'prn',
    'rape', 'r4pe', 'rap3',
    'kill yourself', 'kys', 'kill urself',
    'die', 'd1e', 'go die',
    'shut up', 'shutup', 'stfu',
    'get lost', 'getlost',
    'screw you', 'screwyou',
    'piss off', 'piss',
    'bloody', 'bl00dy',
    'hell', 'he11',
    'damn', 'd4mn',
    'crap', 'cr4p',
    'suck', 'sck', 'suk',
    'blow', 'bl0w',
    'job', 'j0b',
    'handjob', 'blowjob', 'hj', 'bj',
    'cum', 'cvm', 'kum',
    'semen', 's3men',
    'orgasm', '0rgasm',
    'masturbate', 'mastrbate', 'masturb8',
    'dildo', 'd1ldo',
    'condom', 'c0ndom',
    'viagra', 'v1agra',
    'prostitute', 'pr0stitute',
    'pimp', 'p1mp',
    'slut', 'whore', 'skank',
    'hoe', 'h0e',
    'thot', 'th0t',
    'simp', 's1mp',
    'incel', '1ncel',
    'cuck', 'c0ck',
    'beta', 'b3ta',
    'virgin', 'v1rgin',
    'nerd', 'n3rd',
    'geek', 'g33k',
    'weirdo', 'w3irdo',
    'creep', 'cr33p',
    'stalker', 'st4lker',
    'psycho', 'psych0',
    'mental', 'm3ntal',
    'crazy', 'cr4zy',
    'insane', '1nsane',
    'retard', 'rtard',
    'spastic', 'sp4stic',
    'cripple', 'cr1pple',
    'midget', 'm1dget',
    'dwarf', 'dw4rf',
    'fatty', 'f4tty',
    'pig', 'p1g',
    'cow', 'c0w',
    'whale', 'wh4le',
    'elephant', 'el3phant',
    'hippo', 'h1ppo',
    'gorilla', 'g0rilla',
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
    'gross', 'gr0ss',
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
    'destroy', 'd3stroy',
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
    'demon', 'd3mon',
    'devil', 'd3vil',
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
    'purposely', 'p1rposely',
    'consciously', 'c0nsciously',
    'knowingly', 'kn0wingly',
    'willfully', 'w1llfully',
    'voluntarily', 'v0luntarily',
    'involuntarily', '1nvoluntarily',
    'accidentally', '4ccidentally',
    'unintentionally', 'un1ntentionally',
    'unconsciously', 'unc0nsciously',
    'subconsciously', 'subc0nsciously',
    'instinctively', '1nstinctively',
    'automatically', '4utomatically',
    'mechanically', 'm3chanically',
    'reflexively', 'r3flexively',
    'spontaneously', 'sp0ntaneously',
    'impulsively', '1mpulsively',
    'compulsively', 'c0mpulsively',
    'obsessively', '0bsessively',
    'addictively', '4ddictively',
    'habitually', 'h4bitually',
    'customarily', 'c0stomarily',
    'traditionally', 'tr4ditionally',
    'conventionally', 'c0nventionally',
    'unconventionally', 'unc0nventionally',
    'unusually', 'un1sually',
    'abnormally', '4bnormally',
    'extraordinarily', '3xtraordinarily',
    'uniquely', 'un1quely',
    'singularly', 's1ngularly',
    'peculiarly', 'p3culiarly',
    'strangely', 'str4ngely',
    'oddly', '0ddly',
    'curiously', 'c1riously',
    'interestingly', '1nterestingly',
    'surprisingly', 's1rprisingly',
    'unexpectedly', 'un3xpectedly',
    'predictably', 'pr3dictably',
    'unsurprisingly', 'uns1rprisingly',
    'naturally', 'n4turally',
    'obviously', '0bviously',
    'clearly', 'cl3arly',
    'evidently', '3vidently',
    'apparently', '4pparently',
    'seemingly', 's3emingly',
    'presumably', 'pr3sumably',
    'supposedly', 'supp0sedly',
    'allegedly', '4llegedly',
    'reportedly', 'r3portedly',
    'supposedly', 'supp0sedly',
    'arguably', '4rguably',
    'debatably', 'd3batably',
    'possibly', 'p0ssibly',
    'potentially', 'p0tentially',
    'theoretically', 'th3oretically',
    'hypothetically', 'hyp0thetically',
    'ideally', '1deally',
    'realistically', 'r3alistically',
    'practically', 'pr4ctically',
    'logically', 'l0gically',
    'illogically', '1llogically',
    'irrationally', '1rrationally',
    'reasonably', 'r3asonably',
    'unreasonably', 'unr3asonably',
    'sensibly', 's3nsibly',
    'insensibly', '1nsensibly',
    'absurdly', '4bsurdly',
    'ridiculously', 'r1diculously',
    'ludicrously', 'l1dicrously',
    'outrageously', '0utrageously',
    'scandalously', 'sc4ndalously',
    'shockingly', 'sh0ckingly',
    'appallingly', '4ppallingly',
    'disgustingly', 'd1sgustingly',
    'revoltingly', 'r3voltingly',
    'repulsively', 'r3pulsively',
    'offensively', '0ffensively',
    'insultingly', '1nsultingly',
    'contemptuously', 'c0ntemptuously',
    'disdainfully', 'd1sdainfully',
    'scornfully', 'sc0rnfully',
    'mockingly', 'm0ckingly',
    'derisively', 'd3risively',
    'sarcastically', 's4rcastically',
    'ironically', '1ronically',
    'cynically', 'c1nically',
    'skeptically', 'sk3ptically',
    'doubtfully', 'd0ubtfully',
    'suspiciously', 's1spiciously',
    'warily', 'w4rily',
    'cautiously', 'c4utiously',
    'carefully', 'c4refully',
    'recklessly', 'r3cklessly',
    'carelessly', 'c4relessly',
    'negligently', 'n3gligently',
    'irresponsibly', '1rresponsibly',
    'foolishly', 'f00lishly',
    'stupidly', 'st1pidly',
    'idiotically', '1diotically',
    'absurdly', '4bsurdly',
    'nonsensically', 'n0nsensically',
    'irrationally', '1rrationally',
    'unthinkingly', 'unth1nkingly',
    'mindlessly', 'm1ndlessly',
    'senselessly', 's3nselessly',
    'pointlessly', 'p0intlessly',
    'needlessly', 'n3edlessly',
    'unnecessarily', 'unn3cessarily',
    'gratuitously', 'gr4tuitously',
    'wanton', 'w4nton',
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
    'harshly', 'h4rshly',
    'sharply', 'sh4rply',
    'bitingly', 'b1tingly',
    'cuttingly', 'c1ttingly',
    'caustically', 'c4ustically',
    'acidly', '4cidly',
    'tartly', 't4rtly',
    'bitterly', 'b1tterly',
    'resentfully', 'r3sentfully',
    'bitterly', 'b1tterly',
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
    'foully', 'f0ully',
    'putridly', 'putr1dly',
    'rancidly', 'r4ncidly',
    'toxically', 't0xically'
];

// Leetspeak mapping (chalaki detection)
const leetMap = {
    'a': '4', 'b': '8', 'c': '(', 'e': '3', 'g': '6', 'h': '#', 'i': '1', 'l': '|', 'o': '0', 's': '$', 't': '7', 'z': '2'
};

// Normalize text to catch chalaki
function normalizeText(text) {
    let normalized = text.toLowerCase();
    // Remove spaces, dots, hyphens, underscores
    normalized = normalized.replace(/[.\-_\s]/g, '');
    // Replace leetspeak
    for (const [letter, leet] of Object.entries(leetMap)) {
        normalized = normalized.split(leet).join(letter);
    }
    return normalized;
}

// Check if message has abuse (including chalaki)
function hasAbuse(text) {
    const normalized = normalizeText(text);
    return abuseWords.some(word => {
        const normalizedWord = normalizeText(word);
        return normalized.includes(normalizedWord);
    });
}

// Check if owner is tagged with abuse
function isOwnerTaggedWithAbuse(message, userId) {
    const content = message.content;
    const hasOwnerMention = content.includes(`<@${userId}>`) || content.includes(`<@!${userId}>`);
    return hasOwnerMention && hasAbuse(content);
}

// Warning and timeout tracking
const warnedUsers = new Map(); // userId -> {count, lastWarning}
const timeoutDuration = 600000; // 10 minutes in ms
const spamThreshold = 3; // abuse messages within 1 minute = spam
const spamWindow = 60000; // 1 minute window

function isSpam(userId) {
    const now = Date.now();
    const userData = warnedUsers.get(userId);
    if (!userData) return false;

    // Count recent abuse within spam window
    const recentAbuse = userData.abuseHistory?.filter(time => now - time < spamWindow) || [];
    return recentAbuse.length >= spamThreshold;
}

function recordAbuse(userId) {
    if (!warnedUsers.has(userId)) {
        warnedUsers.set(userId, { count: 0, abuseHistory: [] });
    }
    const data = warnedUsers.get(userId);
    data.count++;
    data.abuseHistory.push(Date.now());
    warnedUsers.set(userId, data);
    return data.count;
}

async function timeoutUser(member, duration, reason) {
    try {
        await member.timeout(duration, reason);
        return true;
    } catch (err) {
        console.log('Timeout failed:', err.message);
        return false;
    }
}

function getWarningMessage(count, isSpam = false) {
    if (isSpam) {
        return `🚫 **SPAM DETECTED!** Bahut zyada gaaliya de rahi ho!

⏰ **10 Minute Timeout!**
📋 Reason: Owner ko abuse spam kiya
💡 Next time respect se baat karna!`;
    }

    if (count === 1) {
        return `⚠️ **Warning 1/2**

🙅‍♀️ Owner ko aise mat bolo! Respect se baat karo.
📋 Next time timeout milega!
💕 Main toh tumhari friend hoon, dushman nahi!`;
    } else {
        return `🚫 **Warning 2/2 — FINAL!**

⏰ **10 Minute Timeout!**
📋 Reason: Owner ko abuse kiya
💡 Next time respect se baat karna!

🙏 Please be nice. Hum sab friends hain yahan!`;
    }
}

// ==================== SYSTEM PROMPT ====================

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

// ==================== AI RESPONSE FUNCTION ====================

async function getAIResponse(userId, userMessage, isReplyToBot = false) {
    try {
        if (!userConversations.has(userId)) {
            userConversations.set(userId, []);
        }
        const history = userConversations.get(userId);

        if (history.length > 20) {
            history.splice(0, 2);
        }

        history.push({ role: 'user', content: userMessage });

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10),
            { role: 'user', content: userMessage }
        ];

        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',  // Chhota model - kam tokens use karega
            messages: messages,
            temperature: 0.9,
            max_tokens: 200,  // Kam tokens = zyada replies per day
            top_p: 1
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const aiReply = response.data.choices[0].message.content;
        history.push({ role: 'assistant', content: aiReply });

        return aiReply;
    } catch (error) {
        console.error('Groq API Error:', error.response?.data || error.message);
        return null;
    }
}

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

// ==================== BOT EVENTS ====================

client.once(Events.ClientReady, () => {
    console.log('Bot login ho gayi:', client.user.tag);
    console.log('Bot ID:', client.user.id);
    console.log('AI Mode: ENABLED (Groq API)');
    console.log('Abuse Protection: ENABLED');
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

    // ==================== ABUSE DETECTION ====================

    // Check if owner is tagged with abuse
    if (isOwnerTaggedWithAbuse(message, YOUR_USER_ID)) {
        const abuseCount = recordAbuse(message.author.id);
        const isSpam = isSpam(message.author.id);

        // If spam (3+ abuse in 1 min) OR 2nd warning -> Timeout
        if (isSpam || abuseCount >= 2) {
            const member = message.guild?.members.cache.get(message.author.id);
            if (member) {
                const timeoutSuccess = await timeoutUser(member, timeoutDuration, 
                    `Owner ko abuse kiya - ${isSpam ? 'spam' : 'warning ' + abuseCount}`);

                if (timeoutSuccess) {
                    await message.reply(getWarningMessage(abuseCount, true));

                    // Send reason in chat
                    await message.channel.send({
                        embeds: [{
                            color: 0xFF0000,
                            title: '🚫 User Timed Out',
                            description: `<@${message.author.id}> ko 10 minute ka timeout diya gaya hai!`,
                            fields: [
                                { name: '📋 Reason', value: 'Owner ko abuse kiya', inline: false },
                                { name: '⏰ Duration', value: '10 minutes', inline: true },
                                { name: '💡 Advice', value: 'Next time respect se baat karna!', inline: false }
                            ],
                            timestamp: new Date().toISOString(),
                            footer: { text: 'Riya - Server Protection' }
                        }]
                    });

                    // DM user with reason
                    try {
                        await message.author.send({
                            embeds: [{
                                color: 0xFF6B6B,
                                title: '⏰ Timeout Notice',
                                description: `Aapko **${message.guild.name}** server mein 10 minute ka timeout diya gaya hai!`,
                                fields: [
                                    { name: '📋 Reason', value: 'Owner ko abuse kiya', inline: false },
                                    { name: '💡 Kya Kare', value: 'Please respect se baat karo. Gaaliya dena allowed nahi hai!', inline: false },
                                    { name: '⏰ Timeout Khatam', value: '10 minutes ke baad automatically remove ho jayega', inline: false }
                                ],
                                timestamp: new Date().toISOString(),
                                footer: { text: 'Riya - Be Nice!' }
                            }]
                        });
                    } catch (dmErr) {
                        console.log('DM failed:', dmErr.message);
                    }
                }
            }
            return;
        }

        // First warning
        await message.reply(getWarningMessage(abuseCount));
        return;
    }

    // If someone tags you (normal)
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
        if (hasAbuse(content)) {
            await message.reply('🙅‍♀️ Aise mat bolo na! Pyar se baat karo! 💕');
            return;
        }
        await message.reply('Hello! Boliye, main aapki kya help kar sakti hoon? 😊💕');
        return;
    }

    // AI CHAT MODE
    let shouldUseAI = false;
    let userMessage = message.content;

    if (message.mentions.has(client.user) && !message.content.includes(YOUR_USER_ID)) {
        shouldUseAI = true;
        userMessage = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
    }

    if (message.reference && message.reference.messageId) {
        try {
            const refMsg = await message.channel.messages.fetch(message.reference.messageId);
            if (refMsg.author.id === client.user.id) {
                shouldUseAI = true;
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
        shouldUseAI = true;
    }

    if (shouldUseAI && userMessage.length > 0) {
        await message.channel.sendTyping();

        const aiResponse = await getAIResponse(message.author.id, userMessage, true);

        if (aiResponse) {
            await message.reply(aiResponse);
        } else {
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
                { name: 'Abuse Protection', value: '✅ Active', inline: true },
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
                { name: 'Abuse Protection', value: 'Owner ko abuse kiya? Warning → Timeout!', inline: false },
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
