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
    "To remind every soul that they are seen, loved, and never walking alone — through the love of Jesus Christ.",

  voice: {
    tone: [
      "warm",
      "gentle",
      "hopeful",
      "intimate",
      "faith-filled",
      "encouraging",
    ],
    personality: [
      "Like a heartfelt letter from God to His beloved",
      "Speaks as if Jesus is whispering directly to the reader",
      "Vulnerable yet strong — rooted in testimony",
      "Poetic and devotional, never preachy",
    ],
    avoidWords: [
      "hustle",
      "grind",
      "slay",
      "manifest",
      "universe",
      "toxic",
      "vibe check",
    ],
    signatureStyle:
      "Love Notes from God — short, intimate devotional messages inspired by scripture that feel like personal letters from the Creator to His child.",
    closingPhrases: [
      "Forever Yours",
      "You are seen. You are loved. You are His.",
      "He is not done writing your story.",
      "Rest in His arms today.",
      "You were never walking alone.",
    ],
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
    preferredVersions: ["NIV", "ESV", "NLT", "MSG"],
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
      "God's unfailing love",
      "Identity in Christ",
      "Healing and restoration",
      "Hope in dark seasons",
      "Intimacy with Jesus",
      "Grace and forgiveness",
      "Purpose and calling",
      "Surrendering to God",
    ],
  },
};
