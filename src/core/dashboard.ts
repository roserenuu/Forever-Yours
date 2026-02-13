import { DataStore, PlatformSnapshot, ContentPerformance } from "./datastore.js";

export class Dashboard {
  private dataStore: DataStore;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
  }

  render(): string {
    const platforms = this.dataStore.getAllPlatforms();
    const content = this.dataStore.getRecentContent(15);
    const goals = this.dataStore.getGoals();

    let out = "";

    // Header
    out += "```\n";
    out += "╔══════════════════════════════════════════════════╗\n";
    out += "║          JESUS FOREVER YOURS — DASHBOARD        ║\n";
    out += "╚══════════════════════════════════════════════════╝\n";
    out += "```\n\n";

    // Platform Overview
    out += "### Platform Overview\n\n";
    out += "```\n";

    const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0);
    out += `  TOTAL FOLLOWERS: ${totalFollowers.toLocaleString()}    Goal: 1,000,000 (${((totalFollowers / 1_000_000) * 100).toFixed(1)}%)\n`;
    out += `  ${"█".repeat(Math.min(50, Math.round((totalFollowers / 1_000_000) * 50)))}${"░".repeat(50 - Math.min(50, Math.round((totalFollowers / 1_000_000) * 50)))}\n\n`;

    for (const p of platforms) {
      if (p.followers === 0 && !p.reach) continue;
      out += this.renderPlatformBar(p);
    }

    out += "```\n\n";

    // Top Content
    if (content.length > 0) {
      out += "### Top Performing Content\n\n";
      out += "```\n";

      const sorted = [...content].sort(
        (a, b) => (b.reach || b.views || 0) - (a.reach || a.views || 0)
      );

      for (const c of sorted.slice(0, 10)) {
        const metric = c.reach || c.views || 0;
        const engagement = this.getEngagementSummary(c);
        const platName = this.getDisplayName(c.platform);
        const label = `[${platName.padEnd(18)}] ${c.contentType.padEnd(10)}`;
        const topic =
          c.topic.length > 30 ? c.topic.slice(0, 27) + "..." : c.topic.padEnd(30);

        out += `  ${label} ${topic} ${metric.toLocaleString().padStart(8)} reach  ${engagement}\n`;
      }

      out += "```\n\n";

      // Content type breakdown
      out += "### Content Type Performance\n\n";
      out += "```\n";
      const byType = this.groupByContentType(content);
      for (const [type, items] of Object.entries(byType)) {
        const avgReach = Math.round(
          items.reduce((s, c) => s + (c.reach || c.views || 0), 0) / items.length
        );
        const avgSaves = Math.round(
          items.reduce((s, c) => s + (c.saves || 0), 0) / items.length
        );
        const bar = "█".repeat(
          Math.min(30, Math.round(avgReach / (this.getMaxAvgReach(byType) || 1) * 30))
        );
        out += `  ${type.padEnd(12)} ${bar} avg ${avgReach.toLocaleString()} reach`;
        if (avgSaves > 0) out += ` | ${avgSaves.toLocaleString()} saves`;
        out += ` (${items.length} posts)\n`;
      }
      out += "```\n\n";
    }

    // Goals
    if (goals.length > 0) {
      out += "### Goals\n";
      for (const g of goals) {
        out += `- ${g}\n`;
      }
      out += "\n";
    }

    // Quick Actions
    out += "### Quick Actions\n";
    out += "- `/sync` — Update your stats manually\n";
    out += "- `/fetch` — Pull live data from connected APIs\n";
    out += "- `/import file.csv` — Import analytics export\n";
    out += "- `/insights` — Get Navi's analysis of this data\n";
    out += "- `/connect` — Set up API connections\n";

    return out;
  }

  private renderPlatformBar(p: PlatformSnapshot): string {
    const maxFollowers = 200_000; // Scale bar relative to this
    const barLength = Math.min(
      40,
      Math.round((p.followers / maxFollowers) * 40)
    );
    const bar = "█".repeat(barLength) + "░".repeat(40 - barLength);
    const change =
      p.followersChange !== undefined && p.followersChange !== 0
        ? ` (${p.followersChange > 0 ? "+" : ""}${p.followersChange.toLocaleString()})`
        : "";

    const displayName = this.getDisplayName(p.platform);
    let line = `  ${displayName.padEnd(18)} ${bar} ${p.followers.toLocaleString()}${change}\n`;

    if (p.reach || p.engagement) {
      line += `  ${"".padEnd(11)} `;
      if (p.reach) line += `Reach: ${p.reach.toLocaleString()}  `;
      if (p.engagement) line += `Eng: ${p.engagement}%  `;
      line += "\n";
    }

    return line;
  }

  private getEngagementSummary(c: ContentPerformance): string {
    const parts: string[] = [];
    if (c.saves) parts.push(`${c.saves.toLocaleString()} saves`);
    if (c.shares) parts.push(`${c.shares.toLocaleString()} shares`);
    if (c.likes) parts.push(`${c.likes.toLocaleString()} likes`);
    if (c.comments) parts.push(`${c.comments.toLocaleString()} comments`);
    return parts.slice(0, 2).join(", ");
  }

  private groupByContentType(
    content: ContentPerformance[]
  ): Record<string, ContentPerformance[]> {
    const groups: Record<string, ContentPerformance[]> = {};
    for (const c of content) {
      const key = c.contentType || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }
    return groups;
  }

  private getDisplayName(platform: string): string {
    const names: Record<string, string> = {
      ig_roserenuu: "@roserenuu",
      ig_jesusforeveryours: "@jesusforeveryours",
      tiktok: "TikTok",
      youtube: "YouTube",
      x: "X (Twitter)",
      threads: "Threads",
      facebook: "Facebook",
    };
    return names[platform] || platform;
  }

  private getMaxAvgReach(
    byType: Record<string, ContentPerformance[]>
  ): number {
    let max = 0;
    for (const items of Object.values(byType)) {
      const avg =
        items.reduce((s, c) => s + (c.reach || c.views || 0), 0) / items.length;
      if (avg > max) max = avg;
    }
    return max;
  }
}
