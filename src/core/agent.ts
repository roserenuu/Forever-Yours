import Anthropic from "@anthropic-ai/sdk";
import { BrandConfig, DEFAULT_BRAND } from "../config/brand.js";
import { Skill, SkillResult } from "../skills/types.js";
import { QAReviewer } from "./reviewer.js";
import { SchedulerAgent } from "./scheduler.js";
import { MarketerAgent } from "./marketer.js";
import { AnalyticsAgent } from "./analytics.js";
import { AdCopyAgent } from "./ad-copy.js";
import { EmailMarketingAgent } from "./email-marketing.js";
import { CommunityAgent } from "./community.js";
import { PartnershipsAgent } from "./partnerships.js";
import { DataStore } from "./datastore.js";
import { CsvImporter } from "./csv-import.js";
import { ConnectorManager } from "./connectors.js";
import { Dashboard } from "./dashboard.js";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentOptions {
  brand?: BrandConfig;
  model?: string;
  maxTokens?: number;
  enableReviewer?: boolean;
}

export class ForeverYoursAgent {
  private client: Anthropic;
  private brand: BrandConfig;
  private model: string;
  private maxTokens: number;
  private skills: Map<string, Skill> = new Map();
  private conversationHistory: AgentMessage[] = [];
  private reviewer: QAReviewer | null = null;
  private scheduler: SchedulerAgent;
  private marketer: MarketerAgent;
  private analytics: AnalyticsAgent;
  private adCopy: AdCopyAgent;
  private emailMarketing: EmailMarketingAgent;
  private community: CommunityAgent;
  private partnerships: PartnershipsAgent;
  private dataStore: DataStore;
  private csvImporter: CsvImporter;
  private connectors: ConnectorManager;
  private dashboard: Dashboard;

  constructor(options: AgentOptions = {}) {
    this.client = new Anthropic();
    this.brand = options.brand ?? DEFAULT_BRAND;
    this.model = options.model ?? "claude-sonnet-4-5-20250929";
    this.maxTokens = options.maxTokens ?? 2048;

    if (options.enableReviewer !== false) {
      this.reviewer = new QAReviewer(this.brand, this.model);
    }
    this.scheduler = new SchedulerAgent(this.brand, this.model);
    this.marketer = new MarketerAgent(this.brand, this.model);
    this.analytics = new AnalyticsAgent(this.brand, this.model);
    this.adCopy = new AdCopyAgent(this.brand, this.model);
    this.emailMarketing = new EmailMarketingAgent(this.brand, this.model);
    this.community = new CommunityAgent(this.brand, this.model);
    this.partnerships = new PartnershipsAgent(this.brand, this.model);
    this.dataStore = new DataStore();
    this.csvImporter = new CsvImporter(this.dataStore);
    this.connectors = new ConnectorManager(this.dataStore);
    this.dashboard = new Dashboard(this.dataStore);
  }

  registerSkill(skill: Skill): void {
    this.skills.set(skill.name, skill);
  }

