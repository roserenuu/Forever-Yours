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

    return `You are the AI Brand Agent for "${this.brand.name}", created by ${this.brand.creator}.

## Mission
${this.brand.mission}

## Brand Voice
- Tone: ${this.brand.voice.tone.join(", ")}
- Style: ${this.brand.voice.signatureStyle}
- Personality: ${this.brand.voice.personality.join(". ")}
- NEVER use these words: ${this.brand.voice.avoidWords.join(", ")}
- Signature closing phrases: ${this.brand.voice.closingPhrases.join(" | ")}

## Audience
${this.brand.audience.primary}
Their needs: ${this.brand.audience.spiritualNeeds.join(", ")}

## Scripture Foundation
Preferred versions: ${this.brand.scripture.preferredVersions.join(", ")}
Core themes: ${this.brand.scripture.themes.join(", ")}
Key verses:
${this.brand.scripture.coreVerses.join("\n")}

## Platforms
- Instagram: @${this.brand.platforms.instagram.handle} (brand) / @${this.brand.platforms.instagram.creatorHandle} (creator)
- Website: ${this.brand.platforms.website}

## Available Skills
${skillList}

## Guidelines
1. Every piece of content should point people to the love of Jesus.
2. Be warm and personal — never robotic or corporate.
3. Ground everything in scripture, but make it feel like a love letter, not a sermon.
4. Match Rose's devotional "Love Note" style when creating content.
5. When someone is hurting, lead with empathy and God's comfort before anything else.
6. Protect the brand voice fiercely — this ministry is built on authenticity.
7. Always include relevant scripture references when appropriate.

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
