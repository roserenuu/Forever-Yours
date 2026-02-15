import * as fs from "fs";
import * as path from "path";

export interface PlatformSnapshot {
  platform: string;
  followers: number;
  followersChange?: number;
  reach?: number;
  impressions?: number;
  engagement?: number;
  topContent?: string;
  notes?: string;
  updatedAt: string;
}

export interface ContentPerformance {
  platform: string;
  contentType: string;
  topic: string;
  reach: number;
  likes?: number;
  comments?: number;
  saves?: number;
  shares?: number;
  views?: number;
  watchTime?: string;
  postedAt?: string;
  transcript?: string;
  notes?: string;
}

export interface TeamDirectives {
  fullReport: string;
  eden: string;
  mara: string;
  zion: string;
  adara: string;
  lyra: string;
  kaia: string;
  nova: string;
  iris: string;
  updatedAt: string;
}

export interface BrandData {
  platforms: Record<string, PlatformSnapshot>;
  recentContent: ContentPerformance[];
  goals: string[];
  teamDirectives?: TeamDirectives;
  lastSyncedAt: string;
}

const DATA_FILE = path.join(process.cwd(), ".forever-yours-data.json");

const DEFAULT_DATA: BrandData = {
  platforms: {
    ig_roserenuu: {
      platform: "ig_roserenuu",
      followers: 0,
      updatedAt: new Date().toISOString(),
      notes: "@roserenuu — Rose Renuu's personal creator account",
    },
    ig_jesusforeveryours: {
      platform: "ig_jesusforeveryours",
      followers: 144000,
      updatedAt: new Date().toISOString(),
      notes: "@jesusforeveryours — Jesus Forever Yours brand account",
    },
    tiktok: {
      platform: "tiktok",
      followers: 56000,
      updatedAt: new Date().toISOString(),
    },
    youtube: {
      platform: "youtube",
      followers: 8500,
      updatedAt: new Date().toISOString(),
    },
    x: { platform: "x", followers: 0, updatedAt: new Date().toISOString() },
    threads: {
      platform: "threads",
      followers: 0,
      updatedAt: new Date().toISOString(),
    },
    facebook: {
      platform: "facebook",
      followers: 0,
      updatedAt: new Date().toISOString(),
    },
  },
  recentContent: [],
  goals: ["Reach 1 million followers", "Grow YouTube to 100K subscribers"],
  lastSyncedAt: new Date().toISOString(),
};

export class DataStore {
  private data: BrandData;

  constructor() {
    this.data = this.load();
  }

