import * as fs from "fs";
import { DataStore, ContentPerformance, PlatformSnapshot } from "./datastore.js";

interface CsvRow {
  [key: string]: string;
}

export class CsvImporter {
  private dataStore: DataStore;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Import a CSV file exported from any supported platform.
   * Auto-detects the platform based on column headers.
   */
  importFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      return `File not found: ${filePath}`;
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const rows = this.parseCsv(raw);

    if (rows.length === 0) {
      return "CSV file is empty or could not be parsed.";
    }

    const headers = Object.keys(rows[0]).map((h) => h.toLowerCase());
    const platform = this.detectPlatform(headers);

    switch (platform) {
      case "instagram":
        return this.importInstagram(rows);
      case "youtube":
        return this.importYouTube(rows);
      case "tiktok":
        return this.importTikTok(rows);
      case "x":
        return this.importX(rows);
      case "facebook":
        return this.importFacebook(rows);
      default:
        return this.importGeneric(rows);
    }
  }

  private parseCsv(raw: string): CsvRow[] {
    const lines = raw.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = this.splitCsvLine(lines[0]);
    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.splitCsvLine(lines[i]);
      const row: CsvRow = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j].trim()] = (values[j] || "").trim();
      }
      rows.push(row);
    }

    return rows;
  }

  private splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private detectPlatform(headers: string[]): string {
    const joined = headers.join(" ");

    // Instagram Insights export
    if (
      joined.includes("reach") &&
      (joined.includes("saves") || joined.includes("impressions"))
    ) {
      return "instagram";
    }

    // YouTube Studio export
    if (
      joined.includes("watch time") ||
      joined.includes("subscribers") ||
      joined.includes("ctr")
    ) {
      return "youtube";
    }

    // TikTok analytics export
    if (
      joined.includes("video views") ||
      joined.includes("profile views") ||
      joined.includes("tiktok")
    ) {
      return "tiktok";
    }

    // X/Twitter analytics
    if (
      joined.includes("tweet") ||
      joined.includes("impressions") ||
      joined.includes("retweets")
    ) {
      return "x";
    }

    // Facebook Insights
    if (
      joined.includes("page") &&
      (joined.includes("reach") || joined.includes("reactions"))
    ) {
      return "facebook";
    }

    return "unknown";
  }

  // --- Platform-specific importers ---

  private importInstagram(rows: CsvRow[]): string {
    const results: string[] = [];
    let totalReach = 0;
    let totalSaves = 0;
    let count = 0;

    for (const row of rows) {
      const content: ContentPerformance = {
        platform: "instagram",
        contentType: this.findValue(row, [
          "content type",
          "type",
          "media type",
          "media_type",
        ]),
        topic: this.findValue(row, [
          "caption",
          "title",
          "description",
          "content",
        ]),
        reach: this.findNumber(row, ["reach", "accounts reached"]),
        likes: this.findNumber(row, ["likes", "like count"]),
        comments: this.findNumber(row, ["comments", "comment count"]),
        saves: this.findNumber(row, ["saves", "save count", "saved"]),
        shares: this.findNumber(row, ["shares", "share count", "sends"]),
        views: this.findNumber(row, [
          "views",
          "video views",
          "plays",
          "impressions",
        ]),
        postedAt: this.findValue(row, [
          "date",
          "published",
          "posted",
          "timestamp",
        ]),
      };

      if (content.reach > 0 || (content.views && content.views > 0)) {
        this.dataStore.addContent(content);
        totalReach += content.reach;
        totalSaves += content.saves || 0;
        count++;
      }
    }

    // Update platform stats with averages
    if (count > 0) {
      this.dataStore.updatePlatform("instagram", {
        reach: Math.round(totalReach / count),
        notes: `Imported ${count} posts. Avg reach: ${Math.round(totalReach / count).toLocaleString()}. Total saves: ${totalSaves.toLocaleString()}.`,
      });
    }

    results.push(`Imported **${count} Instagram posts**`);
    results.push(
      `Average reach: ${count > 0 ? Math.round(totalReach / count).toLocaleString() : 0}`
    );
    results.push(`Total saves: ${totalSaves.toLocaleString()}`);
    return results.join("\n");
  }

  private importYouTube(rows: CsvRow[]): string {
    const results: string[] = [];
    let totalViews = 0;
    let count = 0;

    for (const row of rows) {
      const content: ContentPerformance = {
        platform: "youtube",
        contentType: this.findValue(row, ["type", "content type"]) || "video",
        topic: this.findValue(row, ["title", "video title", "content"]),
        reach: this.findNumber(row, ["views", "video views"]),
        likes: this.findNumber(row, ["likes"]),
        comments: this.findNumber(row, ["comments"]),
        shares: this.findNumber(row, ["shares"]),
        views: this.findNumber(row, ["views", "video views"]),
        watchTime: this.findValue(row, [
          "watch time",
          "watch time (hours)",
          "average view duration",
        ]),
        postedAt: this.findValue(row, ["date", "published", "upload date"]),
      };

      if (content.views && content.views > 0) {
        this.dataStore.addContent(content);
        totalViews += content.views;
        count++;
      }
    }

    if (count > 0) {
      this.dataStore.updatePlatform("youtube", {
        reach: Math.round(totalViews / count),
        notes: `Imported ${count} videos. Total views: ${totalViews.toLocaleString()}.`,
      });
    }

    results.push(`Imported **${count} YouTube videos**`);
    results.push(`Total views: ${totalViews.toLocaleString()}`);
    return results.join("\n");
  }

  private importTikTok(rows: CsvRow[]): string {
    const results: string[] = [];
    let totalViews = 0;
    let count = 0;

    for (const row of rows) {
      const content: ContentPerformance = {
        platform: "tiktok",
        contentType: "video",
        topic: this.findValue(row, [
          "caption",
          "title",
          "description",
          "content",
        ]),
        reach: this.findNumber(row, [
          "views",
          "video views",
          "total play time",
        ]),
        likes: this.findNumber(row, ["likes", "diggs"]),
        comments: this.findNumber(row, ["comments"]),
        shares: this.findNumber(row, ["shares"]),
        views: this.findNumber(row, ["views", "video views"]),
        postedAt: this.findValue(row, ["date", "posted", "create time"]),
      };

      if (content.views && content.views > 0) {
        this.dataStore.addContent(content);
        totalViews += content.views;
        count++;
      }
    }

    if (count > 0) {
      this.dataStore.updatePlatform("tiktok", {
        reach: Math.round(totalViews / count),
        notes: `Imported ${count} TikToks. Total views: ${totalViews.toLocaleString()}.`,
      });
    }

    results.push(`Imported **${count} TikTok videos**`);
    results.push(`Total views: ${totalViews.toLocaleString()}`);
    return results.join("\n");
  }

  private importX(rows: CsvRow[]): string {
    const results: string[] = [];
    let totalImpressions = 0;
    let count = 0;

    for (const row of rows) {
      const content: ContentPerformance = {
        platform: "x",
        contentType: this.findValue(row, ["type"]) || "tweet",
        topic: this.findValue(row, ["tweet text", "text", "content", "tweet"]),
        reach: this.findNumber(row, ["impressions"]),
        likes: this.findNumber(row, ["likes", "favorites"]),
        comments: this.findNumber(row, ["replies"]),
        shares: this.findNumber(row, ["retweets", "reposts"]),
        views: this.findNumber(row, ["impressions", "views"]),
        postedAt: this.findValue(row, ["date", "time", "created"]),
      };

      if (content.reach > 0) {
        this.dataStore.addContent(content);
        totalImpressions += content.reach;
        count++;
      }
    }

    if (count > 0) {
      this.dataStore.updatePlatform("x", {
        reach: Math.round(totalImpressions / count),
        notes: `Imported ${count} tweets. Avg impressions: ${Math.round(totalImpressions / count).toLocaleString()}.`,
      });
    }

    results.push(`Imported **${count} tweets/posts**`);
    results.push(
      `Avg impressions: ${count > 0 ? Math.round(totalImpressions / count).toLocaleString() : 0}`
    );
    return results.join("\n");
  }

  private importFacebook(rows: CsvRow[]): string {
    const results: string[] = [];
    let totalReach = 0;
    let count = 0;

    for (const row of rows) {
      const content: ContentPerformance = {
        platform: "facebook",
        contentType: this.findValue(row, ["type", "post type"]) || "post",
        topic: this.findValue(row, ["message", "description", "content"]),
        reach: this.findNumber(row, ["reach", "post reach"]),
        likes: this.findNumber(row, ["reactions", "likes"]),
        comments: this.findNumber(row, ["comments"]),
        shares: this.findNumber(row, ["shares"]),
        views: this.findNumber(row, ["views", "video views"]),
        postedAt: this.findValue(row, ["date", "posted", "created"]),
      };

      if (content.reach > 0 || content.views) {
        this.dataStore.addContent(content);
        totalReach += content.reach;
        count++;
      }
    }

    if (count > 0) {
      this.dataStore.updatePlatform("facebook", {
        reach: Math.round(totalReach / count),
        notes: `Imported ${count} posts. Avg reach: ${Math.round(totalReach / count).toLocaleString()}.`,
      });
    }

    results.push(`Imported **${count} Facebook posts**`);
    results.push(`Total reach: ${totalReach.toLocaleString()}`);
    return results.join("\n");
  }

  private importGeneric(rows: CsvRow[]): string {
    const results: string[] = [];
    let count = 0;

    for (const row of rows) {
      const content: ContentPerformance = {
        platform: this.findValue(row, ["platform", "source"]) || "unknown",
        contentType: this.findValue(row, ["type", "content type"]) || "post",
        topic: this.findValue(row, [
          "title",
          "caption",
          "description",
          "content",
          "text",
        ]),
        reach: this.findNumber(row, ["reach", "impressions", "views"]),
        likes: this.findNumber(row, ["likes", "favorites", "reactions"]),
        comments: this.findNumber(row, ["comments", "replies"]),
        saves: this.findNumber(row, ["saves", "bookmarks"]),
        shares: this.findNumber(row, ["shares", "retweets", "reposts"]),
        views: this.findNumber(row, ["views", "video views", "plays"]),
        postedAt: this.findValue(row, ["date", "posted", "created", "time"]),
      };

      if (content.reach > 0 || (content.views && content.views > 0)) {
        this.dataStore.addContent(content);
        count++;
      }
    }

    results.push(`Imported **${count} content entries** (auto-detected format)`);
    results.push(
      "Could not detect platform — imported as generic. Check /stats to verify."
    );
    return results.join("\n");
  }

  // --- Helpers ---

  private findValue(row: CsvRow, possibleKeys: string[]): string {
    for (const key of possibleKeys) {
      for (const rowKey of Object.keys(row)) {
        if (rowKey.toLowerCase().includes(key.toLowerCase())) {
          return row[rowKey];
        }
      }
    }
    return "";
  }

  private findNumber(row: CsvRow, possibleKeys: string[]): number {
    const val = this.findValue(row, possibleKeys);
    if (!val) return 0;
    const cleaned = val.replace(/[,$%\s]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num);
  }
}
