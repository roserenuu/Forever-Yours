import { Client, Events, GatewayIntentBits, Message } from "discord.js";
import { Channel, OutgoingMessage } from "./types.js";
import { ForeverYoursAgent } from "../core/agent.js";

export class DiscordChannel implements Channel {
  name = "discord";
  platform = "discord";
  private client: Client;
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
    });
  }

  async connect(agent: ForeverYoursAgent): Promise<void> {
    this.agent = agent;

    this.client.once(Events.ClientReady, (c) => {
      console.log(
        `[Discord] Connected as ${c.user.tag} — Jesus Forever Yours agent is live`
      );
    });

    this.client.on(Events.MessageCreate, async (message: Message) => {
      if (message.author.bot) return;

      // Respond to DMs or when mentioned
      const isMentioned = message.mentions.has(this.client.user!);
      const isDM = !message.guild;

      if (!isDM && !isMentioned) return;

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

        // Discord has a 2000 char limit
        if (response.length <= 2000) {
          await message.reply(response);
        } else {
          const chunks = this.splitMessage(response);
          for (const chunk of chunks) {
            if ("send" in channel) {
              await channel.send(chunk);
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
