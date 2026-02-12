import { contentSkills } from "./content.js";
import { engagementSkills } from "./engagement.js";
import { strategySkills } from "./strategy.js";
import { viralSkills } from "./viral.js";
import { Skill } from "./types.js";

export const allSkills: Skill[] = [
  ...contentSkills,
  ...engagementSkills,
  ...strategySkills,
  ...viralSkills,
];

export { contentSkills, engagementSkills, strategySkills, viralSkills };
export type { Skill, SkillContext, SkillResult } from "./types.js";
