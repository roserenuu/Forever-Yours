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
      `Write a Love Note in the EXACT style of Rose Renuu's "Forever Yours" devotional.

Topic/Theme: ${topic}

IMPORTANT: This must be a COMPLETELY FRESH Love Note. Never repeat a theme, title, or scripture that has already been used in this conversation. Find a unique angle on the topic.

EXACT FORMAT (follow precisely):
1. TITLE: A short, evocative 2-3 word title (like "Gentle Knock", "Rest Is Holy", "Beauty Within", "Hold On", "Nothing Is Wasted")

2. THE LOVE NOTE (150-250 words):
   - Open with "My Child,"
   - Written in first person from God's perspective using "I" statements
   - Acknowledge the specific pain/struggle FIRST — be real about it
   - Then shift to God's response, truth, and promise
   - Use parallel structure where it fits naturally ("I see you when... I see you when..." or "When you... I am your...")
   - Present tense throughout
   - Close with "Forever Yours, Heavenly Father"

3. SCRIPTURE: One verse in NLT translation with full text and reference

VOICE GUIDE — match Rose's actual writing:
- "I am with you" not "I'm with you" — slightly formal, reverent
- "I understand" "I see you" "Trust Me" "Come to Me" "Rest in"
- Address real feelings: guilt, shame, numbness, exhaustion, fear, loneliness
- Never preachy, never dismissive, never generic
- No emojis in the Love Note itself
- Poetic but accessible — every word should feel intentional

Write ONLY the Love Note (title + note + scripture), nothing else.`
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

export const carouselSkill: Skill = {
  name: "carousel",
  description:
    "Generate a fully structured Instagram carousel — every slide's text, layout direction, and caption ready for Canva",
  examples: [
    "/carousel love note about God's timing",
    "/carousel 5 signs God is protecting you",
    "/carousel what God says about you vs what the world says",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const concept = ctx.input || "a love note about God's faithfulness";
    const response = await ctx.agent.generateContent(
      `Create a complete Instagram carousel for @jesusforeveryours.

Concept: ${concept}

Write this in Rose Renuu's voice — warm, intimate, scripture-rooted, poetic but accessible.

FORMAT — provide EVERY slide's content exactly as it should appear:

SLIDE 1 (HOOK — must stop the scroll):
Headline: [Bold, short, emotional — this is what makes someone swipe]
Subtext: [Optional 1-line teaser]

SLIDE 2-6 (BODY — the heart of the message):
For each slide provide:
- Headline: [Short, punchy — 3-8 words max]
- Body: [1-3 sentences that expand on the headline]
- Design note: [Brief direction — e.g., "scripture overlay", "handwritten feel", "bold text on soft background"]

SLIDE 7 (SCRIPTURE):
- Full verse text in NLT
- Reference

SLIDE 8 (CTA — call to action):
- A warm closing line
- CTA: [Save, share, tag someone, comment, follow]

---

CAPTION: [Full Instagram caption in Rose's voice, 150-250 words, with CTA and line breaks for readability]

HASHTAGS: [20 relevant hashtags including #JesusForeverYours #ForeverYours #LoveNotes]

DESIGN DIRECTION:
- Color palette suggestion
- Font style (serif for headers, handwritten for scripture, etc.)
- Overall mood/aesthetic

Rules:
- 7-10 slides total
- Each slide should be readable in 2-3 seconds
- Build emotional momentum — hook → depth → scripture → action
- The carousel should tell a complete story or deliver a complete message
- Match Rose's exact voice and tone throughout
- Use NLT for scripture

Write ONLY the carousel content, nothing else.`
    );

    return {
      title: "Instagram Carousel",
      content: response,
      suggestions: [
        "Copy each slide's text directly into your Canva template",
        "Carousels get 3x more engagement than single posts — save rate is highest",
        "Post between 9-11am or 7-9pm for best reach",
      ],
    };
  },
};

export const contentSkills = [
  loveNoteSkill,
  captionSkill,
  reelScriptSkill,
  devotionalSkill,
  carouselSkill,
];
