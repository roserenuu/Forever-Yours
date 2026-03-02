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

// All 24 days of the devotional mapped for the Powerful Scriptures series
const POWERFUL_SCRIPTURES_DAYS = [
  { day: 1, title: "Forever With You", verse: `"I am with you always, even to the end of the age." — Matthew 28:20 NLT`, message: `I am with you in every moment and every chapter of your life. When happiness fills your heart, I am your God of blessings. When you are broken by pain, I am your God of healing. I am the same yesterday, today, and forever. You will never walk through a struggle or a joyful moment without Me by your side.` },
  { day: 2, title: "Gentle Knock", verse: `"Look! I stand at the door and knock. If you hear my voice and open the door, I will come in, and we will share a meal together as friends." — Revelation 3:20 NLT`, message: `I have never stopped pursuing you — even when you walked away, even when you did not know Me. I was still there, guarding you, guiding you, whispering your name in the quiet moments. I am not asking for perfection, only the real you. When you are ready, I will sit with you, speak with you, and stay with you.` },
  { day: 3, title: "Steady Guide", verse: `"I will guide you along the best pathway for your life. I will advise you and watch over you." — Psalm 32:8 NLT`, message: `I know that life can feel like walking through a maze — uncertain, full of twists and turns. But I see the entire maze from above. Even in your confusion, I will gently guide your steps. Be strong and courageous. I started your story, and I promise to finish it beautifully.` },
  { day: 4, title: "Promise Keeper", verse: `"God is not a man, so he does not lie. He is not human, so he does not change his mind. Has he ever spoken and failed to act? Has he ever promised and not carried it through?" — Numbers 23:19 NLT`, message: `When I make a promise, I always keep it. Think back on the times when everything seemed uncertain — yet somehow, the right door opened, the help arrived, a way was made. That was Me, keeping My word. Hold tightly to My promises. I will carry you through it all.` },
  { day: 5, title: "Heaven Holds You Close", verse: `"We want you to know what will happen to the believers who have died so you will not grieve like people who have no hope." — 1 Thessalonians 4:13-14 NLT`, message: `Your loved ones are not lost — they are with Me. The separation you feel is only temporary. Hold tightly to this hope: there will come a day when there will be no more death and no more tears. You will reunite with those you love. And this time, you will never have to say goodbye.` },
  { day: 6, title: "Release And Receive", verse: `"For everything there is a season, a time for every activity under heaven." — Ecclesiastes 3:1 NLT`, message: `I know who is meant to walk with you and who is not. You don't need to win anyone's approval or convince anyone to stay. The right people will be there without you needing to strive. Some people were meant for a season — it's okay to grieve the goodbyes. Release what hurts you, so it does not harm what I am giving you.` },
  { day: 7, title: "Hold On", verse: `"You don't understand now what I am doing, but someday you will." — John 13:7 NLT`, message: `I am working on your story in ways you might not recognize right now. One day, you will see how every piece fits together into something beautiful. Every trial is part of a greater plan leading you to a place of deep understanding and peace. Do not be troubled. I have your life under control. Brighter days are ahead.` },
  { day: 8, title: "Nothing Is Wasted", verse: `"Always work enthusiastically for the Lord, for you know that nothing you do for the Lord is ever useless." — 1 Corinthians 15:58 NLT`, message: `I see it all — even when you feel like no one else does. I see you offer kindness when it's not returned. I see you choose to forgive when it's hard. In moments when you question if it's worth it, know this: nothing you do for Me is ever wasted. What you plant in love, I will multiply into a harvest of good.` },
  { day: 9, title: "Beauty Within", verse: `"People judge by outward appearance, but the Lord looks at the heart." — 1 Samuel 16:7 NLT`, message: `What I see in your heart matters far more than what the world sees on the outside. Do not let anyone or anything change you, nor dim your light. When your heart is wounded, come to Me. I will restore what was lost, mend what is broken, and fill you with My peace. Through you, others will see Me.` },
  { day: 10, title: "Godly Self Love", verse: `"Love your neighbor as yourself." — Mark 12:31 NLT`, message: `You were never meant to lose yourself in the process of loving others. I name you worthy — I speak life over you and protect you with boundaries. Let that be the standard by which you treat yourself. As you learn to care for your own heart, you also learn to care for someone else's. Love yourself as I love you.` },
  { day: 11, title: "Rest Is Holy", verse: `"On the seventh day God had finished his work of creation, so he rested from all his work." — Genesis 2:2 NLT`, message: `Rest is not weakness — it is restoration. I built rest into life itself. When you refuse to pause, you begin to believe your value is tied to your output. I never asked you to live that way. Come to Me. Let rest be your worship, let stillness be your trust, and let peace be your home again.` },
  { day: 12, title: "The Peace You Need", verse: `"I am leaving you with a gift — peace of mind and heart. And the peace I give is a gift the world cannot give. So don't be troubled or afraid." — John 14:27 NLT`, message: `My peace is real and lasting. It is not based on any circumstance or distraction. I will carry you through your pain and heal every brokenness within you. Bring Me what you've been carrying, and I will trade it for My peace.` },
  { day: 13, title: "Quiet The Noise", verse: `"You will keep in perfect peace all who trust in you, all whose thoughts are fixed on you." — Isaiah 26:3 NLT`, message: `The enemy attacks you through your thoughts because he knows that if he plants seeds of doubt, they will take root and shape your life. But when you think about My faithfulness, you will walk in peace and confidence. Fix your mind on Me. Rest in My promises. Nothing can come against you, because I am always by your side.` },
  { day: 14, title: "The False Echoes", verse: `"My sheep listen to my voice; I know them, and they follow me." — John 10:27 NLT`, message: `I am not the voice that condemns or belittles you. I don't speak to you in words that tear you down or use your past against you — that is the enemy. When he tells you that you are not enough, remember that I made you wonderful. Come as you are. I will quiet the false echoes, and My peace will settle your heart.` },
  { day: 15, title: "Inner Confidence", verse: `"Those who wish to boast should boast in this alone: that they truly know me and understand that I am the Lord." — Jeremiah 9:23-24 NLT`, message: `Your value does not come from the approval of others. It comes from Me. You are already valuable because I have called you Mine. When your confidence is rooted in Me, nothing can take it away. The world cannot define you — because I already have.` },
  { day: 16, title: "Always Listening", verse: `"Trust in the Lord with all your heart; do not depend on your own understanding. Seek his will in all you do, and he will show you which path to take." — Proverbs 3:5-6 NLT`, message: `When you feel like your prayers go unheard, I promise you — when you pray, I am fully attentive. Just because I did not give you what you asked for does not mean I did not hear you. I can move any mountain in your way. No matter how I lead you, you are safe under My wings. Keep your faith strong. I am actively working.` },
  { day: 17, title: "Family And Friends", verse: `"I will rescue those who love me. I will protect those who trust in my name. When they call on me, I will answer; I will be with them in trouble." — Psalm 91:14-16 NLT`, message: `Just as you belong to Me, your loved ones belong to Me as well. Trust Me with them as you trust Me with yourself. Pray for them and place them in My hands. I promise to take great care of them, just as I take care of you. I will carry you all through everything this life brings.` },
  { day: 18, title: "Loving Again", verse: `"Love is patient and kind. Love is not jealous or boastful or proud or rude… Love never gives up, never loses faith, is always hopeful, and endures through every circumstance." — 1 Corinthians 13:4-7 NLT`, message: `You were not created to live numb to love. I am not asking you to love blindly — I am guiding you to love wisely. Come to Me first. I will heal what hurt you and lead you into love that is patient, kind, and secure.` },
  { day: 19, title: "Letting Go", verse: `"Don't let evil conquer you, but conquer evil by doing good." — Romans 12:21 NLT`, message: `Revenge does not punish them — it steals your peace and makes you live out of the wound. I don't want you to carry burdens that were never yours to carry. Trust that I am the righteous Judge, and My justice never fails. Choose forgiveness and release your pain to Me. I will cover you with peace and give rest for your soul.` },
  { day: 20, title: "Forgiveness", verse: `"Make allowance for each other's faults, and forgive anyone who offends you. Remember, the Lord forgave you, so you must forgive others." — Colossians 3:13 NLT`, message: `Forgiveness is not saying what happened was okay. It is releasing what happened into My hands so it no longer rules your heart. Bring Me the truth — every detail, every feeling, every tear. Every step toward forgiveness is a step toward peace. Let the mercy you have received become the mercy you release.` },
  { day: 21, title: "Turn To Me", verse: `"There is more joy in heaven over one lost sinner who repents and returns to God than over ninety-nine others who are righteous and haven't strayed away!" — Luke 15:7 NLT`, message: `No matter how far you have strayed, I am always here waiting for you to come back home. How you feel does not change how I feel about you. You don't need the right words. Keep coming to Me, confess your wrongs, and I will continue to work in you. My heart is not only for your rescue — but for your full restoration.` },
  { day: 22, title: "Victory Over Temptation", verse: `"This High Priest of ours understands our weaknesses, for he faced all of the same testings we do, yet he did not sin. So let us come boldly to the throne of our gracious God." — Hebrews 4:15-16 NLT`, message: `You were never meant to do this alone. The more you focus on Me and use My word to fight the desires, the stronger you will become. My presence will never leave your side — and together we will break these chains. You will no longer be controlled. You will live in freedom and peace.` },
  { day: 23, title: "Living Spirit", verse: `"For the word of God is alive and powerful. It is sharper than the sharpest two-edged sword, cutting between soul and spirit, between joint and marrow." — Hebrews 4:12 NLT`, message: `My word is like a mirror that reveals what is true about you and the world around you. It reaches the deepest parts of you, bringing conviction that heals, correction that protects, and clarity that steadies you. Let My word soften your heart, renew your mind, and realign your perspective. Allow Me to transform you from the inside out.` },
  { day: 24, title: "Paid By Love", verse: `"Though he was God, he did not think of equality with God as something to cling to. Instead, he gave up his divine privileges… he humbled himself in obedience to God and died a criminal's death on a cross." — Philippians 2:6-8 NLT`, message: `I gave My life not because you had to prove your worth — but because I love you. Even in your broken places, I saw beauty. My mercy is more powerful than your past. You no longer need to strive to be enough. I became the sacrifice. I took your place so you can take My hand. The tomb is empty, and your future is full. I did it for you.` },
];

