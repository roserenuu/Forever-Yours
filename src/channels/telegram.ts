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
  private running = false;

  constructor(token: string, ownerChatId?: string) {
    this.bot = new Telegraf(token);
    this.ownerChatId = ownerChatId || null;
  }

  async connect(agent: ForeverYoursAgent): Promise<void> {
    this.agent = agent;

    // Handle /start command
    this.bot.start(async (ctx) => {
      console.log(`  [Telegram] /start from chat ID: ${ctx.chat.id}`);
      if (!this.isOwner(ctx)) {
        console.log(`  [Telegram] Blocked — not the owner (expected ${this.ownerChatId})`);
        return;
      }
      await ctx.reply(
        "Hey love! Eden here — your Forever Yours AI brand agent. " +
          "Send me anything and I'll help you create, strategize, and grow. " +
          "Use /help to see what I can do. \u{1F54A}\uFE0F"
      );
    });

    // Handle /help command
    this.bot.help(async (ctx) => {
      console.log(`  [Telegram] /help from chat ID: ${ctx.chat.id}`);
      if (!this.isOwner(ctx)) {
        console.log(`  [Telegram] Blocked — not the owner (expected ${this.ownerChatId})`);
        return;
      }
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
      console.log(`  [Telegram] Message from chat ${ctx.chat.id}: "${ctx.message.text.slice(0, 80)}"`);

      // Log chat ID to help with owner setup
      if (!this.ownerChatId) {
        console.log(
          `  [Telegram] No TELEGRAM_OWNER_CHAT_ID set — add TELEGRAM_OWNER_CHAT_ID=${ctx.chat.id} to .env to restrict access`
        );
      }

      if (!this.isOwner(ctx)) {
        console.log(`  [Telegram] Blocked — not the owner (expected ${this.ownerChatId}, got ${ctx.chat.id})`);
        return;
      }

      const content = ctx.message.text.trim();
      if (!content) return;

      try {
        // Send typing indicator (ignore rate-limit errors)
        await ctx.sendChatAction("typing").catch(() => {});

        // Keep typing indicator alive for long responses (every 5s to avoid rate limits)
        const typingInterval = setInterval(async () => {
          try {
            await ctx.sendChatAction("typing");
          } catch {
            // ignore — typing indicator is cosmetic
          }
        }, 5000);

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
              await this.rateLimitRetry(() =>
                ctx.replyWithPhoto(
                  { source: fs.createReadStream(filePath), filename },
                  { caption: filename }
                )
              );
            } catch (err) {
              console.error(
                `[Telegram] Could not send file ${filePath}:`,
                err
              );
            }
          }
        }

        // Clean markdown formatting for Telegram — no hashtags, dashes, or asterisks
        const cleanText = this.cleanForTelegram(response.text);

        // Telegram has a 4096 char limit per message
        if (cleanText.length <= 4096) {
          await this.rateLimitRetry(() => ctx.reply(cleanText));
        } else {
          const chunks = this.splitMessage(cleanText);
          for (const chunk of chunks) {
            await this.rateLimitRetry(() => ctx.reply(chunk));
          }
        }
      } catch (error: any) {
        console.error("[Telegram] Error processing message:", error);
        try {
          await this.rateLimitRetry(() =>
            ctx.reply(
              "I'm having a moment \u2014 please try again. God's still on the throne though. \u{1F54A}\uFE0F"
            )
          );
        } catch {
          // last resort — can't even send the error message
        }
      }
    });

    // Validate the token by calling getMe before anything else
    try {
      const me = await this.bot.telegram.getMe();
      console.log(`  [Telegram] Token valid — bot is @${me.username}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        throw new Error(
          `[Telegram] Bot token is INVALID or REVOKED. ` +
            `Go to @BotFather on Telegram > /mybots > pick your bot > API Token > Revoke and get a new one. ` +
            `Then update TELEGRAM_BOT_TOKEN in .env.`
        );
      }
      if (msg.includes("ENOTFOUND") || msg.includes("EAI_AGAIN") || msg.includes("ETIMEDOUT")) {
        throw new Error(
          `[Telegram] Can't reach api.telegram.org — check your internet connection.`
        );
      }
      throw new Error(`[Telegram] Token check failed: ${msg}`);
    }

    // Clear any stale webhook before launching in polling mode
    // (a leftover webhook will silently swallow all messages)
    await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
    console.log(`  [Telegram] Webhook cleared — using polling mode`);

    // Catch unhandled errors so the bot doesn't crash silently
    this.bot.catch((err: unknown) => {
      console.error("[Telegram] Unhandled bot error:", err);
    });

    // Launch the bot
    await this.bot.launch();
    this.running = true;
    console.log(
      `  [Telegram] Connected \u2014 Eden, Selah, Mara, Zion & Navi are live`
    );
  }

  async disconnect(): Promise<void> {
    if (this.running) {
      this.bot.stop("Gateway shutdown");
      this.running = false;
    }
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

  /**
   * Strip markdown formatting for clean Telegram messages.
   * No hashtags, no asterisks, no dashes, no markdown headings.
   */
  private cleanForTelegram(text: string): string {
    return text
      .replace(/#{1,6}\s+/g, "")              // ## Headings → plain text
      .replace(/\*\*([^*]+)\*\*/g, "$1")      // **bold** → plain
      .replace(/\*([^*]+)\*/g, "$1")          // *italic* → plain
      .replace(/^[-•]\s+/gm, "")             // - list items → plain (remove dash)
      .replace(/`{3}[\s\S]*?`{3}/g, "")      // ```code blocks``` → remove
      .replace(/`([^`]+)`/g, "$1")            // `inline code` → plain
      .replace(/---+/g, "")                   // --- horizontal rules → remove
      .replace(/#\w[\w/]*/g, "")              // #hashtags → remove
      .replace(/\n{3,}/g, "\n\n")            // collapse excessive blank lines
      .trim();
  }

  /**
   * Retry a Telegram API call if it hits a 429 rate limit.
   * Waits the retry_after duration then tries again (up to 3 attempts).
   */
  private async rateLimitRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        const retryAfter = err?.response?.parameters?.retry_after;
        if (retryAfter && i < attempts - 1) {
          console.log(`  [Telegram] Rate limited — waiting ${retryAfter}s before retry`);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
        } else {
          throw err;
        }
      }
    }
    throw new Error("rateLimitRetry: exhausted attempts");
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