  private buildSystemPrompt(): string {
    const skillList = Array.from(this.skills.values())
      .map((s) => `- /${s.name}: ${s.description}`)
      .join("\n");

    const dataCommands = `
- /fetch — Pull live data from connected platform APIs (YouTube, Instagram, TikTok, X). Use "/fetch youtube" to pull YouTube Shorts and long-form video stats with view counts, likes, comments, AND full transcripts/captions for every video. Shorts are automatically detected by duration (<=60s). Transcripts let you analyze what Rose said in each video.
- /sync — Manually feed your stats (e.g. /sync instagram 145000 followers)
- /stats — View your current data summary
- /dashboard — Visual analytics dashboard with charts
- /import — Import a CSV analytics export (e.g. /import path/to/file.csv)
- /connect — See which platforms are connected and setup guide`;

    const writingPatterns = this.brand.voice.writingPatterns?.length
      ? `\n## Writing Patterns (MUST follow)\n${this.brand.voice.writingPatterns.map((p) => `- ${p}`).join("\n")}`
      : "";

    const sampleNote = this.brand.voice.sampleLoveNote
      ? `\n## Rose's Actual Writing (match this voice EXACTLY)\n${this.brand.voice.sampleLoveNote}`
      : "";

    return `You are Eden — Rose Renuu's personal AI content strategist and creative partner. You work exclusively for Rose — the creator behind "${this.brand.name}".

## WHO YOU WORK FOR
Rose Renuu — Christian content creator, author of the "Forever Yours" devotional.

Rose has TWO Instagram accounts that work together as one brand:
- **@roserenuu** — Rose's personal creator account. This is HER face, her story, her personal brand. More behind-the-scenes, personal testimony, day-in-the-life content.
- **@jesusforeveryours** — The ministry/brand account. 144K followers. This is where the Love Notes, devotionals, and faith content live. This is the PRIMARY growth account.

Both accounts are part of the same brand. Content on @roserenuu drives traffic to @jesusforeveryours and vice versa. Cross-promote between them.

All platforms:
- Instagram @roserenuu: Rose's personal creator account
- Instagram @jesusforeveryours: 144K followers (PRIMARY brand account)
- TikTok: 56K followers
- YouTube: 8.5K subscribers
- X (Twitter): Growing
- Threads: Emerging
- Facebook: Community building
- Goal: 1 MILLION total followers. Become the biggest and best Christian content creator on the internet.

## Your Mission
${this.brand.mission}

## Your Role (You are Eden)
You are Eden — Rose's personal content machine. When she asks for content, give her the BEST content — optimized for virality, engagement, and growth while staying true to her voice and faith. Think like her creative director, social media manager, copywriter, and growth strategist all in one. Every response should help her get closer to 1 million.

## Your Team
- **Selah** (QA Reviewer) — reviews everything you write before Rose sees it. Bring your A-game.
- **Mara** (Scheduler) — plans the weekly content calendar. Rose uses /schedule to talk to her.
- **Zion** (Marketing) — handles organic product promos and sales content. Rose uses /promote to talk to him.
- **Navi** (Analytics) — reads performance data and tells the team what's working. Rose uses /insights to talk to her. When Navi gives directives, FOLLOW THEM — she has the data.
- **Adara** (Ad Copy & Paid Media) — creates paid ad campaigns, A/B test variants, and landing page copy. Rose uses /ads to talk to her.
- **Lyra** (Email Marketing) — builds email sequences, newsletters, automations, and list-building strategies. Rose uses /emails to talk to her.
- **Kaia** (Community Manager) — manages DM responses, comment strategy, follower relationships, and community growth. Rose uses /community to talk to her.
- **Nova** (Partnerships) — handles brand deals, creator collabs, sponsorships, and strategic partnerships. Rose uses /partners to talk to her.
You handle all creative content. If Rose asks about scheduling, remind her to use /schedule. If she asks about organic product promos, remind her to use /promote. If she asks about paid ads, remind her to use /ads. If she asks about email marketing or newsletters, remind her to use /emails. If she asks about community engagement or DMs, remind her to use /community. If she asks about brand deals or collabs, remind her to use /partners. If she asks about what's working or analytics, remind her to use /insights.

## Rose Renuu's Voice — Study This Carefully
Rose writes Love Notes as if God Himself is speaking directly to one person — His child. Her writing is:
- Tone: ${this.brand.voice.tone.join(", ")}
- ${this.brand.voice.personality.join("\n- ")}

## Signature Style
${this.brand.voice.signatureStyle}
${writingPatterns}
${sampleNote}

## CRITICAL: Every Love Note Must Be Unique
- NEVER repeat themes, titles, structures, or KEY PHRASES from previous notes in this conversation
- If you used "I see you" in the last note, do NOT use it again in the next one
- If you used a "When you... I am..." parallel structure last time, use a completely different structure next time
- Each note should address a DIFFERENT specific struggle or moment
- Vary the scripture used — draw from the full Bible, not just the same popular verses (Jeremiah 31:3, Psalm 139:14, and Isaiah 43:1 are overused — dig deeper)
- Vary the emotional angle — sometimes grief, sometimes joy, sometimes conviction, sometimes tenderness, sometimes holy anger, sometimes playful delight
- Vary sentence structure — sometimes use parallel lists, sometimes narrative flow, sometimes questions, sometimes short punchy sentences, sometimes one long flowing thought
- Vary the OPENING after "My Child," — don't always start with "I see you" or "I know" — try starting with a question, a declaration, a vivid image, or a surprising truth

## NEVER Use These Words/Phrases
${this.brand.voice.avoidWords.join(", ")}

## Audience
${this.brand.audience.primary}
Their needs: ${this.brand.audience.spiritualNeeds.join(", ")}

## Scripture Foundation
ALWAYS use NLT translation. Include the full verse text and reference.
Core themes:
${this.brand.scripture.themes.map((t) => `- ${t}`).join("\n")}

Key verses (use these AND find fresh ones):
${this.brand.scripture.coreVerses.join("\n")}

## Platforms
- Instagram: @${this.brand.platforms.instagram.handle} / @${this.brand.platforms.instagram.creatorHandle}
- Website: ${this.brand.platforms.website}

## Available Skills
${skillList}

## Data & Analytics Commands
${dataCommands}

## Using Transcript & Performance Data
When video transcripts and performance data are available in the dashboard below:
- Study Rose's TOP-performing video transcripts — mirror those hooks, topics, and energy in new scripts
- Study the LOWEST-performing transcripts — do NOT repeat those hooks, openings, or topics
- If Rose keeps saying the same things across multiple videos (check transcripts), write something FRESH — flag the repetition to her
- When writing reel/Short scripts, model the structure after her highest-viewed videos
- Use her actual phrases from winning videos as building blocks for new content (authentic voice)

## Guidelines
1. Every piece of content should point people to the love of Jesus AND be optimized for maximum reach.
2. Match Rose's EXACT voice — study the sample Love Note above. If it doesn't sound like Rose wrote it, rewrite it.
3. Acknowledge real pain FIRST, then offer God's truth. Never be dismissive.
4. Ground everything in scripture, but weave it in naturally like a love letter, not a sermon.
5. When someone is hurting, lead with empathy and God's comfort before anything else.
6. Protect the brand voice fiercely — this ministry is built on authenticity.
7. For Love Notes: always open with "My Child," and close with "Forever Yours, Heavenly Father" then one NLT scripture.
8. Always think about GROWTH — every caption should have a strong CTA, every reel should have a scroll-stopping hook, every carousel should be save-worthy.
9. Be proactive — if Rose asks for a love note, also suggest how to repurpose it across platforms for maximum reach.
10. Think like the best social media strategist in the game. Rose is going to 1 million. Help her get there.

When a user message starts with "/" followed by a skill name, execute that skill with the provided input.
ALL slash commands listed above are valid — including /fetch, /sync, /stats, /dashboard, /import, and /connect. These data commands are handled automatically by the system. If a user asks about them or wants to use them, confirm they are available and guide them on usage.

${this.dataStore.getSummaryForAgents()}

${this.dataStore.getTranscriptBrief()}

${this.dataStore.getDirectiveForAgent("eden")}`;
  }

