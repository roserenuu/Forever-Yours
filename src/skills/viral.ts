import { Skill, SkillContext, SkillResult } from "./types.js";
import { getAlgorithmBriefForAgents } from "../config/instagram-algorithm.js";

export const hooksSkill: Skill = {
  name: "hooks",
  description:
    "Generate scroll-stopping viral hooks for reels, captions, and stories",
  examples: [
    "/hooks for a reel about God's timing",
    "/hooks 5 hooks about identity in Christ",
    "/hooks for a carousel on healing from heartbreak",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const topic = ctx.input || "faith and God's love";
    const response = await ctx.agent.generateContent(
      `Generate 10 scroll-stopping viral hooks for Christian content about: ${topic}

You are writing hooks for @jesusforeveryours — a faith brand for young women.

For EACH hook, provide:
- The hook (the actual first line / opening text)
- Format it works best for (reel, carousel, caption, story)
- Why it stops the scroll (1 sentence)

Types of hooks to mix in:
1. Bold/controversial takes: "Unpopular opinion: God doesn't want you to have it all together"
2. Personal/vulnerable: "I almost walked away from God last year. Here's what stopped me."
3. Curiosity gap: "The one verse that changed how I see my worth forever..."
4. Pattern interrupt: "Stop scrolling. God has something to tell you."
5. Relatable pain: "That thing you're crying about at 2am? He sees it."
6. Hot takes with love: "You don't need another self-help book. You need the Psalms."
7. List/number hooks: "3 lies the enemy tells you about your worth"
8. Question hooks: "What if the waiting IS the blessing?"
9. Story hooks: "She almost gave up. Then she opened her Bible to this page..."
10. Trend-jacking: Adapt a trending format but make it faith-centered

Make them PUNCHY, emotional, and impossible to scroll past. These should feel authentic to a young Christian woman's voice — not churchy or preachy.

Write ONLY the hooks list, nothing else.`
    );

    return {
      title: "Viral Hooks",
      content: response,
      suggestions: [
        "Save your best hooks in a swipe file for later",
        "Test 2-3 hooks on stories before committing to a reel",
        "Pair bold hooks with soft, loving content for contrast",
      ],
    };
  },
};

export const funnySkill: Skill = {
  name: "funny",
  description:
    "Generate funny, relatable Christian content — memes, skits, and lighthearted posts",
  examples: [
    "/funny Christian girl problems",
    "/funny skit idea about praying for patience",
    "/funny relatable moments at church",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const topic = ctx.input || "relatable Christian girl moments";
    const response = await ctx.agent.generateContent(
      `Generate funny, relatable Christian content ideas about: ${topic}

You're creating content for @jesusforeveryours — a warm, authentic faith brand for young women (18-35). The humor should feel like texting your church bestie, not a boomer Facebook meme.

Provide 7-10 ideas mixing these formats:

1. RELATABLE POSTS (text overlay on aesthetic background):
   - "Me: God I trust your timing / Also me: *refreshes email 47 times*"
   - Christian girl struggles that make people tag their friends

2. SKIT/REEL IDEAS (short, punchy, actable):
   - POV scenarios, "types of" videos, before/after faith moments
   - Keep them 15-30 seconds, easy for one person to film

3. MEME CAPTIONS (for carousel or single image):
   - Funny but still faith-positive
   - The kind that gets shared to stories and group chats

4. STORY POLL/QUIZ IDEAS:
   - "Be honest..." type interactive content
   - This or that: Christian edition

Rules:
- FUNNY but never mocking God, scripture, or anyone's faith journey
- Relatable > edgy — the goal is "omg that's SO me" not controversy
- Should make someone laugh AND feel seen
- Keep it clean — no crude humor
- It's okay to lovingly poke fun at common Christian experiences
- Think: the humor of everyday faith life, not stand-up comedy

For each idea include the format and a brief description of execution.

Write ONLY the ideas, nothing else.`
    );

    return {
      title: "Funny Christian Content",
      content: response,
      suggestions: [
        "Funny content gets 3x more shares — post these on high-traffic days",
        "Film skits in batches to stay consistent",
        "Add a faith takeaway in the caption to balance humor with heart",
      ],
    };
  },
};

