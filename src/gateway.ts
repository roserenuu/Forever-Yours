process.removeAllListeners("warning");
process.on("warning", (w) => {
  if (w.name !== "DeprecationWarning" || !w.message.includes("punycode")) {
    console.warn(w);
  }
});
import "dotenv/config";
import { ForeverYoursAgent } from "./core/agent.js";
import { allSkills } from "./skills/index.js";
import { TelegramChannel } from "./channels/telegram.js";
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

  // Discord (if token provided) — loaded dynamically to avoid Node v24 ESM crash
  if (process.env.DISCORD_BOT_TOKEN) {
    try {
      const { DiscordChannel } = await import("./channels/discord.js");
      const discord = new DiscordChannel(process.env.DISCORD_BOT_TOKEN);
      channels.push(discord);
    } catch (err) {
      console.error("  [Discord] Failed to load discord.js:", (err as Error).message);
      console.log("  [Discord] Skipped — discord.js is not compatible with your Node version. Telegram still works.");
    }
  } else {
    console.log(
      "  [Discord] Skipped — set DISCORD_BOT_TOKEN in .env to enable"
    );
  }

  // Telegram (if token provided)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  console.log(`  [Telegram] Token in .env: ${tgToken ? tgToken.slice(0, 6) + "..." + tgToken.slice(-4) : "MISSING"}`);
  if (tgToken) {
    const telegram = new TelegramChannel(
      tgToken,
      process.env.TELEGRAM_OWNER_CHAT_ID
    );
    channels.push(telegram);
  } else {
    console.log(
      "  [Telegram] Skipped — set TELEGRAM_BOT_TOKEN in .env to enable"
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
