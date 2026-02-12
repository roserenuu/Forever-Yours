import { Skill, SkillContext, SkillResult } from "./types.js";

export const prayerSkill: Skill = {
  name: "prayer",
  description:
    "Generate a heartfelt prayer for any situation — personal, for a follower, or for content",
  examples: [
    "/prayer for someone struggling with anxiety",
    "/prayer for a new beginning",
    "/prayer for healing from a broken relationship",
    "/prayer morning prayer for strength",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const situation = ctx.input || "peace and strength for today";
    const response = await ctx.agent.generateContent(
      `Write a heartfelt prayer in Rose Renuu's voice for: ${situation}

The prayer should feel like Rose is praying alongside the reader — intimate, conversational, and Spirit-led.

FORMAT:
- Title: A short prayer title (e.g., "A Prayer for the Anxious Heart")
- The prayer (100-200 words)
- One closing scripture in NLT

VOICE:
- Conversational with God — like talking to a Father, not reciting
- Honest about the struggle — "Lord, I am tired" not "Dear Heavenly Father, we humbly beseech thee"
- Specific to the situation, not generic
- Ends with surrender and trust
- Uses "You" when addressing God (not "Thou")
- Can include moments of raw honesty: "I don't understand why..." or "This hurts, God..."
- Close with "In Jesus' name, Amen."

Write ONLY the prayer, nothing else.`
    );

    return {
      title: "Prayer",
      content: response,
      suggestions: [
        "Share as a story with a soft background",
        "Read aloud for a reel — prayer content gets high saves",
        "Use as a carousel ending slide",
      ],
    };
  },
};

export const verseSkill: Skill = {
  name: "verse",
  description:
    "Find the perfect Bible verse for any situation, emotion, or life moment",
  examples: [
    "/verse for someone who feels worthless",
    "/verse about God's timing",
    "/verse for grief and loss",
    "/verse when you feel like giving up",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const situation = ctx.input || "when you need encouragement";
    const response = await ctx.agent.generateContent(
      `Find 7-10 powerful Bible verses for this situation: ${situation}

For EACH verse provide:
1. The full verse text (NLT translation)
2. The reference (Book Chapter:Verse)
3. A 1-sentence "Why this matters" — connect it to the reader's real feelings in Rose's voice

Organize them from most impactful to supporting verses.

Also provide:
- A "VERSE TO MEMORIZE" — pick the single most powerful one for this situation
- A "DECLARATION" — turn one verse into a first-person declaration the reader can speak over themselves (e.g., "I am fearfully and wonderfully made. My worth is not up for debate.")

Rules:
- Use NLT translation for all verses
- Choose verses that feel like God speaking directly to the reader
- Mix well-known and lesser-known verses
- Make sure they actually address the specific situation, not just general encouragement

Write ONLY the verse list, nothing else.`
    );

    return {
      title: "Scripture for You",
      content: response,
      suggestions: [
        "Turn the top verse into a carousel hook slide",
        "The declaration makes a powerful reel ending",
        "Save these in a highlight for your followers",
      ],
    };
  },
};

export const testimonySkill: Skill = {
  name: "testimony",
  description:
    "Structure a testimony or personal story for maximum impact — reels, carousels, or captions",
  examples: [
    "/testimony about overcoming depression through faith",
    "/testimony how God restored a broken relationship",
    "/testimony from addiction to freedom in Christ",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const story = ctx.input || "a personal faith journey";
    const response = await ctx.agent.generateContent(
      `Help structure this testimony/story for @jesusforeveryours content: ${story}

Create THREE versions of this testimony for different formats:

## VERSION 1: REEL SCRIPT (30-60 seconds)
- Hook (first 3 seconds — must stop the scroll)
- The "before" — paint the pain honestly
- The turning point — the God moment
- The "after" — where they are now
- Closing line + scripture
- Audio suggestion

## VERSION 2: CAROUSEL (7-8 slides)
For each slide:
- Slide text (short, punchy, readable in 2-3 seconds)
- Design direction

## VERSION 3: CAPTION (200-300 words)
- Written in first person
- Vulnerable and real
- Includes scripture
- Ends with CTA (share your story, comment, save)
- Hashtags

STORYTELLING RULES:
- Be specific with emotions — "I cried on my bathroom floor at 3am" not "I was sad"
- The turning point should feel real, not magical — faith is messy
- Don't rush the pain — sit in it before offering the breakthrough
- End with hope but keep it honest — healing is a journey, not a switch
- Match Rose's voice throughout — intimate, vulnerable, never performative

Write ONLY the three versions, nothing else.`
    );

    return {
      title: "Testimony Structure",
      content: response,
      suggestions: [
        "Testimony reels consistently go viral in the faith niche",
        "Film the reel version with raw emotion — don't over-produce it",
        "Post the carousel version as a follow-up the next day",
      ],
    };
  },
};

export const faithSkills = [prayerSkill, verseSkill, testimonySkill];
