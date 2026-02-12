import Anthropic from "@anthropic-ai/sdk";
import { BrandConfig, DEFAULT_BRAND } from "../config/brand.js";
import { Skill, SkillResult } from "../skills/types.js";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentOptions {
  brand?: BrandConfig;
  model?: string;
  maxTokens?: number;
}

export class ForeverYoursAgent {
  private client: Anthropic;
  private brand: BrandConfig;
  private model: string;
  private maxTokens: number;
  private skills: Map<string, Skill> = new Map();
  private conversationHistory: AgentMessage[] = [];

  constructor(options: AgentOptions = {}) {
    this.client = new Anthropic();
    this.brand = options.brand ?? DEFAULT_BRAND;
    this.model = options.model ?? "claude-sonnet-4-5-20250929";
    this.maxTokens = options.maxTokens ?? 2048;
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

    return `You are the AI Brand Agent for "${this.brand.name}", created by ${this.brand.creator}.

## Mission
${this.brand.mission}

## Rose Renuu's Voice — Study This Carefully
Rose writes Love Notes as if God Himself is speaking directly to one person — His child. Her writing is:
- Tone: ${this.brand.voice.tone.join(", ")}
- ${this.brand.voice.personality.join("\n- ")}

## Signature Style
${this.brand.voice.signatureStyle}
${writingPatterns}
${sampleNote}

## CRITICAL: Every Love Note Must Be Unique
- NEVER repeat themes, titles, or structures from previous notes in this conversation
- Each note should address a DIFFERENT specific struggle or moment
- Vary the scripture used — draw from the full Bible, not just the same popular verses
- Vary the emotional angle — sometimes grief, sometimes joy, sometimes conviction, sometimes tenderness
- Vary sentence structure — sometimes use parallel lists, sometimes narrative flow, sometimes questions

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
1. Every piece of content should point people to the love of Jesus.
2. Match Rose's EXACT voice — study the sample Love Note above. If it doesn't sound like Rose wrote it, rewrite it.
3. Acknowledge real pain FIRST, then offer God's truth. Never be dismissive.
4. Ground everything in scripture, but weave it in naturally like a love letter, not a sermon.
5. When someone is hurting, lead with empathy and God's comfort before anything else.
6. Protect the brand voice fiercely — this ministry is built on authenticity.
7. For Love Notes: always open with "My Child," and close with "Forever Yours, Heavenly Father" then one NLT scripture.

When a user message starts with "/" followed by a skill name, execute that skill with the provided input.`;
  }

  async chat(userMessage: string): Promise<string> {
    // Check if the message is a skill command
    const skillMatch = userMessage.match(/^\/(\w+)\s*(.*)/s);
    if (skillMatch) {
      const [, skillName, skillInput] = skillMatch;
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

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

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
  }

  getBrand(): BrandConfig {
    return this.brand;
  }
}
