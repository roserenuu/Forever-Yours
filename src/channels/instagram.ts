import express from "express";
import { Channel, OutgoingMessage } from "./types.js";
import { ForeverYoursAgent } from "../core/agent.js";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

export class InstagramChannel implements Channel {
  name = "instagram";
  platform = "instagram";
  private agent: ForeverYoursAgent | null = null;
  private app: express.Express;
  private server: ReturnType<express.Express["listen"]> | null = null;
  private accessToken: string;
  private verifyToken: string;
  private port: number;
  private allowedUserIds: Set<string> | null;
  private webhookUrl: string | null;
  private appId: string | null;
  private appSecret: string | null;
  private pageId: string | null;

  constructor(config: {
    accessToken: string;
    verifyToken: string;
    port?: number;
    allowedUserIds?: string[];
    webhookUrl?: string;
    appId?: string;
    appSecret?: string;
    pageId?: string;
  }) {
    this.accessToken = config.accessToken;
    this.verifyToken = config.verifyToken;
    this.port = config.port || 8585;
    this.allowedUserIds = config.allowedUserIds ? new Set(config.allowedUserIds) : null;
    this.webhookUrl = config.webhookUrl || null;
    this.appId = config.appId || null;
    this.appSecret = config.appSecret || null;
    this.pageId = config.pageId || null;
    this.app = express();
    this.app.use(express.json());
  }

