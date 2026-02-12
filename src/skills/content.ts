import { Skill, SkillContext, SkillResult } from "./types.js";

export const loveNoteSkill: Skill = {
  name: "lovenote",
  description:
    "Generate a Love Note — a short devotional message written as if from God to His child, inspired by scripture",
  examples: [
    "/lovenote about feeling alone",
    "/lovenote on God's faithfulness",
    "/lovenote for someone going through heartbreak",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const topic = ctx.input || "God's unconditional love";
    const response = await ctx.agent.generateContent(
      `Write a Love Note in the style of the "Forever Yours" devotional by Rose Renuu.

Topic/Theme: ${topic}

A Love Note is a short, intimate devotional message written as if God Himself is speaking directly to the reader — His beloved child. It should:
- Be written in first person from God's perspective ("My child...", "Beloved...")
- Feel like a personal, handwritten letter from the Creator
- Include 1-2 relevant scripture references naturally woven in
- Be 100-200 words
- End with one of the signature closing phrases
- Evoke emotion — comfort, hope, belonging, healing

Write ONLY the Love Note, nothing else.`
    );

    return {
      title: "Love Note",
      content: response,
      suggestions: [
        "Share as an Instagram carousel",
        "Use as a story series",
        "Add to the devotional collection",
      ],
    };
  },
};

export const captionSkill: Skill = {
  name: "caption",
  description:
    "Generate an Instagram caption with hashtags for @jesusforeveryours",
  examples: [
    "/caption for a sunset photo about God's promises",
    "/caption for a reel about identity in Christ",
    "/caption for a devotional book promo",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const prompt = ctx.input || "a faith-based inspirational post";
    const response = await ctx.agent.generateContent(
      `Write an Instagram caption for @jesusforeveryours.

Context: ${prompt}

Requirements:
- Match the warm, intimate, devotional voice of Rose Renuu
- Include a scripture reference
- Include a call-to-action (save this, share with someone, tag a friend, comment below)
- Add 15-20 relevant hashtags at the end (mix of faith hashtags and niche hashtags)
- Caption length: 150-300 words (Instagram sweet spot)
- Use line breaks for readability
- Include relevant emojis sparingly (1-3 max)

Include hashtags like: #JesusForeverYours #ForeverYours #LoveNotes #FaithOverFear #ChristianContentCreator #GodIsGood #ScriptureOfTheDay #ChristianWomen #WalkByFaith

Write ONLY the caption, nothing else.`
    );

    return {
      title: "Instagram Caption",
      content: response,
      suggestions: [
        "Best posting times: 9am, 12pm, or 7pm",
        "Pair with a warm-toned aesthetic image",
        "Cross-post to stories with a poll sticker",
      ],
    };
  },
};

export const reelScriptSkill: Skill = {
  name: "reel",
  description:
    "Generate a script for an Instagram Reel or TikTok video",
  examples: [
    "/reel about what God says about you vs what the world says",
    "/reel 30-second devotional on Psalm 23",
    "/reel testimony style — darkest season to breakthrough",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const concept = ctx.input || "a short devotional message";
    const response = await ctx.agent.generateContent(
      `Write a script for a short-form video (Instagram Reel / TikTok) for @jesusforeveryours.

Concept: ${concept}

Format the script as:
HOOK (first 3 seconds — must stop the scroll):
[The opening line/visual]

BODY (15-45 seconds):
[Scene-by-scene breakdown with what to say and show]

CLOSING (last 5 seconds):
[Call to action + brand moment]

CAPTION: [A short caption suggestion]
AUDIO SUGGESTION: [Worship song or trending audio that fits]

Requirements:
- Keep it 30-60 seconds total
- The hook MUST be attention-grabbing
- Match Rose's authentic, vulnerable, faith-filled style
- Include at least one scripture reference
- Make it emotionally resonant

Write ONLY the script, nothing else.`
    );

    return {
      title: "Reel Script",
      content: response,
      suggestions: [
        "Film in natural lighting for the JFY aesthetic",
        "Add text overlays for key scripture",
        "Use a trending worship song as background",
      ],
    };
  },
};

export const devotionalSkill: Skill = {
  name: "devotional",
  description:
    "Generate a full devotional entry for the Forever Yours collection",
  examples: [
    "/devotional on surrendering control to God",
    "/devotional about finding peace in waiting seasons",
    "/devotional on healing from past wounds",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const theme = ctx.input || "resting in God's love";
    const response = await ctx.agent.generateContent(
      `Write a devotional entry for the "Forever Yours" devotional collection by Rose Renuu.

Theme: ${theme}

Structure:
1. TITLE: [A poetic, evocative title]
2. SCRIPTURE: [1-2 key verses, include the full text and reference]
3. LOVE NOTE: [The main devotional — 300-500 words, written in Rose's signature style. Intimate, vulnerable, scripture-rooted. Should feel like sitting with a close friend who loves Jesus deeply.]
4. REFLECTION QUESTIONS: [3 questions for the reader to journal on]
5. PRAYER: [A short closing prayer — conversational, heartfelt]
6. DECLARATION: [A bold "I am" or "God is" statement the reader can speak over themselves]

Write in Rose's warm, poetic, deeply personal style. This should make the reader feel held by God.

Write ONLY the devotional, nothing else.`
    );

    return {
      title: "Forever Yours Devotional",
      content: response,
      suggestions: [
        "Share reflection questions as story polls",
        "Turn the declaration into a shareable graphic",
        "Read the Love Note section aloud for a reel",
      ],
    };
  },
};

export const contentSkills = [
  loveNoteSkill,
  captionSkill,
  reelScriptSkill,
  devotionalSkill,
];
