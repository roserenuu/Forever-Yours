import { BrandConfig } from "../config/brand.js";
import { ForeverYoursAgent } from "../core/agent.js";

export interface SkillContext {
  input: string;
  brand: BrandConfig;
  agent: ForeverYoursAgent;
}

export interface SkillResult {
  title: string;
  content: string;
  suggestions?: string[];
  metadata?: Record<string, unknown>;
}

export interface Skill {
  name: string;
  description: string;
  examples: string[];
  execute(context: SkillContext): Promise<SkillResult>;
}
