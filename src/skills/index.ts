import { contentSkills } from "./content.js";
import { engagementSkills } from "./engagement.js";
import { strategySkills } from "./strategy.js";
import { Skill } from "./types.js";

export const allSkills: Skill[] = [
  ...contentSkills,
  ...engagementSkills,
  ...strategySkills,
];

export { contentSkills, engagementSkills, strategySkills };
export type { Skill, SkillContext, SkillResult } from "./types.js";
