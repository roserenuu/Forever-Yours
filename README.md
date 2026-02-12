# Jesus Forever Yours — AI Brand Agent

AI-powered brand agent for [Jesus Forever Yours](https://jesusforeveryours.com) by [Rose Renuu](https://instagram.com/roserenuu).

Built with TypeScript, powered by Claude — inspired by [clawdbot/OpenClaw](https://github.com/clawdbot/clawdbot).

> *"You are seen. You are loved. You are His."*

## What It Does

A multi-channel AI agent that knows the Forever Yours brand voice inside and out:

**Content Creation**
- `/lovenote` — Generate Love Notes (devotional messages from God's heart)
- `/caption` — Instagram captions with hashtags for @jesusforeveryours
- `/reel` — Scripts for Instagram Reels and TikTok
- `/devotional` — Full devotional entries for the Forever Yours collection

**Community Engagement**
- `/reply` — Draft warm, Spirit-led replies to DMs
- `/comment` — Respond to Instagram comments on-brand
- `/faq` — Answer common questions about the ministry

**Brand Strategy**
- `/campaign` — Plan content campaigns and series
- `/ideas` — Brainstorm content ideas
- `/bio` — Generate bios, taglines, and website copy

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/roserenuu/Forever-Yours.git
cd Forever-Yours
npm install

# 2. Run the setup wizard
npm run onboard

# 3. Start chatting (pick one)
npm run dev        # CLI mode — chat in your terminal
npm run gateway    # Gateway mode — Discord + WebChat
```

## Setup

### Requirements
- Node.js >= 20
- An [Anthropic API key](https://console.anthropic.com/)

### Environment Variables

Copy `.env.example` to `.env` and fill in your values, or run `npm run onboard`:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `DISCORD_BOT_TOKEN` | No | Discord bot token for Discord channel |
| `DISCORD_GUILD_ID` | No | Your Discord server ID |
| `WEBCHAT_PORT` | No | WebChat port (default: 3000) |

## Architecture

```
src/
├── config/
│   └── brand.ts          # Brand voice, audience, scripture config
├── core/
│   └── agent.ts          # Main AI agent with Claude API
├── skills/
│   ├── types.ts          # Skill interface
│   ├── content.ts        # Love Notes, captions, reels, devotionals
│   ├── engagement.ts     # DM replies, comments, FAQs
│   ├── strategy.ts       # Campaigns, ideas, bios
│   └── index.ts          # Skill registry
├── channels/
│   ├── types.ts          # Channel interface
│   ├── discord.ts        # Discord bot adapter
│   ├── webchat.ts        # WebChat with embedded UI
│   └── index.ts          # Channel exports
├── cli/
│   └── onboard.ts        # Setup wizard
├── index.ts              # CLI entry point
└── gateway.ts            # Multi-channel gateway
```

Inspired by clawdbot's gateway architecture:
- **Agent Core** — Claude-powered brain with full brand context
- **Skills** — Modular capabilities (content, engagement, strategy)
- **Channels** — Platform adapters (Discord, WebChat, more coming)
- **Gateway** — Connects everything together

## Running Modes

### CLI Mode (`npm run dev`)
Chat with your brand agent directly in the terminal. Great for content creation sessions.

### Gateway Mode (`npm run gateway`)
Runs the full multi-channel gateway:
- **WebChat** — Beautiful embedded chat UI at `http://localhost:3000`
- **Discord** — Bot responds to DMs and @mentions

## Adding More Channels

Create a new file in `src/channels/` implementing the `Channel` interface:

```typescript
import { Channel, OutgoingMessage } from "./types.js";
import { ForeverYoursAgent } from "../core/agent.js";

export class MyChannel implements Channel {
  name = "my-channel";
  platform = "my-platform";

  async connect(agent: ForeverYoursAgent): Promise<void> {
    // Set up your channel and handle incoming messages
  }

  async disconnect(): Promise<void> {
    // Clean up
  }

  async send(message: OutgoingMessage): Promise<void> {
    // Send a message through your channel
  }
}
```

Then register it in `src/gateway.ts`.

## License

MIT — Built with love for the Kingdom.
