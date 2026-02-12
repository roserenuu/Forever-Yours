import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function onboard() {
  console.log("\n");
  console.log("  ┌──────────────────────────────────────────┐");
  console.log("  │    JESUS FOREVER YOURS — Setup Wizard     │");
  console.log("  │                                           │");
  console.log("  │    Let's get your AI brand agent ready    │");
  console.log("  └──────────────────────────────────────────┘");
  console.log("");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const envPath = path.resolve(process.cwd(), ".env");
  const envLines: string[] = [];

  console.log("  Step 1: Anthropic API Key");
  console.log("  Get yours at https://console.anthropic.com/\n");
  const apiKey = await ask(rl, "  Anthropic API Key: ");
  if (apiKey) {
    envLines.push(`ANTHROPIC_API_KEY=${apiKey}`);
  }

  console.log("\n  Step 2: Discord Bot (optional)");
  console.log("  Create a bot at https://discord.com/developers/applications\n");
  const discordToken = await ask(
    rl,
    "  Discord Bot Token (press Enter to skip): "
  );
  if (discordToken) {
    envLines.push(`DISCORD_BOT_TOKEN=${discordToken}`);
    const guildId = await ask(rl, "  Discord Server ID: ");
    if (guildId) envLines.push(`DISCORD_GUILD_ID=${guildId}`);
  }

  console.log("\n  Step 3: Instagram DMs (optional)");
  console.log("  Set up at https://developers.facebook.com\n");
  const igToken = await ask(
    rl,
    "  Instagram Page Access Token (press Enter to skip): "
  );
  if (igToken) {
    envLines.push(`INSTAGRAM_ACCESS_TOKEN=${igToken}`);
    const igVerify = await ask(
      rl,
      "  Webhook Verify Token (default: forever-yours-verify): "
    );
    envLines.push(
      `INSTAGRAM_VERIFY_TOKEN=${igVerify || "forever-yours-verify"}`
    );
    const igPort = await ask(rl, "  Instagram webhook port (default 8585): ");
    envLines.push(`INSTAGRAM_WEBHOOK_PORT=${igPort || "8585"}`);
  }

  console.log("\n  Step 4: Ports");
  const webPort = await ask(rl, "  WebChat port (default 3000): ");
  envLines.push(`WEBCHAT_PORT=${webPort || "3000"}`);

  // Add brand defaults
  envLines.push("");
  envLines.push("# Brand Configuration");
  envLines.push('BRAND_NAME="Jesus Forever Yours"');
  envLines.push('CREATOR_NAME="Rose Renuu"');
  envLines.push('WEBSITE_URL="https://jesusforeveryours.com"');
  envLines.push('INSTAGRAM_HANDLE="jesusforeveryours"');
  envLines.push('CREATOR_INSTAGRAM="roserenuu"');

  fs.writeFileSync(envPath, envLines.join("\n") + "\n");

  console.log(`\n  .env file created at ${envPath}`);
  console.log("\n  You're all set! Run your agent with:");
  console.log("    npm run dev     — CLI mode (chat in terminal)");
  console.log("    npm run gateway — Gateway mode (Discord + WebChat)");
  console.log("\n  Forever Yours. 🕊️\n");

  rl.close();
}

onboard().catch(console.error);
