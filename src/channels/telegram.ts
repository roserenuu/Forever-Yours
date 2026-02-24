import { Telegraf, Context } from "telegraf";
import * as fs from "fs";
import * as path from "path";
import { Channel, OutgoingMessage } from "./types.js";
import { ForeverYoursAgent } from "../core/agent.js";

export class TelegramChannel implements Channel {
  name = "telegram";
  platform = "telegram";
  private bot: Telegraf;
  private agent: ForeverYoursAgent | null = null;
  private ownerChatId: string | null;

  constructor(token: string, ownerChatId?: string) {
    this.bot = new Telegraf(token);
    this.ownerChatId = ownerChatId || null;
  }

  async connect(agent: ForeverYoursAgent): Promise<void> {
    this.agent = agent;

    // Handle /start command
    this.bot.start(async (ctx) => {
      if (!this.isOwner(ctx)) return;
      await ctx.reply(
        "Hey love! Eden here — your Forever Yours AI brand agent. " +
          "Send me anything and I'll help you create, strategize, and grow. " +
          "Use /help to see what I can do. \u{1F54A}\uFE0F"
      );
    });

    // Handle /help command
    this.bot.help(async (ctx) => {
      if (!this.isOwner(ctx)) return;
      await ctx.reply(
        "Here's what I can do for you:\n\n" +
          "/lovenote — Write a love note from Jesus\n" +
          "/caption — Create an Instagram caption\n" +
          "/reel — Script a Reel or TikTok\n" +
          "/devotional — Write a devotional\n" +
          "/ideas — Brainstorm content ideas\n" +
          "/campaign — Plan a content campaign\n" +
          "/reply — Draft a DM reply\n" +
          "/bio — Craft a bio\n\n" +
          "Or just chat with me about anything! I'm here for you. \u{1F49C}"
      );
    });

    // Handle all text messages
    this.bot.on("text", async (ctx) => {
      if (!this.isOwner(ctx)) return;

      const content = ctx.message.text.trim();
      if (!content) return;

      try {
        // Send typing indicator
        await ctx.sendChatAction("typing");

        // Keep typing indicator alive for long responses
        const typingInterval = setInterval(async () => {
          try {
            await ctx.sendChatAction("typing");
          } catch {
            // ignore — chat action can fail silently
          }
        }, 4000);

        const response = await this.agent!.chat(content);

        clearInterval(typingInterval);

        // Send any generated image files
        if (response.files?.length) {
          for (const filePath of response.files) {
            try {
              if (!fs.existsSync(filePath)) {
                console.error(`[Telegram] File not found: ${filePath}`);
                continue;
              }
              const filename = path.basename(filePath);
              await ctx.replyWithPhoto(
                { source: fs.createReadStream(filePath), filename },
                { caption: filename }
              );
            } catch (err) {
              console.error(
                `[Telegram] Could not send file ${filePath}:`,
                err
              );
            }
          }
        }

        // Telegram has a 4096 char limit per message
        if (response.text.length <= 4096) {
          await ctx.reply(response.text);
        } else {
          const chunks = this.splitMessage(response.text);
          for (const chunk of chunks) {
            await ctx.reply(chunk);
          }
        }
      } catch (error) {
        console.error("[Telegram] Error processing message:", error);
        await ctx.reply(
          "I'm having a moment \u2014 please try again. God's still on the throne though. \u{1F54A}\uFE0F"
        );
      }
    });

    // Launch the bot
    await this.bot.launch();
    console.log(
      `  [Telegram] Connected \u2014 Eden, Selah, Mara, Zion & Navi are live`
    );
  }

  async disconnect(): Promise<void> {
    this.bot.stop("Gateway shutdown");
    console.log("  [Telegram] Disconnected");
  }

  async send(message: OutgoingMessage): Promise<void> {
    await this.bot.telegram.sendMessage(message.channelId, message.content);
  }

  /**
   * Owner-only access check. If TELEGRAM_OWNER_CHAT_ID is set,
   * only that user can interact with the bot.
   */
  private isOwner(ctx: Context): boolean {
    if (!this.ownerChatId) return true;
    return String(ctx.chat?.id) === this.ownerChatId;
  }

  private splitMessage(text: string, maxLength = 4096): string[] {
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }
      let splitIndex = remaining.lastIndexOf("\n", maxLength);
      if (splitIndex === -1) splitIndex = maxLength;
      chunks.push(remaining.slice(0, splitIndex));
      remaining = remaining.slice(splitIndex).trimStart();
    }
    return chunks;
  }
}
