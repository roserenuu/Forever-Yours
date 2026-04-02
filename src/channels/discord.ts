import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Discord = require("discord.js");
const { Client, GatewayIntentBits, AttachmentBuilder, Partials } = Discord;

import * as fs from "fs";
import * as path from "path";
import { Channel, OutgoingMessage } from "./types.js";
import { ForeverYoursAgent } from "../core/agent.js";

export class DiscordChannel implements Channel {
  name = "discord";
  platform = "discord";
  private client: any;
  private agent: ForeverYoursAgent | null = null;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel],
    });
  }

  async connect(agent: ForeverYoursAgent): Promise<void> {
    this.agent = agent;

    this.client.once("ready", (c: any) => {
      console.log(
        `[Discord] Connected as ${c.user.tag} — Eden, Selah, Mara, Zion & Navi are live`
      );
    });

    this.client.on("messageCreate", async (message: any) => {
      if (message.author.bot) return;

      // Owner-only: only Rose can use this bot
      const OWNER_ID = process.env.DISCORD_OWNER_ID || "975628031869726740";
      if (message.author.id !== OWNER_ID) return;

      const isMentioned = message.mentions.has(this.client.user!);
      const isDM = !message.guild;

      // Check if message is in a dedicated bot channel (name contains "forever-yours", "content", or "rose")
      const isBotChannel =
        message.channel &&
        "name" in message.channel &&
        typeof message.channel.name === "string" &&
        /forever-yours|content-studio|rose-ai|love-notes|bot/i.test(
          message.channel.name
        );

      // Respond to: DMs, @mentions, or any message in a dedicated bot channel
      if (!isDM && !isMentioned && !isBotChannel) return;

      const content = message.content
        .replace(/<@!?\d+>/g, "")
        .trim();

      if (!content) return;

      try {
        const channel = message.channel;
        if ("sendTyping" in channel) {
          await channel.sendTyping();
        }
        const response = await this.agent!.chat(content);

        // Build attachments from any generated image files
        const attachments: any[] = [];
        if (response.files?.length) {
          for (const filePath of response.files) {
            try {
              if (!fs.existsSync(filePath)) {
                console.error(`[Discord] File not found: ${filePath}`);
                continue;
              }
              const buffer = fs.readFileSync(filePath);
              const filename = path.basename(filePath);
              attachments.push(new AttachmentBuilder(buffer, { name: filename }));
            } catch (err) {
              console.error(`[Discord] Could not attach file ${filePath}:`, err);
            }
          }
        }

        // Discord has a 2000 char limit
        if (response.text.length <= 2000) {
          await message.reply({
            content: response.text,
            files: attachments,
          });
        } else {
          const chunks = this.splitMessage(response.text);
          for (let i = 0; i < chunks.length; i++) {
            if ("send" in channel) {
              // Attach images to the last text chunk
              if (i === chunks.length - 1 && attachments.length > 0) {
                await channel.send({ content: chunks[i], files: attachments });
              } else {
                await channel.send(chunks[i]);
              }
            }
          }
        }
      } catch (error) {
        console.error("[Discord] Error processing message:", error);
        await message.reply(
          "I'm having a moment — please try again. God's still on the throne though. 🕊️"
        );
      }
    });

    await this.client.login(this.token);
  }

  async disconnect(): Promise<void> {
    await this.client.destroy();
    console.log("[Discord] Disconnected");
  }

  async send(message: OutgoingMessage): Promise<void> {
    const channel = await this.client.channels.fetch(message.channelId);
    if (channel?.isTextBased() && "send" in channel) {
      await (channel as any).send(message.content);
    }
  }

  private splitMessage(text: string, maxLength = 2000): string[] {
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
