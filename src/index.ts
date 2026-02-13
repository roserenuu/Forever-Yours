import "dotenv/config";
import { ForeverYoursAgent } from "./core/agent.js";
import { allSkills } from "./skills/index.js";
import * as readline from "readline";

async function main() {
  console.log("\n");
  console.log("  ┌────────────────────────────────────────────────────┐");
  console.log("  │           JESUS FOREVER YOURS                      │");
  console.log("  │           AI Brand Team — CLI Mode                 │");
  console.log("  │                                                    │");
  console.log("  │  Eden (Creator) · Selah (QA) · Mara (Scheduler)   │");
  console.log("  │  Zion (Marketing) · Navi (Analytics)               │");
  console.log("  │  You are seen. You are loved. You are His.         │");
  console.log("  └────────────────────────────────────────────────────┘");
  console.log("");

  const agent = new ForeverYoursAgent();

  for (const skill of allSkills) {
    agent.registerSkill(skill);
  }

  console.log("  Eden's skills:");
  for (const skill of allSkills) {
    console.log(`    /${skill.name} — ${skill.description}`);
  }
  console.log("");
  console.log("  Team commands:");
  console.log("    /schedule — Mara plans your weekly content calendar");
  console.log("    /promote  — Zion creates marketing content for your products");
  console.log("    /insights — Navi analyzes your performance and directs the team");
  console.log("");
  console.log("  Data commands:");
  console.log("    /dashboard — Visual analytics dashboard");
  console.log("    /sync      — Feed your stats manually");
  console.log("    /import    — Import CSV from platform analytics exports");
  console.log("    /fetch     — Pull live data from connected APIs");
  console.log("    /connect   — Set up API connections to your platforms");
  console.log("    /stats     — View raw data summary");
  console.log("");
  console.log('  Type a message or use a /skill command. Type "exit" to quit.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question("  You: ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) return prompt();
      if (trimmed.toLowerCase() === "exit") {
        console.log("\n  Forever Yours. 🕊️\n");
        rl.close();
        return;
      }

      try {
        console.log("  ...\n");
        const response = await agent.chat(trimmed);
        console.log(`  Eden: ${response}\n`);
      } catch (error: any) {
        console.error(`  Error: ${error.message}\n`);
      }

      prompt();
    });
  };

  prompt();
}

main().catch(console.error);
