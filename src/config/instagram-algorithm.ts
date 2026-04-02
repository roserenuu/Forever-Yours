/**
 * Adam Mosseri's Instagram Algorithm Intelligence
 * ================================================
 * Comprehensive knowledge base compiled from Adam Mosseri's (Head of Instagram)
 * public statements, Q&As, interviews, Threads posts, and year-end memos.
 *
 * Last updated: February 2026
 * Sources: Mosseri's Instagram/Threads, interviews with MKBHD, Friday Q&As,
 * year-end 2025 memo (20-slide post), Social Media Today, Hootsuite, Buffer.
 */

export const MOSSERI_ALGORITHM_INTELLIGENCE = {
  lastUpdated: "2026-02",

  /**
   * THE 3 CORE RANKING FACTORS
   * Confirmed by Adam Mosseri in January 2025.
   * These are THE signals the algorithm cares about most.
   */
  coreRankingFactors: {
    summary:
      "Instagram's algorithm ranks content based on 3 core factors confirmed by Mosseri: watch time, likes per reach, and sends per reach (DM shares).",
    factors: [
      {
        name: "Watch Time",
        rank: 1,
        description:
          "How long people spend viewing your content — watching Reels, reading carousels, pausing on photos. Includes replays and rewatch behavior.",
        mosseriQuote:
          "Watch time is the #1 ranking factor. How long people watch matters more than likes or shares for initial distribution.",
        tips: [
          "Hook viewers in the first 1.7 seconds — users make a stay-or-scroll decision that fast",
          "The first 3 seconds of your video are critical for the algorithm",
          "Longer watch time = more distribution. Make people want to rewatch",
          "For carousels: more slides = more time spent = higher watch time signal",
          "Completion rate matters — keep Reels short enough to watch fully",
        ],
      },
      {
        name: "Sends Per Reach (DM Shares)",
        rank: 2,
        description:
          "How often people share your content via DM. This is the STRONGEST signal for reaching new audiences. Weighted 3-5x higher than likes.",
        mosseriQuote:
          "DM shares carry the most weight for unconnected reach. The platform wants to inspire content that brings people together.",
        tips: [
          "Create content people want to SEND to a specific person — 'tag someone who needs this'",
          "DM sends to close friends = highest value signal",
          "Story reshares = high value",
          "Ask yourself: 'Would someone send this to their friend at 2am?' If yes, post it",
          "100 likes matter LESS than 10 DM shares for reaching new people",
        ],
        shareHierarchy: [
          "DM sends to close friends (highest value)",
          "Story reshares (high value)",
          "External shares (moderate value)",
          "Link copies (lower value)",
        ],
      },
      {
        name: "Likes Per Reach",
        rank: 3,
        description:
          "Not raw likes — RELATIVE to reach. A post with 100 likes and 1,000 reach (10%) outperforms 500 likes and 10,000 reach (5%).",
        mosseriQuote:
          "Likes per reach matters more for existing followers, while DM shares matter more for reaching new audiences.",
        tips: [
          "Engagement QUALITY beats quantity",
          "Focus on like rate (likes/reach), not total likes",
          "This metric matters more for connected reach (your existing followers)",
        ],
      },
    ],
  },

  /**
   * MULTIPLE ALGORITHMS — NOT ONE
   * Each surface of Instagram runs its own ranking system.
   */
  algorithmSurfaces: {
    summary:
      "Instagram doesn't use one algorithm — it uses multiple ranking systems, each tailored to a different surface of the app.",
    surfaces: [
      {
        name: "Feed",
        signals:
          "Relationship history, post popularity, content type preferences, recency",
      },
      {
        name: "Reels",
        signals:
          "Watch time, completion rate, sends, likes, audio popularity, content freshness",
      },
      {
        name: "Stories",
        signals:
          "Viewing history, engagement history, closeness to the creator",
      },
      {
        name: "Explore",
        signals:
          "Content quality, topic relevance, engagement velocity, creator follow rate from post",
      },
    ],
  },

  /**
   * CAROUSELS — THE ENGAGEMENT ENGINE
   * Mosseri has specifically called out carousels as a top-performing format.
   */
  carouselStrategy: {
    summary:
      "Carousels are the highest-performing organic format on Instagram. They get a unique 'second chance' mechanism no other format gets.",
    stats: {
      engagementRate: "1.92% average — nearly 4x more than Reels (0.50%)",
      boostLikelihood: "23% more likely to be algorithmically boosted",
      vsReels: "3.1x higher engagement than single-image posts",
      maxSlides: 20,
      sweetSpotSlides: "8-10 slides for peak engagement (2.07% rate)",
    },
    secondChanceMechanism: {
      mosseriQuote:
        "If someone sees your carousel post but they don't swipe, we'll often give that carousel a second chance and automatically move to that second piece of media for the viewer.",
      explanation:
        "Your carousel gets TWO chances to hook someone. No other format gets this re-show opportunity. Make slide 2 visually different and compelling.",
    },
    bestPractices: [
      "Use 8-10 slides for maximum engagement",
      "Engagement dips after slide 3, then increases again after slide 8 — reward the full swipe-through",
      "Completion rate (swiping to last slide) signals quality content to the algorithm",
      "Saves signal lasting interest and are weighted more heavily than likes",
      "Educational and reference content drives the highest save rates",
      "Design each slide to stand alone visually — people share individual slides to stories",
      "The first slide is everything — if they don't stop scrolling, nothing else matters",
      "Use cliffhangers between slides to drive swipes",
      "End with a strong CTA on the final slide",
    ],
    vsReels:
      "Reels are growth engines (new followers); carousels are engagement engines (saves, shares, loyalty). A mature strategy uses both: 2-3 Reels/week + 1-2 strategic carousels/week.",
  },

  /**
   * REELS STRATEGY
   * Watch time is king for Reels.
   */
  reelsStrategy: {
    summary: "Reels are the primary growth format. Watch time determines distribution.",
    optimalLength: {
      newAudiences: "Under 30 seconds — easier to watch completely, better for discovery",
      existingFollowers: "30-90 seconds — deeper content for people who already care",
      maximum: "Under 3 minutes — anything longer is ineligible for recommendations",
    },
    criticalFirstSeconds:
      "Users make a stay-or-scroll decision in 1.7 seconds. If your Reel doesn't hook in the first 3 seconds, the algorithm reduces distribution.",
    tips: [
      "Front-load the hook — the opening frame and first words determine everything",
      "Pattern interrupts in the first second (unexpected visual, bold text, surprising statement)",
      "Retention matters more than length — a 15-second Reel watched twice beats a 60-second Reel watched halfway",
      "No third-party watermarks (TikTok, CapCut logos) — Mosseri confirmed these get downranked",
      "Use Trial Reels to test content with non-followers before posting to your audience",
    ],
    trialReels: {
      mosseriQuote:
        "Trial Reels let you create a Reel shown only to non-followers. It's a great way to test if your content ranks highly before sharing it to your audience.",
      strategy:
        "Test hooks and topics with cold audiences. If a Trial Reel performs well, post it broadly.",
    },
  },

  /**
   * STORIES STRATEGY
   * Stories don't bring new followers but prevent unfollows.
   */
  storiesStrategy: {
    summary:
      "Stories don't directly attract new followers, but they are essential for audience retention.",
    mosseriQuote:
      "Creators who post Stories frequently experience fewer unfollows.",
    tips: [
      "Post 5-7 Stories per day for optimal retention",
      "Use interactive stickers (polls, questions, sliders) to boost engagement",
      "Stories build relationship depth — they make followers feel connected",
      "Behind-the-scenes, day-in-the-life content works best for Stories",
    ],
  },

  /**
   * HASHTAGS — THE NEW REALITY (2025-2026)
   * Mosseri has been very clear: hashtags don't boost reach anymore.
   */
  hashtagStrategy: {
    summary:
      "Hashtags no longer boost reach. Instagram now limits posts to 5 hashtags max (December 2025). Focus on keyword-rich captions instead.",
    mosseriQuotes: [
      "They're done. I'll tell you that they don't work. — to MKBHD",
      "Hashtags don't significantly increase your reach on Instagram, contrary to popular belief.",
      "While I know it can be tempting to use more, a few specific tags actually perform better than a long list of generic ones. Quality over quantity is key.",
    ],
    newLimit: {
      maxHashtags: 5,
      effectiveDate: "December 2025",
      reason: "To combat spam and hashtag stuffing",
    },
    whatHashtagsDoNow: [
      "Help Instagram understand what your content is about (metadata/categorization)",
      "Improve searchability for people looking for specific topics",
      "Do NOT expand distribution or boost reach",
    ],
    bestPractices: [
      "Use 3-5 highly relevant, niche-specific hashtags maximum",
      "Mix branded tags (#JesusForeverYours), niche tags, and 1-2 trending tags",
      "Rotate tags — don't use identical sets in every post (Instagram may flag as spam)",
      "Never use banned or broken hashtags",
      "Keyword-rich captions generate 30% more reach and 2x more likes than hashtag-heavy posts (Hootsuite 2026 data)",
    ],
  },

  /**
   * INSTAGRAM SEO — THE NEW DISCOVERY METHOD
   * Keywords in captions have replaced hashtags for discovery.
   */
  instagramSEO: {
    summary:
      "Instagram now uses AI to understand your content through captions, on-screen text, spoken words in videos, and alt text — not just hashtags.",
    mosseriQuote:
      "The platform now relies on AI and recommendation engines, rather than hashtags, to determine what users see.",
    keywordPlacement: [
      "Write keyword-rich captions in natural language using phrases people search for",
      "Use keywords in on-screen text overlays in Reels and carousels",
      "Include relevant keywords in your bio",
      "Add descriptive alt text to images with relevant keywords",
      "Spoken words in Reels are analyzed by Instagram's AI — say the keywords out loud",
    ],
    captionStrategy: [
      "Write captions with searchable phrases people would type into Instagram search",
      "Lead with the most important keywords in the first line",
      "Use natural language — don't keyword stuff",
      "Longer captions (150-300 words) give more keyword signal while keeping engagement",
    ],
  },

  /**
   * ORIGINAL CONTENT PRIORITY
   * Aggregators and reposters are being crushed.
   */
  originalContentPolicy: {
    summary:
      "Instagram's algorithm now uses an 'Originality Score' to detect recycled content. Original creators saw 40-60% reach increases while aggregators saw 60-80% drops.",
    mosseriQuote:
      "Rewarding creativity is one of Instagram's main priorities.",
    penalties: [
      "Reposting TikTok videos with watermarks — significantly downranked",
      "Reusing trending content verbatim — penalized",
      "Aggregator accounts posting others' content without transformation — 60-80% reach drops",
      "Recycled clips detected by Originality Score — reduced distribution",
    ],
    rewards: [
      "Original content from creators gets priority in recommendations",
      "Small creators with original content get more Explore page visibility",
      "Content that adds genuine transformation to trending formats is rewarded",
    ],
  },

  /**
   * EXPLORE PAGE STRATEGY
   * How to get featured on Instagram's Explore page.
   */
  explorePage: {
    summary:
      "Explore emphasizes content quality and topic relevance over relationships — it's a pure discovery surface where small creators compete with large accounts.",
    howItWorks: [
      "Explore looks at content quality and topic relevance, not relationships",
      "Content that converts viewers into followers gets boosted on Explore",
      "How many times people visit your profile after seeing your content matters",
      "Early engagement velocity (fast likes, saves, shares after posting) is critical",
    ],
    tipsToGetFeatured: [
      "Create original content — Instagram rewards originality on Explore",
      "Add audio to posts/carousels — Instagram promotes newer features",
      "Stay niche-consistent — AI categorizes you based on your last 9-12 posts",
      "No watermarks from other apps",
      "Optimize your profile so Explore visitors convert to followers",
      "Use Trial Reels to test what resonates with non-followers",
    ],
  },

  /**
   * WHAT NOT TO DO — THINGS THAT KILL YOUR REACH
   * Based on Mosseri's explicit warnings.
   */
  whatNotToDo: {
    summary: "Things Mosseri has explicitly said will hurt your reach and growth.",
    penalties: [
      {
        action: "Hashtag stuffing (6+ hashtags)",
        consequence: "No reach benefit; may be flagged as spam. Max 5 allowed since Dec 2025.",
        mosseriSays: "A few specific tags actually perform better than a long list of generic ones.",
      },
      {
        action: "Reposting content / aggregation",
        consequence: "60-80% reach drop. Instagram labels and penalizes reposts.",
        mosseriSays: "Original content gets prioritized. Aggregators are deprioritized.",
      },
      {
        action: "Using bots, fake engagement, or engagement pods",
        consequence: "Account penalties, reduced distribution, potential shadowban.",
        mosseriSays: "Fake engagements hurt your account.",
      },
      {
        action: "Videos with third-party watermarks (TikTok, CapCut)",
        consequence: "Reduced reach on Instagram.",
        mosseriSays: "Ensure final videos don't display watermarks from third-party apps.",
      },
      {
        action: "Posting low-quality content for quantity",
        consequence: "Algorithm rewards quality over frequency.",
        mosseriSays: "Focus on quality, not quantity.",
      },
      {
        action: "Engagement bait / gaming the algorithm",
        consequence: "Deprioritized in feed. Instagram asks: 'did you seek this out, or are you scrolling past something designed to trap your attention?'",
        mosseriSays: "The algorithm favors genuine interest over mechanical engagement.",
      },
      {
        action: "Topic inconsistency (posting about random topics)",
        consequence: "Your last 9-12 posts determine topic categorization. Inconsistency triggers distribution penalties.",
        mosseriSays: "Stay consistent in your niche for the algorithm to categorize you properly.",
      },
    ],
  },

  /**
   * SHADOW BANNING — MOSSERI'S POSITION
   */
  shadowBanning: {
    mosseriPosition:
      "Mosseri has said 'shadow banning is not a thing' but acknowledges Instagram does penalize some content with reduced distribution.",
    clarification:
      "In connected ranking (your followers), Instagram does NOT limit reach intentionally. For unconnected reach (Explore, recommendations), content may be filtered if it violates guidelines.",
    commonCauses: [
      "Content quality or guideline issues",
      "Account status issues (recent violations)",
      "Using banned or broken hashtags",
      "Sudden activity spikes that look bot-like",
    ],
  },

  /**
   * POSTING CADENCE — MOSSERI'S RECOMMENDATIONS
   */
  postingCadence: {
    summary: "Mosseri's recommended posting frequency for optimal growth.",
    recommended: {
      feedPosts: "3-5 per week (prioritize carousels)",
      reels: "2-4 per week",
      stories: "Daily, 5-7 per day",
      lives: "1-2 per month for community building",
    },
    timing: [
      "No scheduling penalty — Mosseri confirmed scheduled posts perform the same",
      "Consistency matters more than specific times",
      "Long absences hurt — the algorithm has less recent data when you return",
      "Regular posting improves organic reach over time",
    ],
  },

  /**
   * CONNECTED VS UNCONNECTED REACH
   */
  reachTypes: {
    connected: {
      description: "Reaching people who already follow you",
      primarySignal: "Likes per reach",
      strategy: "Maintain relationship through consistent, quality content",
    },
    unconnected: {
      description: "Reaching people who don't follow you (Explore, Reels, recommendations)",
      primarySignal: "DM sends per reach",
      strategy:
        "Create highly shareable, original content that people want to send to friends",
    },
  },

  /**
   * SMALL ACCOUNT GROWTH — MOSSERI'S ADVICE
   */
  smallAccountGrowth: {
    mosseriQuote:
      "Be clear on your goals. Are you trying to sell a product? Build a brand? Evangelise a cause?",
    tips: [
      "Be intentional — know your goals and explore all Instagram formats",
      "Create shareable content — DM shares are the strongest growth signal",
      "Focus on original content — reposts won't grow your account",
      "Stay consistent — regular posting gives the algorithm data to work with",
      "Use all formats — Reels, Stories, Carousels. Instagram favors well-rounded engagement",
      "Stories for retention — they prevent unfollows even though they don't attract new followers",
      "Authenticity over polish — relatable, lo-fi content often outperforms overproduced content",
      "Use Trial Reels to test what resonates before committing to a full post",
    ],
    platformSupport:
      "Instagram is working on improving content discovery for creators with smaller followings. The platform says it's on the roadmap.",
  },

  /**
   * AI & TRANSLATIONS — NEW FEATURES
   */
  newFeatures: {
    aiTranslations: {
      mosseriQuote:
        "Translations are a tactic for boosting reach, since more people can understand and engage with your content.",
      details:
        "Instagram rolled out AI-powered translations for Reels in late 2025, translating text and audio into Hindi, Portuguese, English, and Spanish.",
    },
    trialReels: {
      description:
        "Create a Reel shown only to non-followers to test performance before posting broadly.",
      strategy: "Use for testing hooks, topics, and formats with cold audiences.",
    },
    audioPosts: {
      description: "Adding audio to posts and carousels — Instagram promotes newer features.",
      strategy: "Posts with built-in audio get a visibility boost.",
    },
  },

  /**
   * MOSSERI'S 2026 OUTLOOK — YEAR-END MEMO
   * From his 20-slide Instagram memo posted December 31, 2025.
   */
  outlook2026: {
    summary:
      "Mosseri's year-end 2025 memo focused on authenticity in the age of AI, the shift from social graph to interest graph to trust graph, and the future of creator-native content.",
    keyInsights: [
      "Authenticity is becoming infinitely reproducible — AI can fake what made creators matter",
      "The internet is heading toward 'a world of infinite synthetic content'",
      "Platforms are moving from social graph era → interest graph era → trust graph era",
      "Overly produced content underperforms vs human-scale, lo-fi, creator-native formats",
      "Big budgets need to feel small. Ads that look like ads leak attention",
      "Private sharing, DMs, and recommendations are doing more distribution work than the public grid",
      "Optimize for shareability, not just likes — 'Would you send this to someone?' is the test",
      "Deepfakes and AI content are increasingly sophisticated — authenticity becomes premium",
    ],
    forCreators:
      "The creators who will win in 2026 are the ones who are genuinely authentic, create original content, and build real community. The algorithm is increasingly designed to reward this.",
  },
};

