import { Skill, SkillContext, SkillResult } from "./types.js";

export const campaignSkill: Skill = {
  name: "campaign",
  description:
    "Plan a content campaign or series for the Jesus Forever Yours brand",
  examples: [
    "/campaign 7-day Love Notes series for Valentine's week",
    "/campaign Easter devotional launch plan",
    "/campaign book launch content strategy",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const brief = ctx.input || "a week-long devotional content series";
    const response = await ctx.agent.generateContent(
      `Create a content campaign plan for @jesusforeveryours:

Brief: ${brief}

Provide:
1. CAMPAIGN NAME: [Catchy, on-brand name]
2. GOAL: [What this campaign aims to achieve]
3. DURATION: [Timeline]
4. CONTENT CALENDAR:
   - Day-by-day breakdown
   - Content type for each day (post, reel, story, carousel, live)
   - Theme/topic for each piece
   - Best posting time suggestion
5. HASHTAG & SEO STRATEGY: [Max 5 hashtags per post (Instagram limit since Dec 2025). Focus on keyword-rich captions instead — Instagram's AI reads captions for discovery. Mosseri confirmed hashtags don't boost reach anymore.]
6. ENGAGEMENT PLAN: [How to drive DM SHARES — Mosseri confirmed DM sends are 3-5x more valuable than likes for reaching new audiences. Optimize every piece for shareability: "Would someone send this to a friend?"]
7. ALGORITHM OPTIMIZATION: [Use Mosseri's 3 ranking factors: Watch Time (#1), DM Sends (#2), Likes Per Reach (#3). Carousels with 8-10 slides for peak engagement. Reels under 30 seconds for new audiences. Daily Stories for retention.]
8. CROSS-PROMOTION: [How to tie in the devotional book, website, @roserenuu]

Keep it practical and actionable. Rose is a one-person creator, so nothing too complex.

Write ONLY the campaign plan, nothing else.`
    );

    return {
      title: "Campaign Plan",
      content: response,
      suggestions: [
        "Batch-create content for the whole campaign",
        "Schedule posts using Later or Planoly",
        "Create a campaign highlight on Instagram",
      ],
    };
  },
};

export const ideasSkill: Skill = {
  name: "ideas",
  description:
    "Brainstorm content ideas for Instagram, devotionals, or other platforms",
  examples: [
    "/ideas 10 reel concepts for this month",
    "/ideas carousel topics about identity in Christ",
    "/ideas devotional themes for a new book chapter",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const request = ctx.input || "10 Instagram content ideas for this week";
    const response = await ctx.agent.generateContent(
      `Brainstorm content ideas for @jesusforeveryours:

Request: ${request}

For each idea provide:
- The idea/topic (1 line)
- Content format suggestion (post, reel, carousel, story, live)
- A one-line hook or angle

Make sure ideas:
- Align with the Forever Yours brand voice
- Cover a mix of the core themes (love, identity, healing, hope, intimacy with Jesus)
- Are timely and relevant to young Christian women
- Include a mix of easy-to-create and higher-effort content
- Are scroll-stopping — think about what makes someone pause

Write ONLY the ideas list, nothing else.`
    );

    return {
      title: "Content Ideas",
      content: response,
      suggestions: [
        "Star your favorites and schedule them out",
        "Ask your audience which topics resonate most",
        "Repurpose top ideas across multiple formats",
      ],
    };
  },
};

export const bioSkill: Skill = {
  name: "bio",
  description: "Generate or refresh Instagram bio, website copy, or brand taglines",
  examples: [
    "/bio refresh my Instagram bio",
    "/bio write a website hero section",
    "/bio 5 tagline options for merch",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const request = ctx.input || "refresh the Instagram bio for @jesusforeveryours";
    const response = await ctx.agent.generateContent(
      `Help with brand copy for Jesus Forever Yours:

Request: ${request}

Context:
- Brand: Jesus Forever Yours
- Creator: Rose Renuu (@roserenuu)
- Core message: "You are seen, loved, and never walking alone."
- Devotional: "Forever Yours" — Love Notes inspired by scripture
- Audience: Young women seeking hope and Jesus
- Website: jesusforeveryours.com

Requirements:
- On-brand and faith-centered
- Concise and impactful
- If it's an Instagram bio: max 150 characters
- If it's website copy: compelling and conversion-oriented
- If it's taglines: provide 5+ options ranging from soft to bold

Write ONLY the requested copy, nothing else.`
    );

    return {
      title: "Brand Copy",
      content: response,
    };
  },
};

export const strategySkills = [campaignSkill, ideasSkill, bioSkill];
