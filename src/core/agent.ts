import Anthropic from "@anthropic-ai/sdk";
import { BrandConfig, DEFAULT_BRAND } from "../config/brand.js";
import { Skill, SkillResult } from "../skills/types.js";
import { QAReviewer } from "./reviewer.js";
import { SchedulerAgent } from "./scheduler.js";
import { MarketerAgent } from "./marketer.js";
import { AnalyticsAgent } from "./analytics.js";
import { DataStore } from "./datastore.js";

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
  private dataStore: DataStore;

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
    this.dataStore = new DataStore();
  }

  registerSkill(skill: Skill): void {
    this.skills.set(skill.name, skill);
  }

  private buildSystemPrompt(): string {
    const skillList = Array.from(this.skills.values())
      .map((s) => `- /${s.name}: ${s.description}`)
      .join("\n");

    const writingPatterns = this.brand.voice.writingPatterns?.length
      ? `\n## Writing Patterns (MUST follow)\n${this.brand.voice.writingPatterns.map((p) => `- ${p}`).join("\n")}`
      : "";

    const sampleNote = this.brand.voice.sampleLoveNote
      ? `\n## Rose's Actual Writing (match this voice EXACTLY)\n${this.brand.voice.sampleLoveNote}`
      : "";

    return `You are Eden — Rose Renuu's personal AI content strategist and creative partner. You work exclusively for Rose — the creator behind "${this.brand.name}".

## WHO YOU WORK FOR
Rose Renuu (@roserenuu / @jesusforeveryours) — Christian content creator, author of the "Forever Yours" devotional.
- Instagram: 144K followers (PRIMARY)
- TikTok: 56K followers
- YouTube: 8.5K subscribers
- X (Twitter): Growing
- Threads: Emerging
- Facebook: Community building
- Goal: 1 MILLION followers. Become the biggest and best Christian content creator on the internet.

## Your Mission
${this.brand.mission}

## Your Role (You are Eden)
You are Eden — Rose's personal content machine. When she asks for content, give her the BEST content — optimized for virality, engagement, and growth while staying true to her voice and faith. Think like her creative director, social media manager, copywriter, and growth strategist all in one. Every response should help her get closer to 1 million.

## Your Team
- **Selah** (QA Reviewer) — reviews everything you write before Rose sees it. Bring your A-game.
- **Mara** (Scheduler) — plans the weekly content calendar. Rose uses /schedule to talk to her.
- **Zion** (Marketing) — handles product promos and sales content. Rose uses /promote to talk to him.
- **Navi** (Analytics) — reads performance data and tells the team what's working. Rose uses /insights to talk to her. When Navi gives directives, FOLLOW THEM — she has the data.
You handle all creative content. If Rose asks about scheduling, remind her to use /schedule. If she asks about product promos, remind her to use /promote. If she asks about what's working or analytics, remind her to use /insights.

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

${this.dataStore.getSummaryForAgents()}`;
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

      // Mara (Scheduler) handles /schedule — inject live data
      if (skillName === "schedule") {
        console.log("[Mara] Planning your content calendar...");
        const dataContext = this.dataStore.getSummaryForAgents();
        const plan = await this.scheduler.planWeek(
          `${skillInput.trim()}\n\n${dataContext}`
        );
        console.log("[Mara] Calendar ready — sending to Rose.");
        return `**Mara's Content Calendar**\n\n${plan}`;
      }

      // Navi (Analytics) handles /insights — inject live data
      if (skillName === "insights") {
        const dataContext = this.dataStore.getSummaryForAgents();
        const input = skillInput.trim();
        if (input) {
          console.log("[Navi] Analyzing your data...");
          const insights = await this.analytics.analyze(
            `${input}\n\n${dataContext}`
          );
          console.log("[Navi] Insights ready — sending to Rose + team.");
          return `**Navi's Insights Report**\n\n${insights}`;
        } else {
          console.log("[Navi] Analyzing live dashboard data...");
          const insights = await this.analytics.analyze(dataContext);
          console.log("[Navi] Insights ready — sending to Rose + team.");
          return `**Navi's Insights Report**\n\n${insights}`;
        }
      }

      // Zion (Marketing) handles /promote — inject live data
      if (skillName === "promote") {
        console.log("[Zion] Crafting your marketing content...");
        const dataContext = this.dataStore.getSummaryForAgents();
        const promo = await this.marketer.promote(
          `${skillInput.trim() || "Forever Yours devotional book"}\n\n${dataContext}`
        );
        console.log("[Zion] Promo ready — sending to Rose.");
        return `**Zion's Marketing Plan**\n\n${promo}`;
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
  }

  getBrand(): BrandConfig {
    return this.brand;
  }
}