export const powerfulScripturesSkill: Skill = {
  name: "scripture",
  description:
    "Generate a 'Powerful Scriptures You Should Know' post — Rose's 24-day series from her devotional. Use /scripture day 1 through day 24 for exact devotional posts, or /scripture [topic] to generate one on any theme.",
  examples: [
    "/scripture day 1",
    "/scripture day 7",
    "/scripture about forgiveness",
    "/scripture on God's peace",
  ],
  async execute(ctx: SkillContext): Promise<SkillResult> {
    const input = (ctx.input || "").trim();
    const dayMatch = input.match(/\b(\d+)\b/);
    const dayNum = dayMatch ? parseInt(dayMatch[1], 10) : null;

    // No day specified — ask for it
    if (!input || (dayNum === null)) {
      return {
        title: "Powerful Scriptures — Which Day?",
        content: `Which day would you like? (1–24)\n\nJust reply with the number — for example: /scripture 5`,
        suggestions: POWERFUL_SCRIPTURES_DAYS.map(
          (d) => `Day ${d.day}: ${d.title}`
        ),
      };
    }

    if (dayNum >= 1 && dayNum <= 24) {
      const entry = POWERFUL_SCRIPTURES_DAYS[dayNum - 1];
      const post = `Powerful Scriptures You Should Know — Day ${entry.day}

${entry.verse}

This is what God is telling you today…

${entry.message}

Forever Yours,
Heavenly Father`;

      return {
        title: `Powerful Scriptures — Day ${entry.day}: ${entry.title}`,
        content: post,
        suggestions: [
          "Post as a clean text graphic — use /design to have Iris create the visual",
          "Pin to your Instagram profile so new visitors find it first",
          "Share on TikTok with a text overlay — no talking needed, the words do the work",
          "Perfect for Stories: one line per slide with a soft background",
          `Pair with the full Day ${entry.day} love note for a deeper carousel (/lovenote)`,
        ],
      };
    }

    // Number out of range
    return {
      title: "Powerful Scriptures — Invalid Day",
      content: `The series goes from Day 1 to Day 24. Which day would you like?\n\nExample: /scripture 12`,
      suggestions: [],
    };
  },
};

export const contentSkills = [
  loveNoteSkill,
  captionSkill,
  reelScriptSkill,
  devotionalSkill,
  carouselSkill,
  powerfulScripturesSkill,
];