export const mixSkill: Skill = {
  name: "mix",
  description:
    "Generate a variety pack of content ideas — devotional, funny, educational, personal, and trending",
  examples: [
    "/mix 7 days of content for this week",
    "/mix content variety for growing my page",
    "/mix 10 posts mixing funny and faith",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const request = ctx.input || "a week of varied content";
    const response = await ctx.agent.generateContent(
      `Create a varied content mix for @jesusforeveryours: ${request}

You're planning content for a Christian faith brand for young women. The page needs VARIETY to grow — not just love notes every day. Create a balanced mix across these content pillars:

For each piece, provide:
- Content pillar (see below)
- Format (reel, carousel, single post, story series, live)
- The idea (2-3 sentences)
- A viral hook for it
- Estimated effort (easy / medium / high)

CONTENT PILLARS — mix these evenly:

1. LOVE NOTES (signature devotional content)
   - The bread and butter — intimate messages from God's heart
   - Best as carousels or text-overlay reels with worship music

2. FUNNY / RELATABLE
   - Christian humor, relatable moments, "tag your friend" content
   - Best for reels, memes, story polls
   - THIS is what gets shared and brings new followers

3. TESTIMONY / PERSONAL
   - Rose's story, vulnerable moments, real talk
   - Best for talking-head reels or carousel storytelling
   - Builds deep connection and trust

4. TEACHING / SCRIPTURE BREAKDOWN
   - Bite-sized Bible study, verse explanations, theological concepts made simple
   - Best as carousels or green-screen reels
   - Positions the brand as a go-to faith resource

5. TRENDING / CULTURE
   - Faith spin on trending audio, formats, or cultural moments
   - Best for reels — ride the algorithm wave
   - Brings in people who wouldn't normally see faith content

6. COMMUNITY / ENGAGEMENT
   - Q&A, prayer requests, "tell me" prompts, challenges
   - Best for stories and lives
   - Boosts engagement metrics which helps ALL content perform

Include a suggested posting order that maximizes engagement (hook with funny/trending, follow up with devotional depth).

Write ONLY the content plan, nothing else.`
    );

    return {
      title: "Content Mix",
      content: response,
      suggestions: [
        "Alternate between light and deep content for the best rhythm",
        "Batch-film all reels in one session, schedule throughout the week",
        "Track which pillar gets the most saves — double down on it",
      ],
    };
  },
};

export const trendsSkill: Skill = {
  name: "trends",
  description:
    "Get trending content formats, audio ideas, and what's working right now in the Christian creator space",
  examples: [
    "/trends what's working on Instagram reels right now",
    "/trends trending formats for Christian TikTok",
    "/trends YouTube Shorts ideas that are blowing up",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const platform = ctx.input || "Instagram, TikTok, and YouTube";
    const response = await ctx.agent.generateContent(
      `You are a social media strategist for Rose Renuu. She has two Instagram accounts: @roserenuu (144K followers, PRIMARY) and @jesusforeveryours (~8K followers, brand/ministry). Also 56K on TikTok and 8.5K on YouTube.

Analyze what's currently trending and working for Christian/faith creators on: ${platform}

Provide:

## TRENDING FORMATS RIGHT NOW
List 5-7 video/post formats that are currently getting massive reach. For each:
- The format name and how it works
- Why it's going viral (algorithm + audience psychology)
- How to adapt it for faith content specifically
- Example concept for @jesusforeveryours

## AUDIO & SOUND TRENDS
- 5 types of audio trending right now (worship remixes, spoken word over lo-fi, trending secular songs with faith twist, etc.)
- Suggest specific worship songs or audio styles to use

## WHAT'S WORKING FOR FAITH CREATORS (Informed by Adam Mosseri's Algorithm Insights)
- Content patterns that top Christian creators are using to grow right now
- What the algorithm is currently favoring per Mosseri: Watch Time (#1), DM Sends (#2, weighted 3-5x more than likes), Likes Per Reach (#3)
- Carousels with 8-10 slides (highest engagement format — 4x more than Reels). They get a "second chance" mechanism.
- Reels under 30 seconds for new audiences, first 3 seconds are critical
- Max 5 hashtags (Instagram limit Dec 2025) — keyword-rich captions instead (30% more reach)
- Original content priority — Mosseri's Originality Score rewards creators, penalizes aggregators
- Engagement tactics that boost DM shares (the #1 signal for reaching new audiences per Mosseri)

## PLATFORM-SPECIFIC TIPS
- Instagram: What's getting pushed to Explore right now (per Mosseri: original content, niche consistency, high engagement velocity, content that converts viewers to followers)
- TikTok: What's landing on FYP in the faith space
- YouTube Shorts: What's converting viewers to subscribers

## CONTENT THE FAITH NICHE IS MISSING
- 3-5 gaps in Christian content that Rose could fill to stand out
- Underserved topics or formats that would make her unique

Base this on proven social media growth patterns and what has historically worked for faith creators in the 100K-500K range.

Write ONLY the trend analysis, nothing else.`
    );

    return {
      title: "Trending Content Analysis",
      content: response,
      suggestions: [
        "Jump on trends within 48 hours — speed matters for virality",
        "Put your own faith spin on secular trends for crossover reach",
        "Save trending audios immediately — they get removed fast",
      ],
    };
  },
};