  async chat(userMessage: string): Promise<string> {
    // Route to specialized agents first
    const skillMatch = userMessage.match(/^\/(\w+)\s*(.*)/s);
    if (skillMatch) {
      const [, skillName, skillInput] = skillMatch;

      // /sync — Feed data into the system
      if (skillName === "sync") {
        const input = skillInput.trim();
        if (!input) {
          return `**How to sync your data**\n\nPaste your stats in any of these formats:\n\n**Platform stats:**\n\`instagram 145000 followers\`\n\`tiktok 58000 followers reach 500000\`\n\`youtube 9000 subs engagement 4.5%\`\n\n**Content performance:**\n\`reel identity in Christ 50000 reach 2000 saves 500 shares\`\n\`carousel love notes 30000 reach 5000 saves\`\n\n**Multiple lines at once:**\n\`\`\`\ninstagram 145000 followers reach 800000\ntiktok 58000 followers\nreel identity reel 50000 views 2000 likes\ncarousel healing series 30000 reach 5000 saves\n\`\`\`\n\nYour data is saved locally and every agent reads it automatically.`;
        }
        console.log("[DataStore] Syncing your data...");
        const results = this.dataStore.parseAndSync(input);
        return `**Data Synced**\n\n${results}\n\nAll agents now have access to your latest data. Use \`/stats\` to see everything or \`/insights\` for Navi's analysis.`;
      }

      // /stats — View your current data dashboard
      if (skillName === "stats") {
        return `**Your Brand Dashboard**\n\n${this.dataStore.getSummaryForAgents()}`;
      }

      // /dashboard — Visual analytics dashboard
      if (skillName === "dashboard") {
        return this.dashboard.render();
      }

      // /import — Import CSV analytics exports
      if (skillName === "import") {
        const filePath = skillInput.trim();
        if (!filePath) {
          return `**Import Analytics CSV**\n\nUsage: \`/import path/to/file.csv\`\n\nExport analytics from your platform dashboards:\n- **Instagram**: Professional Dashboard > Insights > Export\n- **YouTube**: Studio > Analytics > Advanced Mode > Export\n- **TikTok**: Analytics > Export Data\n- **X**: Analytics > Export\n- **Facebook**: Insights > Export\n\nThe importer auto-detects which platform the CSV is from.`;
        }
        console.log("[DataStore] Importing CSV...");
        const result = this.csvImporter.importFile(filePath);
        return `**CSV Import Complete**\n\n${result}\n\nUse \`/dashboard\` to see your updated analytics or \`/insights\` for Navi's analysis.`;
      }

      // /fetch — Pull live data from connected APIs
      if (skillName === "fetch") {
        const platform = skillInput.trim();
        if (platform) {
          console.log(`[Connectors] Fetching ${platform} data...`);
          const result = await this.connectors.fetchOne(platform);
          return `**API Fetch**\n\n${result}`;
        }
        console.log("[Connectors] Fetching all connected platforms...");
        const result = await this.connectors.fetchAll();
        return `**API Fetch**\n\n${result}`;
      }

      // /connect — Show connection status and setup guide
      if (skillName === "connect") {
        const status = this.connectors.getStatus();
        const guide = this.connectors.getSetupGuide();
        return `${status}\n\n---\n\n${guide}`;
      }

      // Mara (Scheduler) handles /schedule — inject live data + transcripts + Navi's directives
      if (skillName === "schedule") {
        console.log("[Mara] Planning your content calendar...");
        const dataContext = this.dataStore.getSummaryForAgents();
        const transcriptBrief = this.dataStore.getTranscriptBrief();
        const naviDirective = this.dataStore.getDirectiveForAgent("mara");
        const fullContext = [dataContext, transcriptBrief, naviDirective].filter(Boolean).join("\n\n");
        const plan = await this.scheduler.planWeek(
          `${skillInput.trim()}\n\n${fullContext}`
        );
        console.log("[Mara] Calendar ready — sending to Rose.");
        return `**Mara's Content Calendar**\n\n${plan}`;
      }

      // Navi (Analytics) handles /insights — inject live data + transcripts
      if (skillName === "insights") {
        const dataContext = this.dataStore.getSummaryForAgents();
        const transcriptBrief = this.dataStore.getTranscriptBrief();
        const fullContext = transcriptBrief
          ? `${dataContext}\n\n${transcriptBrief}`
          : dataContext;
        const input = skillInput.trim();
        let insights: string;
        if (input) {
          console.log("[Navi] Analyzing your data + transcripts...");
          insights = await this.analytics.analyze(
            `${input}\n\n${fullContext}`
          );
        } else {
          console.log("[Navi] Analyzing live dashboard data + transcripts...");
          insights = await this.analytics.analyze(fullContext);
        }

        // Parse and save Navi's directives so all agents can read them
        this.saveNaviDirectives(insights);
        console.log("[Navi] Insights saved — all agents now have updated directives.");

        return `**Navi's Insights Report**\n\n${insights}`;
      }

      // Zion (Marketing) handles /promote — inject live data + transcripts + Navi's directives
      if (skillName === "promote") {
        console.log("[Zion] Crafting your marketing content...");
        const dataContext = this.dataStore.getSummaryForAgents();
        const transcriptBrief = this.dataStore.getTranscriptBrief();
        const naviDirective = this.dataStore.getDirectiveForAgent("zion");
        const fullContext = [dataContext, transcriptBrief, naviDirective].filter(Boolean).join("\n\n");
        const promo = await this.marketer.promote(
          `${skillInput.trim() || "Forever Yours devotional book"}\n\n${fullContext}`
        );
        console.log("[Zion] Promo ready — sending to Rose.");
        return `**Zion's Marketing Plan**\n\n${promo}`;
      }

      // Adara (Ad Copy) handles /ads — inject live data + transcripts + Navi's directives
      if (skillName === "ads") {
        console.log("[Adara] Creating your ad campaign...");
        const dataContext = this.dataStore.getSummaryForAgents();
        const transcriptBrief = this.dataStore.getTranscriptBrief();
        const naviDirective = this.dataStore.getDirectiveForAgent("adara");
        const fullContext = [dataContext, transcriptBrief, naviDirective].filter(Boolean).join("\n\n");
        const ad = await this.adCopy.createAd(
          `${skillInput.trim() || "Forever Yours devotional book — drive sales"}\n\n${fullContext}`
        );
        console.log("[Adara] Ad campaign ready — sending to Rose.");
        return `**Adara's Ad Campaign**\n\n${ad}`;
      }

      // Lyra (Email Marketing) handles /emails — inject live data + transcripts + Navi's directives
      if (skillName === "emails") {
        console.log("[Lyra] Building your email content...");
        const dataContext = this.dataStore.getSummaryForAgents();
        const transcriptBrief = this.dataStore.getTranscriptBrief();
        const naviDirective = this.dataStore.getDirectiveForAgent("lyra");
        const fullContext = [dataContext, transcriptBrief, naviDirective].filter(Boolean).join("\n\n");
        const email = await this.emailMarketing.createEmail(
          `${skillInput.trim() || "weekly devotional newsletter"}\n\n${fullContext}`
        );
        console.log("[Lyra] Email content ready — sending to Rose.");
        return `**Lyra's Email Strategy**\n\n${email}`;
      }

      // Kaia (Community) handles /community — inject live data + Navi's directives
      if (skillName === "community") {
        console.log("[Kaia] Working on community engagement...");
        const dataContext = this.dataStore.getSummaryForAgents();
        const naviDirective = this.dataStore.getDirectiveForAgent("kaia");
        const fullContext = [dataContext, naviDirective].filter(Boolean).join("\n\n");
        const engagement = await this.community.engage(
          `${skillInput.trim() || "general community engagement strategy"}\n\n${fullContext}`
        );
        console.log("[Kaia] Community plan ready — sending to Rose.");
        return `**Kaia's Community Plan**\n\n${engagement}`;
      }

      // Nova (Partnerships) handles /partners — inject live data + Navi's directives
      if (skillName === "partners") {
        console.log("[Nova] Working on partnerships...");
        const dataContext = this.dataStore.getSummaryForAgents();
        const naviDirective = this.dataStore.getDirectiveForAgent("nova");
        const fullContext = [dataContext, naviDirective].filter(Boolean).join("\n\n");
        const partnership = await this.partnerships.partner(
          `${skillInput.trim() || "find brand partnership opportunities"}\n\n${fullContext}`
        );
        console.log("[Nova] Partnership strategy ready — sending to Rose.");
        return `**Nova's Partnership Strategy**\n\n${partnership}`;
      }

      // Eden handles all other skills
      const skill = this.skills.get(skillName);
      if (skill) {
        const result = await this.executeSkill(skill, skillInput.trim());
        return this.formatSkillResult(result);
      }
    }

    this.conversationHistory.push({ role: "user", content: userMessage });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: this.buildSystemPrompt(),
      messages: this.conversationHistory,
    });

    let assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Selah (QA Reviewer) checks Eden's draft before it reaches Rose
    if (this.reviewer) {
      console.log("[Selah] Reviewing Eden's draft...");
      const review = await this.reviewer.review(userMessage, assistantMessage);
      if (!review.approved && review.revised) {
        console.log(
          `[Selah] Sent it back to revise — issues: ${review.notes.join("; ")}`
        );
        assistantMessage = review.revised;
      } else {
        console.log("[Selah] Approved — sending to Rose.");
      }
    }

    this.conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    return assistantMessage;
  }

  /**
   * Parse Navi's insights report and extract per-agent directives.
   * Saves them to the DataStore so every agent can read them.
   */
  private saveNaviDirectives(insights: string): void {
    const extractDirective = (agentLabel: string): string => {
      // Match "**To AgentName (Role):**" or "**To AgentName:**" followed by content until next "**To" or "###"
      const pattern = new RegExp(
        `\\*\\*To ${agentLabel}[^*]*\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*To |### |$)`,
        "i"
      );
      const match = insights.match(pattern);
      return match ? match[1].trim() : "";
    };

    const directives = {
      fullReport: insights,
      eden: extractDirective("Eden"),
      mara: extractDirective("Mara"),
      zion: extractDirective("Zion"),
      adara: extractDirective("Adara"),
      lyra: extractDirective("Lyra"),
      kaia: extractDirective("Kaia"),
      nova: extractDirective("Nova"),
      updatedAt: new Date().toISOString(),
    };

    this.dataStore.saveTeamDirectives(directives);
  }

  private async executeSkill(
    skill: Skill,
    input: string
  ): Promise<SkillResult> {
    return skill.execute({
      input,
      brand: this.brand,
      agent: this,
    });
  }

  private formatSkillResult(result: SkillResult): string {
    let output = `**${result.title}**\n\n${result.content}`;
    if (result.suggestions?.length) {
      output += `\n\n💡 *Suggestions:* ${result.suggestions.join(" • ")}`;
    }
    return output;
  }

  async generateContent(prompt: string): Promise<string> {
    return this.chat(prompt);
  }

  clearHistory(): void {
    this.conversationHistory = [];
    this.reviewer?.clearHistory();
    this.scheduler.clearHistory();
    this.marketer.clearHistory();
    this.analytics.clearHistory();
    this.adCopy.clearHistory();
    this.emailMarketing.clearHistory();
    this.community.clearHistory();
    this.partnerships.clearHistory();
  }

  getBrand(): BrandConfig {
    return this.brand;
  }
}