/**
 * Generates a concise algorithm brief for injection into agent system prompts.
 * This ensures every agent has Mosseri's insights baked into their decision-making.
 */
export function getAlgorithmBriefForAgents(): string {
  return `
## INSTAGRAM ALGORITHM INTELLIGENCE (Adam Mosseri, Head of Instagram — Updated Feb 2026)

### THE 3 RANKING FACTORS THAT MATTER (Confirmed by Mosseri, Jan 2025)
1. **WATCH TIME** (#1 factor) — How long people spend on your content. First 3 seconds are critical. Completion rate and rewatches count.
2. **SENDS PER REACH / DM SHARES** (#2 factor) — Weighted 3-5x higher than likes. THE strongest signal for reaching new audiences. "Would someone send this to a friend?" is the test.
3. **LIKES PER REACH** (#3 factor) — Engagement quality over quantity. 100 likes on 1,000 reach (10%) > 500 likes on 10,000 reach (5%).

### CAROUSELS — THE ENGAGEMENT ENGINE
- Carousels get 1.92% engagement (4x more than Reels, 4x more than single images)
- 23% more likely to be algorithmically boosted
- **SECOND CHANCE MECHANISM** (Mosseri confirmed): "If someone sees your carousel but doesn't swipe, we'll give it a second chance and automatically move to the second slide." NO other format gets this.
- Sweet spot: 8-10 slides (2.07% engagement rate)
- Max slides: 20
- Saves on carousels signal lasting interest — weighted more than likes
- Reels = growth engines (new followers). Carousels = engagement engines (saves, shares, loyalty). Use BOTH.

### REELS — THE GROWTH ENGINE
- Under 30 seconds for new audiences. 30-90 seconds for existing followers. Max 3 minutes.
- First 1.7 seconds = stay-or-scroll decision. First 3 seconds are critical.
- No watermarks from TikTok/CapCut — Mosseri confirmed these get downranked.
- Use Trial Reels to test hooks with non-followers before posting broadly.

### HASHTAGS ARE DEAD FOR REACH (Mosseri: "They don't work")
- Instagram now caps posts at 5 hashtags max (Dec 2025)
- Hashtags help categorization/search, NOT distribution
- **INSTEAD**: Write keyword-rich captions. Hootsuite data: keyword captions = 30% more reach + 2x more likes than hashtag-heavy posts.
- Instagram's AI reads your captions, on-screen text, spoken words, and alt text for discovery — write for search, not hashtags.

### ORIGINAL CONTENT IS MANDATORY
- Instagram's "Originality Score" detects recycled content
- Aggregator accounts saw 60-80% reach drops. Original creators saw 40-60% increases.
- Reposted content, TikTok watermarks, and verbatim trend copies are penalized.

### WHAT KILLS YOUR REACH (Per Mosseri)
- Hashtag stuffing (6+ tags)
- Reposting/recycling content without transformation
- Bots, fake engagement, engagement pods
- Third-party watermarks on videos
- Posting low-quality content just for frequency
- Engagement bait / gaming the algorithm
- Topic inconsistency (last 9-12 posts determine your niche categorization)

### POSTING CADENCE (Mosseri Recommended)
- Feed posts: 3-5/week (prioritize carousels)
- Reels: 2-4/week
- Stories: Daily, 5-7/day (prevents unfollows — Mosseri confirmed)
- No scheduling penalty — confirmed by Mosseri

### EXPLORE PAGE
- Pure discovery surface — small creators compete with large accounts
- Content that converts viewers to followers gets boosted
- Stay niche-consistent (AI uses your last 9-12 posts to categorize you)
- Original content + high engagement velocity = Explore page feature

### 2026 OUTLOOK (Mosseri Year-End Memo)
- Platform moving to "trust graph era" — authenticity is premium
- Lo-fi, creator-native content outperforms overproduced content
- "Ads that look like ads leak attention" — blend naturally
- DMs and private sharing are doing more distribution than the public grid
- Optimize for shareability: "Would you send this to someone?"
- AI-generated content is flooding platforms — genuine human authenticity wins`;
}

