import { Skill, SkillContext, SkillResult } from "./types.js";

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

export const viralSkills = [hooksSkill, funnySkill, mixSkill];
