import "dotenv/config";
import { ForeverYoursAgent } from "./core/agent.js";
import { allSkills } from "./skills/index.js";
import { DiscordChannel } from "./channels/discord.js";
import { InstagramChannel } from "./channels/instagram.js";
import { WebChatChannel } from "./channels/webchat.js";
import { Channel } from "./channels/types.js";

async function startGateway() {
  console.log("\n");
  console.log("  ╔══════════════════════════════════════════╗");
  console.log("  ║       JESUS FOREVER YOURS                ║");
  console.log("  ║       AI Brand Agent Gateway             ║");
  console.log("  ║                                          ║");
  console.log("  ║  You are seen. You are loved. You are His║");
  console.log("  ╚══════════════════════════════════════════╝");
  console.log("\n");

  // Initialize the agent
  const agent = new ForeverYoursAgent({
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929",
  });

  // Register all skills
  for (const skill of allSkills) {
    agent.registerSkill(skill);
    console.log(`  [Skill] Registered: /${skill.name} — ${skill.description}`);
  }
  console.log("");

  // Connect channels
  const channels: Channel[] = [];

  // WebChat (always enabled)
  const webChatPort = parseInt(process.env.WEBCHAT_PORT || "3000");
  const webChat = new WebChatChannel(webChatPort);
  channels.push(webChat);

  // Instagram DMs (if access token provided) — connect first so Discord errors don't block it
  if (process.env.INSTAGRAM_ACCESS_TOKEN) {
    const igPort = parseInt(process.env.INSTAGRAM_WEBHOOK_PORT || "8585");
    const instagram = new InstagramChannel({
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN || "forever-yours-verify",
      port: igPort,
    });
    channels.push(instagram);
  } else {
    console.log(
      "  [Instagram] Skipped — set INSTAGRAM_ACCESS_TOKEN in .env to enable"
    );
  }

  // Discord (if token provided)
  if (process.env.DISCORD_BOT_TOKEN) {
    const discord = new DiscordChannel(process.env.DISCORD_BOT_TOKEN);
    channels.push(discord);
  } else {
    console.log(
      "  [Discord] Skipped — set DISCORD_BOT_TOKEN in .env to enable"
    );
  }

  // Connect all channels
  for (const channel of channels) {
    try {
      await channel.connect(agent);
    } catch (error) {
      console.error(`  [${channel.name}] Failed to connect:`, error);
    }
  }

  console.log("\n  Gateway is running. Press Ctrl+C to stop.\n");

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n  Shutting down gracefully...");
    for (const channel of channels) {
      await channel.disconnect();
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startGateway().catch((error) => {
  console.error("Failed to start gateway:", error);
  process.exit(1);
});