  async connect(agent: ForeverYoursAgent): Promise<void> {
    this.agent = agent;
    this.setupWebhook();

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, async () => {
        console.log(
          `  [Instagram] Webhook listening on port ${this.port} — DMs are live`
        );

        // Auto-register webhook URL with Meta if configured
        if (this.webhookUrl && this.appId && this.appSecret) {
          await this.registerWebhook();
        } else {
          console.log(
            `  [Instagram] Set INSTAGRAM_WEBHOOK_URL, FACEBOOK_APP_ID, and FACEBOOK_APP_SECRET in .env to auto-register webhook`
          );
        }

        resolve();
      });
    });
  }

  private async registerWebhook(): Promise<void> {
    const callbackUrl = `${this.webhookUrl}/webhook`;
    const appAccessToken = `${this.appId}|${this.appSecret}`;
    const url = `${GRAPH_API_BASE}/${this.appId}/subscriptions`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          object: "instagram",
          callback_url: callbackUrl,
          verify_token: this.verifyToken,
          fields: "messages",
          access_token: appAccessToken,
        }),
      });

      if (response.ok) {
        console.log(
          `  [Instagram] Webhook registered: ${callbackUrl}`
        );
      } else {
        const errorData = await response.text();
        console.error(
          `  [Instagram] Webhook registration failed: ${errorData}`
        );
        console.log(
          `  [Instagram] You may need to update the webhook URL manually at https://developers.facebook.com`
        );
      }

      // Verify current subscriptions
      const checkUrl = `${GRAPH_API_BASE}/${this.appId}/subscriptions?access_token=${appAccessToken}`;
      const checkRes = await fetch(checkUrl);
      const checkData = await checkRes.json();
      console.log(
        `  [Instagram] Current subscriptions:`,
        JSON.stringify(checkData, null, 2)
      );

      // Subscribe the Facebook Page to receive webhook events
      try {
        if (this.pageId) {
          // Use the configured Page ID directly
          console.log(`  [Instagram] Subscribing Page ${this.pageId} directly...`);
          const subRes = await fetch(
            `${GRAPH_API_BASE}/${this.pageId}/subscribed_apps`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscribed_fields: "messages",
                access_token: this.accessToken,
              }),
            }
          );
          const subData = await subRes.json();
          if (subRes.ok) {
            console.log(`  [Instagram] Page ${this.pageId} subscribed to webhook events!`);
          } else {
            console.error(`  [Instagram] Page subscription failed:`, JSON.stringify(subData));
          }
        } else {
          // Fallback: try to find pages via /me/accounts
          const pagesRes = await fetch(
            `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${this.accessToken}`
          );
          const pagesData = await pagesRes.json() as any;
          console.log(`  [Instagram] Pages found:`, JSON.stringify(pagesData, null, 2));

          const pages = pagesData.data || [];
          if (pages.length === 0) {
            console.error(`  [Instagram] No Facebook Pages found. Set FACEBOOK_PAGE_ID in .env with your Page ID.`);
          }

          for (const page of pages) {
            const pageToken = page.access_token || this.accessToken;
            const subRes = await fetch(
              `${GRAPH_API_BASE}/${page.id}/subscribed_apps`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscribed_fields: "messages",
                  access_token: pageToken,
                }),
              }
            );
            const subData = await subRes.json();
            if (subRes.ok) {
              console.log(`  [Instagram] Page "${page.name}" (${page.id}) subscribed to webhook events`);
            } else {
              console.error(`  [Instagram] Page "${page.name}" subscription failed:`, JSON.stringify(subData));
            }
          }
        }
      } catch (subError) {
        console.error("  [Instagram] Page subscription error:", subError);
      }
    } catch (error) {
      console.error("  [Instagram] Webhook registration error:", error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.server) {
      this.server.close();
      console.log("  [Instagram] Disconnected");
    }
  }

  async send(message: OutgoingMessage): Promise<void> {
    await this.sendInstagramMessage(message.channelId, message.content);
  }

  private setupWebhook(): void {
    // Webhook verification (Meta sends a GET to verify your endpoint)
    this.app.get("/webhook", (req, res) => {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === this.verifyToken) {
        console.log("  [Instagram] Webhook verified");
        res.status(200).send(challenge);
      } else {
        console.warn("  [Instagram] Webhook verification failed");
        res.sendStatus(403);
      }
    });

    // Log ALL incoming requests for debugging
    this.app.use((req, _res, next) => {
      console.log(`  [Instagram] ${req.method} ${req.url}`);
      next();
    });

    // Incoming messages from Instagram DMs
    this.app.post("/webhook", async (req, res) => {
      // Always respond 200 quickly to acknowledge receipt
      res.sendStatus(200);

      const body = req.body;
      console.log("  [Instagram] Webhook payload:", JSON.stringify(body, null, 2));

      if (body.object !== "instagram") {
        console.log(`  [Instagram] Ignored — object is "${body.object}", not "instagram"`);
        return;
      }

      for (const entry of body.entry || []) {
        for (const event of entry.messaging || []) {
          await this.handleMessage(event);
        }
      }
    });
  }

  private async handleMessage(event: any): Promise<void> {
    // Skip echo messages (messages sent by the page itself)
    if (event.message?.is_echo) return;

    const senderId = event.sender?.id;
    const messageText = event.message?.text;

    if (!senderId || !messageText) return;

    // Only respond to allowed users (if configured)
    if (this.allowedUserIds && !this.allowedUserIds.has(senderId)) {
      console.log(`  [Instagram] Ignoring DM from unauthorized user ${senderId}`);
      return;
    }

    console.log(`  [Instagram] DM from ${senderId}: ${messageText.slice(0, 50)}...`);

    try {
      const response = await this.agent!.chat(messageText);

      // Instagram DMs have a 1000 character limit per message
      if (response.length <= 1000) {
        await this.sendInstagramMessage(senderId, response);
      } else {
        const chunks = this.splitMessage(response, 1000);
        for (const chunk of chunks) {
          await this.sendInstagramMessage(senderId, chunk);
        }
      }
    } catch (error) {
      console.error("  [Instagram] Error processing DM:", error);
      await this.sendInstagramMessage(
        senderId,
        "I'm having a moment — please try again. God's still on the throne though. 🕊️"
      );
    }
  }

  private async sendInstagramMessage(
    recipientId: string,
    text: string
  ): Promise<void> {
    const url = `${GRAPH_API_BASE}/me/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        access_token: this.accessToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("  [Instagram] Send failed:", errorData);
    }
  }

  private splitMessage(text: string, maxLength = 1000): string[] {
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }
      let splitIndex = remaining.lastIndexOf("\n", maxLength);
      if (splitIndex === -1) splitIndex = remaining.lastIndexOf(" ", maxLength);
      if (splitIndex === -1) splitIndex = maxLength;
      chunks.push(remaining.slice(0, splitIndex));
      remaining = remaining.slice(splitIndex).trimStart();
    }
    return chunks;
  }
}