  private load(): BrandData {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(raw) as BrandData;
      }
    } catch {
      // If corrupted, start fresh
    }
    this.save(DEFAULT_DATA);
    return { ...DEFAULT_DATA };
  }

  private save(data?: BrandData): void {
    const toSave = data ?? this.data;
    toSave.lastSyncedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(toSave, null, 2), "utf-8");
  }

  // --- Platform Stats ---

  updatePlatform(
    platform: string,
    stats: Partial<PlatformSnapshot>
  ): PlatformSnapshot {
    const key = platform.toLowerCase();
    const existing = this.data.platforms[key] || {
      platform: key,
      followers: 0,
      updatedAt: new Date().toISOString(),
    };

    // Calculate follower change if we have a previous count
    if (stats.followers && existing.followers) {
      stats.followersChange = stats.followers - existing.followers;
    }

    const updated: PlatformSnapshot = {
      ...existing,
      ...stats,
      platform: key,
      updatedAt: new Date().toISOString(),
    };

    this.data.platforms[key] = updated;
    this.save();
    return updated;
  }

  getPlatform(platform: string): PlatformSnapshot | undefined {
    return this.data.platforms[platform.toLowerCase()];
  }

  getAllPlatforms(): PlatformSnapshot[] {
    return Object.values(this.data.platforms);
  }

  // --- Content Performance ---

  addContent(content: ContentPerformance): void {
    this.data.recentContent.unshift(content);
    // Keep last 100 entries
    if (this.data.recentContent.length > 100) {
      this.data.recentContent = this.data.recentContent.slice(0, 100);
    }
    this.save();
  }

  getRecentContent(limit = 20): ContentPerformance[] {
    return this.data.recentContent.slice(0, limit);
  }

  getContentByPlatform(platform: string, limit = 10): ContentPerformance[] {
    return this.data.recentContent
      .filter((c) => c.platform.toLowerCase() === platform.toLowerCase())
      .slice(0, limit);
  }

  /**
   * Get a transcript-focused brief for agents that need to analyze
   * what Rose is saying in her videos and how it correlates with performance.
   * Sorted by views (best-performing first) so agents see what works.
   */
  getTranscriptBrief(): string {
    const withTranscripts = this.data.recentContent
      .filter((c) => c.platform === "youtube" && c.transcript)
      .sort((a, b) => (b.views || 0) - (a.views || 0));

    if (withTranscripts.length === 0) {
      return "";
    }

    let brief = "### YouTube Video Transcripts (sorted by views, best first)\n\n";
    for (const c of withTranscripts) {
      brief += `**[${c.contentType.toUpperCase()}] "${c.topic}"** — ${(c.views || 0).toLocaleString()} views | ${(c.likes || 0).toLocaleString()} likes | ${(c.comments || 0).toLocaleString()} comments`;
      if (c.postedAt) brief += ` | Posted: ${c.postedAt.split("T")[0]}`;
      brief += `\nTranscript: ${c.transcript}\n\n`;
    }
    return brief;
  }

  // --- Goals ---

  setGoals(goals: string[]): void {
    this.data.goals = goals;
    this.save();
  }

  getGoals(): string[] {
    return this.data.goals;
  }

  // --- Summary for Agents ---

  getSummaryForAgents(): string {
    const platforms = this.getAllPlatforms();
    const recent = this.getRecentContent(10);
    const goals = this.getGoals();

    let summary = "## LIVE BRAND DATA (from Rose's dashboard)\n\n";

    summary += "### Platform Stats\n";
    for (const p of platforms) {
      if (p.followers === 0 && !p.reach) continue;
      const change =
        p.followersChange !== undefined && p.followersChange !== 0
          ? ` (${p.followersChange > 0 ? "+" : ""}${p.followersChange})`
          : "";
      const displayName = this.getDisplayName(p.platform);
      summary += `- **${displayName}**: ${p.followers.toLocaleString()} followers${change}`;
      if (p.reach) summary += ` | Reach: ${p.reach.toLocaleString()}`;
      if (p.engagement) summary += ` | Engagement: ${p.engagement}%`;
      if (p.notes) summary += ` | ${p.notes}`;
      summary += ` (updated ${p.updatedAt.split("T")[0]})\n`;
    }

    if (recent.length > 0) {
      summary += "\n### Recent Content Performance\n";
      for (const c of recent) {
        summary += `- [${c.platform}/${c.contentType}] "${c.topic}" — Reach: ${c.reach.toLocaleString()}`;
        if (c.likes) summary += ` | Likes: ${c.likes.toLocaleString()}`;
        if (c.saves) summary += ` | Saves: ${c.saves.toLocaleString()}`;
        if (c.shares) summary += ` | Shares: ${c.shares.toLocaleString()}`;
        if (c.views) summary += ` | Views: ${c.views.toLocaleString()}`;
        if (c.comments)
          summary += ` | Comments: ${c.comments.toLocaleString()}`;
        if (c.transcript)
          summary += `\n  Transcript: ${c.transcript.slice(0, 300)}${c.transcript.length > 300 ? "..." : ""}`;
        summary += "\n";
      }
    }

    if (goals.length > 0) {
      summary += "\n### Goals\n";
      for (const g of goals) {
        summary += `- ${g}\n`;
      }
    }

    summary += `\nLast synced: ${this.data.lastSyncedAt.split("T")[0]}`;
    return summary;
  }

  // --- Navi's Team Directives ---

  saveTeamDirectives(directives: TeamDirectives): void {
    this.data.teamDirectives = directives;
    this.save();
  }

  getTeamDirectives(): TeamDirectives | undefined {
    return this.data.teamDirectives;
  }

  /**
   * Get Navi's latest directive for a specific agent.
   * Returns a formatted string that can be injected into any agent's context.
   */
  getDirectiveForAgent(agentName: string): string {
    const directives = this.data.teamDirectives;
    if (!directives) return "";

    const key = agentName.toLowerCase() as keyof Omit<TeamDirectives, "fullReport" | "updatedAt">;
    const directive = directives[key];
    if (!directive) return "";

    return `\n## Navi's Latest Directive for You (${directives.updatedAt.split("T")[0]})\nNavi analyzed Rose's data and gave you these specific instructions. FOLLOW THEM:\n${directive}\n`;
  }

  /**
   * Get a summary of Navi's latest insights for the whole team.
   * Shorter than the full report — just the key takeaways.
   */
  getNaviSummaryForTeam(): string {
    const directives = this.data.teamDirectives;
    if (!directives) return "";

    return `\n## Navi's Latest Insights (${directives.updatedAt.split("T")[0]})\n${directives.fullReport.slice(0, 1500)}${directives.fullReport.length > 1500 ? "\n..." : ""}\n`;
  }

  // --- Bulk sync (for /sync command) ---

  parseAndSync(input: string): string {
    const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
    const results: string[] = [];

    for (const line of lines) {
      // Try to match platform stats: "roserenuu 50000" or "jfy: 145K reach 50000"
      const platformMatch = line.match(
        /^(roserenuu|rose|jfy|jesusforeveryours|instagram|ig|tiktok|tt|youtube|yt|x|twitter|threads|facebook|fb)[:\s]+(.+)/i
      );

      if (platformMatch) {
        const [, rawPlatform, rest] = platformMatch;
        const platform = this.normalizePlatform(rawPlatform);
        const stats: Partial<PlatformSnapshot> = {};

        // Parse followers
        const followersMatch = rest.match(
          /(\d[\d,.]*)\s*[kK]?\s*(followers|subs|subscribers)?/
        );
        if (followersMatch) {
          stats.followers = this.parseNumber(followersMatch[1]);
        }

        // Parse reach
        const reachMatch = rest.match(/reach[:\s]*(\d[\d,.]*)\s*[kK]?/i);
        if (reachMatch) {
          stats.reach = this.parseNumber(reachMatch[1]);
        }

        // Parse engagement
        const engMatch = rest.match(/engagement[:\s]*(\d[\d.]*)\s*%?/i);
        if (engMatch) {
          stats.engagement = parseFloat(engMatch[1]);
        }

        this.updatePlatform(platform, stats);
        results.push(
          `Updated **${platform}**: ${JSON.stringify(stats)}`
        );
        continue;
      }

      // Try to match content performance: "reel identity in Christ 50000 reach 2000 saves"
      const contentMatch = line.match(
        /^(reel|carousel|post|story|short|video|live|thread|tweet)[:\s]+(.+)/i
      );

      if (contentMatch) {
        const [, contentType, rest] = contentMatch;
        const content: ContentPerformance = {
          platform: "instagram", // default, can be overridden
          contentType: contentType.toLowerCase(),
          topic: "",
          reach: 0,
        };

        // Check for platform/account prefix
        const platInContent = rest.match(
          /\b(roserenuu|rose|jfy|jesusforeveryours|ig|instagram|tt|tiktok|yt|youtube|x|twitter|threads|fb|facebook)\b/i
        );
        if (platInContent) {
          content.platform = this.normalizePlatform(platInContent[1]);
        }

        // Extract numbers
        const reachMatch = rest.match(/(\d[\d,.]*)\s*[kK]?\s*reach/i);
        if (reachMatch) content.reach = this.parseNumber(reachMatch[1]);

        const viewsMatch = rest.match(/(\d[\d,.]*)\s*[kK]?\s*views/i);
        if (viewsMatch) content.views = this.parseNumber(viewsMatch[1]);

        const likesMatch = rest.match(/(\d[\d,.]*)\s*[kK]?\s*likes/i);
        if (likesMatch) content.likes = this.parseNumber(likesMatch[1]);

        const savesMatch = rest.match(/(\d[\d,.]*)\s*[kK]?\s*saves/i);
        if (savesMatch) content.saves = this.parseNumber(savesMatch[1]);

        const sharesMatch = rest.match(/(\d[\d,.]*)\s*[kK]?\s*shares/i);
        if (sharesMatch) content.shares = this.parseNumber(sharesMatch[1]);

        const commentsMatch = rest.match(
          /(\d[\d,.]*)\s*[kK]?\s*comments/i
        );
        if (commentsMatch)
          content.comments = this.parseNumber(commentsMatch[1]);

        // The topic is everything that's not a number or metric keyword
        content.topic = rest
          .replace(
            /\d[\d,.]*\s*[kK]?\s*(reach|views|likes|saves|shares|comments|engagement|followers|subs)/gi,
            ""
          )
          .replace(
            /\b(roserenuu|rose|jfy|jesusforeveryours|ig|instagram|tt|tiktok|yt|youtube|x|twitter|threads|fb|facebook)\b/gi,
            ""
          )
          .replace(/\s+/g, " ")
          .trim() || "untitled";

        this.addContent(content);
        results.push(
          `Logged **${content.contentType}** on ${content.platform}: "${content.topic}"`
        );
        continue;
      }

      results.push(`Could not parse: "${line}" — try format like "instagram 145000 followers" or "reel identity 50000 reach"`);
    }

    return results.join("\n");
  }

  private normalizePlatform(raw: string): string {
    const map: Record<string, string> = {
      // Two Instagram accounts
      roserenuu: "ig_roserenuu",
      rose: "ig_roserenuu",
      jfy: "ig_jesusforeveryours",
      jesusforeveryours: "ig_jesusforeveryours",
      // "instagram" or "ig" defaults to the brand account
      ig: "ig_jesusforeveryours",
      instagram: "ig_jesusforeveryours",
      // Other platforms
      tt: "tiktok",
      tiktok: "tiktok",
      yt: "youtube",
      youtube: "youtube",
      x: "x",
      twitter: "x",
      threads: "threads",
      fb: "facebook",
      facebook: "facebook",
    };
    return map[raw.toLowerCase()] || raw.toLowerCase();
  }

  private getDisplayName(platform: string): string {
    const names: Record<string, string> = {
      ig_roserenuu: "IG @roserenuu (Rose)",
      ig_jesusforeveryours: "IG @jesusforeveryours (JFY)",
      tiktok: "TIKTOK",
      youtube: "YOUTUBE",
      x: "X (TWITTER)",
      threads: "THREADS",
      facebook: "FACEBOOK",
    };
    return names[platform] || platform.toUpperCase();
  }

  private parseNumber(raw: string): number {
    const cleaned = raw.replace(/,/g, "");
    const num = parseFloat(cleaned);
    // Handle "145K" style
    if (raw.toLowerCase().endsWith("k")) return num * 1000;
    if (raw.toLowerCase().endsWith("m")) return num * 1_000_000;
    return Math.round(num);
  }
}