export const growSkill: Skill = {
  name: "grow",
  description:
    "Get platform-specific growth strategies tailored to your current follower counts",
  examples: [
    "/grow how to get to 200K on Instagram",
    "/grow YouTube growth strategy from 8K to 50K",
    "/grow TikTok strategy for faith content",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const goal = ctx.input || "grow across all platforms";
    const response = await ctx.agent.generateContent(
      `You are a social media growth strategist for Rose Renuu (@roserenuu / @jesusforeveryours).

Current stats:
- Instagram @roserenuu: 144K followers (PRIMARY)
- Instagram @jesusforeveryours: ~8K followers (brand/ministry)
- TikTok: 56K followers
- YouTube: 8.5K subscribers

Growth goal: ${goal}

Create a specific, actionable growth strategy:

## WHERE YOU ARE NOW
- Analyze what each follower count means (what growth phase she's in per platform)
- Identify the biggest growth lever for each platform at her current size

## GROWTH STRATEGY
For each platform, provide:

### Instagram (144K → next milestone)
- Use Adam Mosseri's confirmed ranking factors: Watch Time (#1), DM Sends per Reach (#2 — 3-5x more valuable than likes), Likes per Reach (#3)
- Posting frequency: 3-5 feed posts/week (prioritize carousels), 2-4 Reels/week, 5-7 Stories/day (Mosseri confirmed this prevents unfollows)
- Content ratio: Carousels are the engagement engine (4x more engagement than Reels). Reels are the growth engine (new followers). Both are essential.
- Carousels: 8-10 slides for peak engagement. Instagram's "second chance" mechanism auto-shows slide 2 if they don't swipe.
- Specific tactics to break past the 150K-200K plateau using Mosseri's algorithm intelligence
- How to increase DM SHARES and saves — these are THE metrics that matter (Mosseri confirmed). Likes are secondary.
- Max 5 hashtags per post (Instagram limit Dec 2025). Keyword-rich captions instead — 30% more reach.
- Use Trial Reels to test hooks with non-followers
- Original content only — Mosseri's Originality Score penalizes reposts (aggregators lost 60-80% reach)
- Collaboration and cross-promotion strategies

### TikTok (56K → next milestone)
- How TikTok's algorithm differs from Instagram for faith content
- Posting frequency (TikTok rewards volume differently)
- Content that converts TikTok viewers into Instagram/YouTube followers
- How to get on FYP consistently in the faith niche

### YouTube (8.5K → next milestone)
- Shorts strategy for subscriber growth
- How to convert Shorts viewers into long-form watchers
- SEO tips for faith/devotional content
- The YouTube content that builds the most loyal community

## CROSS-PLATFORM STRATEGY
- How to use each platform to feed the others
- Content repurposing workflow (create once, post everywhere)
- Which platform to prioritize for maximum overall growth

## THIS WEEK'S ACTION ITEMS
- 5 specific things Rose should do THIS WEEK to accelerate growth
- Quick wins vs long-term plays

Be specific and tactical — not generic advice. Think about what actually moves the needle at her current size.

Write ONLY the growth strategy, nothing else.`
    );

    return {
      title: "Growth Strategy",
      content: response,
      suggestions: [
        "Review this strategy weekly and track what's moving the needle",
        "Focus on ONE platform's strategy at a time to avoid burnout",
        "Consistency beats perfection — post even when it's not perfect",
      ],
    };
  },
};

export const viralSkills = [hooksSkill, funnySkill, mixSkill, trendsSkill, growSkill];