/**
 * Generates carousel-specific guidance for content creation agents.
 */
export function getCarouselAlgorithmTips(): string {
  return `## CAROUSEL ALGORITHM OPTIMIZATION (Mosseri Insights)
- Use 8-10 slides for peak engagement (2.07% rate)
- Slide 1 = EVERYTHING. Bold, emotional, curiosity-driven. Stops the scroll.
- Slide 2 must be visually different — Instagram's "second chance" mechanism auto-shows slide 2 if they didn't swipe
- Engagement dips after slide 3, rises after slide 8 — reward the full swipe-through
- Completion rate (swiping to last slide) = quality signal to algorithm
- Educational/reference content drives highest save rates (saves > likes for algorithm)
- Each slide should stand alone visually — people share individual slides to stories
- DM shareability is the #1 goal — create carousel content people want to SEND to someone
- End with a clear CTA: save, share, tag someone, comment`;
}

/**
 * Generates Reels-specific guidance for content creation agents.
 */
export function getReelsAlgorithmTips(): string {
  return `## REELS ALGORITHM OPTIMIZATION (Mosseri Insights)
- First 3 seconds determine EVERYTHING — users decide to stay or scroll in 1.7 seconds
- Under 30 seconds for reaching new audiences (easier to complete = better signal)
- 30-90 seconds for existing followers (deeper content, higher total watch time)
- Never exceed 3 minutes (ineligible for recommendations)
- Watch time is the #1 ranking factor — make people rewatch
- NO third-party watermarks (TikTok, CapCut) — Mosseri confirmed downranking
- Use Trial Reels to test hooks with non-followers first
- Original content only — recycled/reposted clips are penalized by Originality Score
- Retention > length. A 15-second Reel watched twice > 60-second Reel watched halfway
- Add text overlays with keywords — Instagram's AI reads them for discovery`;
}

/**
 * Generates caption/SEO guidance for content creation agents.
 */
export function getCaptionSEOTips(): string {
  return `## CAPTION & SEO OPTIMIZATION (Mosseri Insights — 2026)
- KEYWORDS OVER HASHTAGS: Write keyword-rich captions using phrases people search for
- Keyword captions = 30% more reach + 2x more likes than hashtag-heavy posts (Hootsuite 2026)
- Instagram's AI reads: captions, on-screen text, spoken words in Reels, alt text, bio
- Lead with the most important/searchable keywords in the first line
- Write in natural language — don't keyword stuff
- Caption length sweet spot: 150-300 words
- MAX 5 HASHTAGS (Instagram limit since Dec 2025): 3-5 relevant, niche-specific only
- Mix: 1 branded tag (#JesusForeverYours), 2-3 niche tags, 1 trending tag
- Rotate hashtag sets — identical sets across posts may be flagged as spam
- Strong CTA in every caption: save, share, tag someone, comment, follow
- Line breaks for readability — walls of text kill engagement`;
}
