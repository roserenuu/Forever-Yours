export interface BrandConfig {
  name: string;
  creator: string;
  mission: string;
  voice: BrandVoice;
  audience: AudienceProfile;
  platforms: PlatformConfig;
  scripture: ScriptureConfig;
}

export interface BrandVoice {
  tone: string[];
  personality: string[];
  avoidWords: string[];
  signatureStyle: string;
  closingPhrases: string[];
  writingPatterns: string[];
  sampleLoveNote: string;
}

export interface AudienceProfile {
  primary: string;
  interests: string[];
  painPoints: string[];
  spiritualNeeds: string[];
}

export interface PlatformConfig {
  instagram: { handle: string; creatorHandle: string };
  website: string;
  discord?: { guildId?: string };
}

export interface ScriptureConfig {
  preferredVersions: string[];
  coreVerses: string[];
  themes: string[];
}

export const DEFAULT_BRAND: BrandConfig = {
  name: "Jesus Forever Yours",
  creator: "Rose Renuu",
  mission:
    "To make Rose Renuu the #1 Christian content creator — growing from 144K to 1 MILLION followers by creating the most powerful, authentic, and viral faith content on the internet. Every piece of content should point people to Jesus while maximizing reach, engagement, and growth.",

  voice: {
    tone: [
      "tender",
      "intimate",
      "compassionate",
      "reverent",
      "honest",
      "hopeful",
      "nurturing",
    ],
    personality: [
      "Written in first person from God's perspective, speaking directly to 'My Child'",
      "Acknowledges real pain before offering hope — never dismissive",
      "Reads like a personal handwritten letter from God to His beloved child",
      "Poetic but accessible — no churchy jargon, no performative language",
      "Builds from pain acknowledgment → God's response → truth/promise → hope",
      "Deeply vulnerable yet grounded in scripture",
    ],
    avoidWords: [
      "hustle",
      "grind",
      "slay",
      "manifest",
      "universe",
      "toxic",
      "vibe check",
      "blessed and highly favored",
      "season of abundance",
      "sis",
      "girl boss",
      "claim it",
      "speak it into existence",
    ],
    signatureStyle:
      "Love Notes from God — intimate devotional messages (150-250 words) written as if God is speaking directly to His child. Each one opens with 'My Child,' and closes with 'Forever Yours, Heavenly Father' followed by a single NLT scripture. Each has a short evocative 2-3 word title. The writing uses parallel structure, present tense, and 'I' statements from God's perspective.",
    closingPhrases: [
      "Forever Yours, Heavenly Father",
    ],
    writingPatterns: [
      "Always opens with 'My Child,'",
      "Always closes with 'Forever Yours, Heavenly Father'",
      "Always ends with one scripture reference in NLT translation",
      "Can use phrases like 'I see you', 'I am with you', 'Trust Me', 'Come to Me' — but NEVER repeat the same phrase across multiple notes. Rotate and vary.",
      "Can use parallel structure — but vary the pattern each time. Don't always default to 'When you... I am...' or 'I see you when...' — surprise the reader with fresh rhythms.",
      "Titles are 2-3 words, evocative and simple: 'Gentle Knock', 'Rest Is Holy', 'Beauty Within', 'Hold On'",
      "150-250 words per Love Note (not counting scripture)",
      "Addresses ONE specific struggle per note — goes deep, not broad",
      "Never uses emojis inside devotional content",
      "Builds: acknowledge pain → 'I am here' → God's truth → hope/promise",
      "Uses 'My love' or 'beloved' sparingly for emphasis — max once per note",
      "References real feelings: guilt, shame, numbness, exhaustion, fear of vulnerability",
      "VARIETY IS ESSENTIAL: each note should feel like a completely different letter — different opening rhythm, different structure, different emotional texture. If the last note used lists, use narrative flow. If the last was gentle, try bold conviction.",
    ],
    sampleLoveNote: `My Child,

I am with you in every moment and every chapter of your life. When happiness fills your heart, I am your God of blessings. When you are broken by pain, I am your God of healing. When you are wronged, I am your God of justice. When you are overwhelmed by fear, I am your God of courage. When guilt weighs heavily on you, I am your God of forgiveness. When shame makes you feel unworthy, I am your God of grace. When you see no way forward, I am your God of miracles. I am the same yesterday, today, and forever. You will never walk through a struggle or a joyful moment without Me by your side. In every season, I am your God.

Forever Yours,
Heavenly Father

I am with you always, even to the end of the age. Matthew 28:20 NLT`,
  },

  audience: {
    primary:
      "Young women (18-35) seeking hope, healing, and a deeper relationship with Jesus",
    interests: [
      "faith",
      "devotionals",
      "prayer",
      "worship",
      "self-worth in Christ",
      "healing",
      "Christian lifestyle",
    ],
    painPoints: [
      "Feeling unseen or unloved",
      "Walking through dark seasons",
      "Struggling with identity and self-worth",
      "Seeking God's voice in the noise",
      "Loneliness and heartbreak",
    ],
    spiritualNeeds: [
      "Reassurance of God's love",
      "Scriptural encouragement",
      "Community and belonging",
      "Guidance through hard seasons",
      "Deeper intimacy with Jesus",
    ],
  },

  platforms: {
    instagram: {
      handle: "roserenuu",
      creatorHandle: "roserenuu",
    },
    website: "https://jesusforeveryours.com",
  },

  scripture: {
    preferredVersions: ["NLT"],
    coreVerses: [
      "Jeremiah 31:3 — I have loved you with an everlasting love; I have drawn you with unfailing kindness.",
      "Psalm 139:14 — I praise you because I am fearfully and wonderfully made.",
      "Isaiah 43:1 — Fear not, for I have redeemed you; I have called you by name, you are mine.",
      "Romans 8:38-39 — Nothing can separate us from the love of God.",
      "Zephaniah 3:17 — The Lord your God is with you, the Mighty Warrior who saves.",
      "Song of Solomon 2:16 — I am my beloved's and my beloved is mine.",
      "Psalm 34:18 — The Lord is close to the brokenhearted.",
    ],
    themes: [
      "God's faithfulness in every season",
      "Healing of the heart — grief, loss, rejection, heartbreak",
      "Freedom from mental battles — anxiety, overthinking, fear, shame",
      "Love and relationships — family, self-love, forgiveness, letting go",
      "Being made new — repentance, identity, transformation, freedom from temptation",
      "Rest and surrendering control to God",
      "God's pursuit of you — even when you walked away",
      "Worth and identity that comes from God, not the world",
      "Trusting God when life doesn't make sense",
      "God hearing your prayers even in silence",
    ],
  },
};
