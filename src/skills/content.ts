import { Skill, SkillContext, SkillResult } from "./types.js";
import {
  getCarouselAlgorithmTips,
  getReelsAlgorithmTips,
  getCaptionSEOTips,
} from "../config/instagram-algorithm.js";

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

${getCaptionSEOTips()}

Requirements:
- Match the warm, intimate, devotional voice of Rose Renuu
- Include a scripture reference
- KEYWORD-RICH CAPTION: Write using natural, searchable phrases that people would type into Instagram search. Lead with the most important keywords. Instagram's AI reads captions for discovery — this is MORE important than hashtags now.
- Include a strong call-to-action that drives DM SHARES (Mosseri confirmed DM sends are the #1 signal for reaching new audiences — 3-5x more valuable than likes). Use CTAs like "Send this to someone who needs it today", "Share this with a friend going through it", or "Save this for when you need a reminder". DM-share CTAs > generic "like this post".
- MAX 5 hashtags at the end (Instagram's limit since Dec 2025 — Mosseri: "a few specific tags perform better than a long list"). Use: #JesusForeverYours + 2-3 niche tags + 1 trending tag. Rotate sets between posts.
- Caption length: 150-300 words (Instagram sweet spot)
- Use line breaks for readability
- Include relevant emojis sparingly (1-3 max)

Write ONLY the caption, nothing else.`
    );

    return {
      title: "Instagram Caption",
      content: response,
      suggestions: [
        "Best posting times: 9am, 12pm, or 7pm — no scheduling penalty (Mosseri confirmed)",
        "Max 5 hashtags (Instagram limit Dec 2025). Keywords in captions = 30% more reach than hashtags",
        "Optimize CTA for DM shares — 'Send this to someone' is 3-5x more valuable than likes (Mosseri)",
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

${getReelsAlgorithmTips()}

Format the script as:
HOOK (first 1.7-3 seconds — Mosseri confirmed users decide to stay or scroll in 1.7 seconds. This is EVERYTHING):
[The opening line/visual — must create an instant pattern interrupt. Bold statement, unexpected visual, or emotionally striking first frame. The algorithm measures watch time from this moment.]

BODY (15-45 seconds):
[Scene-by-scene breakdown with what to say and show]
[Include text overlays with searchable keywords — Instagram's AI reads on-screen text for discovery]
[Add retention hooks every 5-7 seconds to prevent drop-off]

CLOSING (last 5 seconds):
[Call to action optimized for DM SHARES — "Send this to someone who needs to hear this" is more valuable than "like and follow". Mosseri: DM sends are 3-5x more important than likes for reaching new audiences.]

CAPTION: [Keyword-rich caption — Instagram's AI reads captions for discovery. Write using searchable phrases. Max 5 hashtags.]
AUDIO SUGGESTION: [Worship song or trending audio that fits — NO songs with third-party watermarks]

Requirements:
- Under 30 seconds if targeting NEW audiences (easier to watch completely = better algorithm signal)
- 30-60 seconds if for EXISTING followers (higher total watch time)
- Never exceed 90 seconds (3+ minutes = ineligible for recommendations per Mosseri)
- The hook MUST stop the scroll in 1.7 seconds — this is the #1 factor
- Match Rose's authentic, vulnerable, faith-filled style
- Include at least one scripture reference
- Make it emotionally resonant — content people want to SEND to a friend
- ORIGINAL content only — no recycled clips (Mosseri's Originality Score penalizes reposts)
- No watermarks from TikTok/CapCut — Mosseri confirmed downranking

Write ONLY the script, nothing else.`
    );

    return {
      title: "Reel Script",
      content: response,
      suggestions: [
        "Film in natural lighting for the JFY aesthetic — lo-fi, authentic content outperforms overproduced (Mosseri 2026)",
        "Add text overlays with searchable keywords — Instagram's AI reads on-screen text for discovery",
        "Use Trial Reels to test this hook with non-followers before posting to your audience",
        "Under 30 seconds for maximum new audience reach. No watermarks from other apps.",
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

${getCarouselAlgorithmTips()}

Write this in Rose Renuu's voice — warm, intimate, scripture-rooted, poetic but accessible.

FORMAT — provide EVERY slide's content exactly as it should appear:

SLIDE 1 (HOOK — must stop the scroll):
Headline: [Bold, short, emotional — this is what makes someone swipe. Mosseri: carousels get a "second chance" mechanism where Instagram auto-shows slide 2 if they don't swipe. But slide 1 is still everything for the initial stop.]
Subtext: [Optional 1-line teaser]

SLIDE 2 (THE SECOND CHANCE SLIDE — Mosseri confirmed Instagram auto-shows this if someone doesn't swipe):
- Must be VISUALLY DIFFERENT from slide 1 — different color, different layout, different energy
- This is your second hook — make it as compelling as slide 1
- Headline: [Short, punchy — draw them into the story]

SLIDE 3-7 (BODY — the heart of the message):
For each slide provide:
- Headline: [Short, punchy — 3-8 words max]
- Body: [1-3 sentences that expand on the headline]
- Design note: [Brief direction — e.g., "scripture overlay", "handwritten feel", "bold text on soft background"]

SLIDE 8 (SCRIPTURE):
- Full verse text in NLT
- Reference

SLIDE 9 (CTA — call to action):
- A warm closing line
- CTA: [Prioritize DM SHARE CTAs: "Send this to someone who needs it today" — Mosseri confirmed DM sends are 3-5x more valuable than likes for reaching new audiences. Also: save, tag someone.]

---

CAPTION: [Full Instagram caption in Rose's voice, 150-250 words. KEYWORD-RICH — write using searchable phrases people would type into Instagram search. Instagram's AI reads captions for discovery. Include a strong CTA that drives DM shares. Line breaks for readability.]

HASHTAGS: [MAX 5 — Instagram's limit since Dec 2025. Use: #JesusForeverYours + 2-3 niche tags + 1 trending tag. Rotate between posts.]

DESIGN DIRECTION:
- Color palette suggestion
- Font style (serif for headers, handwritten for scripture, etc.)
- Overall mood/aesthetic

Rules:
- 8-10 slides total (Mosseri data: 8-10 slides = peak engagement at 2.07%. Engagement dips after slide 3 then rises after slide 8 — reward the full swipe-through)
- Each slide should be readable in 2-3 seconds
- Build emotional momentum — hook → second chance → depth → scripture → action
- The carousel should tell a complete story or deliver a complete message
- Match Rose's exact voice and tone throughout
- Use NLT for scripture
- Design each slide to STAND ALONE visually — people share individual slides to their Stories
- Optimize for SAVES — educational/reference content drives highest save rates, which are weighted more than likes by the algorithm
- The ultimate test (per Mosseri): "Would someone send this carousel to a friend in a DM?"

Write ONLY the carousel content, nothing else.`
    );

    return {
      title: "Instagram Carousel",
      content: response,
      suggestions: [
        "Copy each slide's text directly into your Canva template",
        "Carousels get 4x more engagement than Reels — Mosseri confirmed they get a 'second chance' auto-show of slide 2",
        "Aim for 8-10 slides (peak engagement). DM shares are 3-5x more valuable than likes for reach — optimize CTAs for sends",
        "Use Trial Reels to test hook concepts before building full carousels",
      ],
    };
  },
};

export const powerfulScriptureSkill: Skill = {
  name: "scripture",
  description:
    "Generate a Powerful Scriptures post — a single daily scripture script based on Rose's '24 Days with Jesus' devotional. Specify a day number (1-24).",
  examples: [
    "/scripture 1",
    "/scripture 7",
    "/scripture 14",
    "/scripture 24",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const input = ctx.input.trim();
    const dayNum = parseInt(input, 10);

    // If no valid day number provided, ask which day
    if (!input || isNaN(dayNum) || dayNum < 1 || dayNum > 24) {
      return {
        title: "Powerful Scriptures",
        content: `**Which day would you like?**\n\nThis series is based on the *Forever Yours: 24 Days with Jesus* devotional.\n\nJust type \`/scripture [day number]\` — for example:\n- \`/scripture 1\` — Day 1: Forever With You\n- \`/scripture 5\` — Day 5: Heaven Holds You Close\n- \`/scripture 12\` — Day 12: The Peace You Need\n- \`/scripture 24\` — Day 24: Paid By Love\n\nPick any day from 1 to 24 and I'll write your Powerful Scriptures post for that day.`,
      };
    }

    const response = await ctx.agent.generateContent(
      `Write a "Powerful Scriptures" social media script for Day ${dayNum} from Rose's devotional "Forever Yours: 24 Days with Jesus."

IMPORTANT: Pull the EXACT scripture verse and love letter content from Day ${dayNum} of the devotional. Do NOT make up or paraphrase the scripture — use the exact verse and reference from that day in the devotional.

EXACT FORMAT (follow precisely — this is a script meant to be read aloud or posted as text):

Line 1: "Powerful scriptures you should know Day ${dayNum}."

Line 2: "[Exact Bible verse from Day ${dayNum} of the devotional]. [Book Chapter:Verse]."

Line 3: "This is what God is telling you today…"

Line 4: [Select the most powerful and impactful lines from the Day ${dayNum} love letter. Condense the love letter into 3-5 of the strongest sentences that capture the heart of the message. Do NOT use the full letter — pick the lines that hit hardest. Keep the original wording from the devotional as much as possible.]

Line 5: "Forever Yours, Heavenly Father."

RULES:
- Pull DIRECTLY from Day ${dayNum} of the "Forever Yours: 24 Days with Jesus" devotional
- Use the EXACT Bible verse and reference from that day — do not substitute a different verse
- The condensed message should be 3-5 sentences selected from the actual love letter for that day
- Keep Rose's original wording — do not rewrite or paraphrase heavily
- This is ONE post only — do not generate multiple days
- No emojis in the script itself
- Each line should be on its own line with a blank line between them for readability
- Use quotation marks around the verse and the message portions as shown in the format

Write ONLY the Powerful Scriptures script, nothing else.`
    );

    return {
      title: `Powerful Scriptures — Day ${dayNum}`,
      content: response,
      suggestions: [
        "Post as a text-based Instagram carousel or single slide",
        "Use as a voiceover script for a Reel or TikTok",
        "Share as an Instagram Story series",
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
  powerfulScriptureSkill,
];
