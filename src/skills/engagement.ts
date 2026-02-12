import { Skill, SkillContext, SkillResult } from "./types.js";

export const dmReplySkill: Skill = {
  name: "reply",
  description:
    "Draft a warm, brand-consistent reply to a DM or comment from a follower",
  examples: [
    '/reply "I\'m going through a really hard time and your page gives me hope"',
    '/reply "How do I get closer to God? I feel so far from Him"',
    '/reply "Your devotional changed my life, thank you Rose!"',
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const message = ctx.input;
    if (!message) {
      return {
        title: "Reply Draft",
        content:
          'Please include the message you want to reply to. Example: /reply "their message here"',
      };
    }

    const response = await ctx.agent.generateContent(
      `Draft a reply to this message from a follower of @jesusforeveryours:

"${message}"

Guidelines:
- Reply as Rose Renuu would — warm, personal, Spirit-led
- If they're hurting, lead with empathy and comfort FIRST
- If they're praising, receive it with gratitude and point glory to God
- If they're asking a faith question, answer with love and scripture (not judgment)
- Keep it conversational — this is a DM, not a sermon
- 2-5 sentences is the sweet spot
- Include a scripture if it fits naturally
- NEVER be dismissive of someone's pain
- NEVER give clinical/therapeutic advice — point them to Jesus and professional help if needed

Write ONLY the reply, nothing else.`
    );

    return {
      title: "Reply Draft",
      content: response,
      suggestions: [
        "Personalize with their name if visible",
        "Follow up in a few days to check on them",
        "Consider sharing a relevant Love Note",
      ],
    };
  },
};

export const faqSkill: Skill = {
  name: "faq",
  description:
    "Answer common questions about Jesus Forever Yours, the devotional, or faith topics",
  examples: [
    "/faq where can I buy the devotional",
    "/faq how did Rose start this ministry",
    "/faq what Bible version do you recommend",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const question = ctx.input || "Tell me about Forever Yours";
    const response = await ctx.agent.generateContent(
      `Answer this FAQ for the Jesus Forever Yours brand:

Question: "${question}"

Context about the brand:
- "Forever Yours" is a devotional book by Rose Renuu containing "Love Notes" — intimate messages inspired by scripture
- Rose is an LA-based Christian writer/creator whose life was transformed by encountering Jesus during her darkest season
- The devotional is available at jesusforeveryours.com and roserenuu.com
- Instagram: @jesusforeveryours (brand) and @roserenuu (Rose's personal)
- Rose has 157K+ followers on Instagram
- The brand's heart is: "You are seen, loved, and never walking alone"

Answer warmly, accurately, and on-brand. If you don't know a specific detail, say so honestly rather than making something up.

Write ONLY the answer, nothing else.`
    );

    return {
      title: "FAQ Answer",
      content: response,
      suggestions: [
        "Save common Q&As for Instagram story highlights",
        "Consider a FAQ page on the website",
      ],
    };
  },
};

export const commentSkill: Skill = {
  name: "comment",
  description:
    "Generate a thoughtful comment reply for Instagram posts/reels",
  examples: [
    '/comment someone said "this is exactly what I needed today"',
    '/comment they asked "what verse is this from?"',
    '/comment a hater wrote something negative about faith content',
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const comment = ctx.input;
    if (!comment) {
      return {
        title: "Comment Reply",
        content:
          'Please include the comment you want to reply to. Example: /comment "their comment here"',
      };
    }

    const response = await ctx.agent.generateContent(
      `Draft a public comment reply for @jesusforeveryours on Instagram:

Their comment: "${comment}"

Guidelines:
- Keep it SHORT (1-3 sentences max — it's a public comment)
- Warm, grateful, and love-filled
- If it's encouragement: thank them, point to God
- If it's a question: answer briefly, invite them to DM for more
- If it's negativity: respond with grace (or suggest not responding at all)
- Use 1-2 emojis max
- Never be defensive or argumentative

Write ONLY the comment reply. If you think it's best not to reply (troll/spam), say that instead.`
    );

    return {
      title: "Comment Reply",
      content: response,
    };
  },
};

export const engagementSkills = [dmReplySkill, faqSkill, commentSkill];
