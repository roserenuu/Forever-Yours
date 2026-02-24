import { Skill, SkillContext, SkillResult } from "./types.js";

export const hashtagSkill: Skill = {
  name: "hashtag",
  description:
    "Generate optimized hashtag sets for maximum reach — tailored to content type and niche",
  examples: [
    "/hashtag for a love note carousel",
    "/hashtag for a funny Christian reel",
    "/hashtag for a worship/prayer post",
    "/hashtag for a testimony reel",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const contentType = ctx.input || "a faith-based Instagram post";
    const response = await ctx.agent.generateContent(
      `Generate optimized hashtag strategy for Rose Renuu's accounts — @roserenuu (144K followers, PRIMARY) and @jesusforeveryours (~8K followers, brand).

Content type: ${contentType}

IMPORTANT: Instagram now limits posts to MAX 5 HASHTAGS (since December 2025 — confirmed by Adam Mosseri). Mosseri also confirmed hashtags do NOT boost reach anymore. They only help with categorization and search. KEYWORD-RICH CAPTIONS are now 30% more effective for reach than hashtags.

Provide THREE hashtag sets of 5 hashtags each (rotate between sets to avoid spam flagging):

## SET 1 (5 hashtags)
- 1 branded tag: #JesusForeverYours
- 2-3 niche-specific tags relevant to the content
- 1 trending faith tag

## SET 2 (5 hashtags — different from Set 1)
- 1 branded tag: #JesusForeverYours
- 2-3 different niche tags
- 1 different trending tag

## SET 3 (5 hashtags — different from Sets 1 & 2)
- 1 branded tag: #JesusForeverYours
- 2-3 different niche tags
- 1 crossover tag (reaches beyond the faith bubble)

HASHTAG CATEGORIES TO DRAW FROM:
- Faith/Christian: #ChristianContentCreator #FaithOverFear #JesusIsKing
- Devotional: #LoveNotes #DailyDevotional #ScriptureOfTheDay
- Audience: #ChristianWomen #FaithJourney #GodIsGood
- Content-specific: based on the actual post content

Also provide:
- KEYWORD CAPTION STRATEGY: 5-7 searchable keyword phrases to weave into the caption (this is MORE important than hashtags now — Instagram's AI reads captions for discovery)
- BEST TIME TO POST this type of content
- 3 related hashtags to AVOID (overused, shadowbanned, or off-brand)

Write ONLY the hashtag strategy, nothing else.`
    );

    return {
      title: "Hashtag Strategy",
      content: response,
      suggestions: [
        "Rotate between the 3 sets — never use the same set twice in a row",
        "Save each set as a note on your phone for quick copy-paste",
        "Update your hashtag sets monthly as trends shift",
      ],
    };
  },
};

export const emailSkill: Skill = {
  name: "email",
  description:
    "Write newsletter or email content — welcome sequences, devotional emails, or announcements",
  examples: [
    "/email welcome email for new subscribers",
    "/email weekly devotional newsletter",
    "/email book launch announcement",
    "/email re-engagement email for inactive subscribers",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const request = ctx.input || "a weekly devotional newsletter";
    const response = await ctx.agent.generateContent(
      `Write email content for Jesus Forever Yours by Rose Renuu.

Request: ${request}

FORMAT:
- SUBJECT LINE: [3 options — one curiosity-driven, one emotional, one direct]
- PREVIEW TEXT: [The snippet that shows in inbox — make it compelling]
- EMAIL BODY:
  - Opening line that feels personal (not "Hey friend!" — more Rose's voice)
  - The heart of the message (devotional, announcement, story — whatever fits)
  - A scripture woven in naturally
  - Clear CTA (read the devotional, shop, reply, share)
  - Warm sign-off in Rose's voice
- P.S. LINE: [Optional but these get read more than any other part]

VOICE:
- Write exactly like Rose — intimate, warm, like a letter from a friend who loves Jesus
- This should feel like opening a personal note, not a marketing email
- Use "you" language — make the reader feel like the only person receiving this
- Keep it 200-400 words (people don't read long emails)

Write ONLY the email content, nothing else.`
    );

    return {
      title: "Email Content",
      content: response,
      suggestions: [
        "Send emails Tuesday-Thursday between 9-11am for best open rates",
        "The P.S. line is prime real estate — always include one",
        "Keep subject lines under 40 characters for mobile",
      ],
    };
  },
};

export const collabSkill: Skill = {
  name: "collab",
  description:
    "Draft collaboration pitches, brand deal responses, or partnership proposals",
  examples: [
    "/collab pitch to a Christian brand for sponsorship",
    "/collab response to a brand that reached out",
    "/collab proposal for a joint devotional series with another creator",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const request = ctx.input || "a brand collaboration pitch";
    const response = await ctx.agent.generateContent(
      `Draft a collaboration pitch/proposal for Rose Renuu (@roserenuu / @jesusforeveryours).

Request: ${request}

ROSE'S STATS & BIO:
- Instagram @roserenuu: 144K followers (PRIMARY personal creator account)
- Instagram @jesusforeveryours: ~8K followers (brand/ministry account)
- TikTok: 56K followers
- YouTube: 8.5K subscribers
- Niche: Christian faith, devotionals, Love Notes
- Audience: Women 18-35, faith-focused, high engagement
- Book: "Forever Yours" devotional
- Based in Los Angeles
- Known for: intimate Love Notes written as if from God, authentic vulnerability

FORMAT:
- SUBJECT LINE: [Professional but warm — not salesy]
- THE PITCH (200-300 words):
  - Warm opening that shows you know their brand
  - What Rose brings to the table (audience, engagement, brand alignment)
  - The collaboration idea — specific and actionable
  - Why it's a good fit (shared values, audience overlap)
  - Clear next step
- MEDIA KIT TALKING POINTS: [5 key stats/facts to highlight]

TONE:
- Professional but still Rose — warm, authentic, not corporate
- Confident without being pushy
- Faith-centered — Rose only partners with brands aligned with her values
- Show value — what's in it for them, not just for Rose

Write ONLY the pitch, nothing else.`
    );

    return {
      title: "Collaboration Pitch",
      content: response,
      suggestions: [
        "Personalize the opening for each brand — show you did your homework",
        "Follow up once after 5-7 days if no response",
        "Always check if the brand aligns with your values before pitching",
      ],
    };
  },
};

export const creatorSkills = [hashtagSkill, emailSkill, collabSkill];
