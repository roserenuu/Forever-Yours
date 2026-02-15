import { DataStore } from "./datastore.js";
import { exec } from "child_process";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Base interface for all platform API connectors.
 * Each connector knows how to pull analytics from one platform.
 */
export interface PlatformConnector {
  platform: string;
  isConfigured(): boolean;
  fetchStats(): Promise<string>;
}

/**
 * Instagram Graph API connector — supports multiple accounts.
 * Rose has two Instagram accounts that work together:
 *   - @roserenuu (personal creator brand — Rose herself)
 *   - @jesusforeveryours (ministry/content brand — 144K)
 *
 * Each account gets its own token and is tracked separately.
 */
export class InstagramConnector implements PlatformConnector {
  platform: string;
  private label: string;
  private handle: string;
  private token: string;
  private dataStore: DataStore;

  constructor(
    dataStore: DataStore,
    options: {
      platform: string;
      label: string;
      handle: string;
      envVar: string;
    }
  ) {
    this.dataStore = dataStore;
    this.platform = options.platform;
    this.label = options.label;
    this.handle = options.handle;
    this.token = process.env[options.envVar] || "";
  }

  isConfigured(): boolean {
    return this.token.length > 0;
  }

  async fetchStats(): Promise<string> {
    if (!this.isConfigured()) {
      return `${this.label} (@${this.handle}) not connected. Set the token in .env`;
    }

    try {
      // Fetch account info
      const accountRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,followers_count,media_count&access_token=${this.token}`
      );
      const account = (await accountRes.json()) as Record<string, unknown>;

      if (account.error) {
        return `${this.label} API error: ${(account.error as Record<string, string>).message}`;
      }

      const followers = (account.followers_count as number) || 0;
      const username = (account.username as string) || this.handle;
      this.dataStore.updatePlatform(this.platform, {
        followers,
        notes: `@${username}`,
      });

      // Fetch recent media insights
      const mediaRes = await fetch(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count&limit=25&access_token=${this.token}`
      );
      const media = (await mediaRes.json()) as Record<string, unknown>;
      const posts = (media.data as Array<Record<string, unknown>>) || [];

      let imported = 0;
      for (const post of posts.slice(0, 20)) {
        try {
          const insightsRes = await fetch(
            `https://graph.instagram.com/${post.id}/insights?metric=reach,saved,shares&access_token=${this.token}`
          );
          const insights = (await insightsRes.json()) as Record<
            string,
            unknown
          >;
          const metrics =
            (insights.data as Array<Record<string, unknown>>) || [];

          const getMetricValue = (name: string): number => {
            const metric = metrics.find((m) => m.name === name);
            const values = metric?.values as
              | Array<Record<string, number>>
              | undefined;
            return values?.[0]?.value || 0;
          };
          const reach = getMetricValue("reach");
          const saves = getMetricValue("saved");
          const shares = getMetricValue("shares");

          this.dataStore.addContent({
            platform: this.platform,
            contentType: ((post.media_type as string) || "post").toLowerCase(),
            topic:
              ((post.caption as string) || "").slice(0, 100) || "untitled",
            reach: reach as number,
            likes: (post.like_count as number) || 0,
            comments: (post.comments_count as number) || 0,
            saves: saves as number,
            shares: shares as number,
            postedAt: post.timestamp as string,
          });
          imported++;
        } catch {
          // Individual post insight fetch may fail for some media types
        }
      }

      return `${this.label} (@${username}) synced: ${followers.toLocaleString()} followers, ${imported} recent posts imported`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `${this.label} fetch failed: ${message}`;
    }
  }
}

/**
 * YouTube Data API connector.
 * Requires: Google Cloud project with YouTube Data API v3 enabled.
 * Env vars: YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID
 *
 * Get your credentials:
 * 1. Go to console.cloud.google.com
 * 2. Enable YouTube Data API v3
 * 3. Create an API key
 * 4. Find your channel ID from youtube.com (click profile > Settings > Advanced)
 * 5. Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in .env
 */
export class YouTubeConnector implements PlatformConnector {
  platform = "youtube";
  private apiKey: string;
  private channelId: string;
  private dataStore: DataStore;

  constructor(dataStore: DataStore) {
    this.apiKey = process.env.YOUTUBE_API_KEY || "";
    this.channelId = process.env.YOUTUBE_CHANNEL_ID || "";
    this.dataStore = dataStore;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0 && this.channelId.length > 0;
  }

  /**
   * Fetch transcript/captions for a YouTube video.
   * Tries multiple methods in order of reliability:
   * 1. yt-dlp (most reliable, handles all anti-bot measures)
   * 2. Innertube API with multiple client types
   * 3. Page scraping as last resort
   */
  private async fetchTranscript(videoId: string): Promise<string | null> {
    // Method 1: yt-dlp (most reliable)
    try {
      const transcript = await this.fetchTranscriptViaYtdlp(videoId);
      if (transcript) {
        console.log(`[YouTube] Got transcript via yt-dlp for ${videoId}`);
        return transcript;
      }
    } catch (err) {
      console.log(`[YouTube] yt-dlp failed for ${videoId}: ${err instanceof Error ? err.message : err}`);
    }

    // Method 2: Innertube API (try multiple client types)
    const clients = [
      { clientName: "ANDROID", clientVersion: "19.29.37", userAgent: "com.google.android.youtube/19.29.37" },
      { clientName: "WEB", clientVersion: "2.20241126.01.00", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      { clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER", clientVersion: "2.0", userAgent: "Mozilla/5.0" },
    ];

    for (const client of clients) {
      try {
        const transcript = await this.fetchTranscriptViaInnertube(videoId, client);
        if (transcript) {
          console.log(`[YouTube] Got transcript via Innertube (${client.clientName}) for ${videoId}`);
          return transcript;
        }
      } catch (err) {
        console.log(`[YouTube] Innertube ${client.clientName} threw for ${videoId}: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Method 3: Page scrape (last resort)
    try {
      const transcript = await this.fetchTranscriptViaPageScrape(videoId);
      if (transcript) {
        console.log(`[YouTube] Got transcript via page scrape for ${videoId}`);
        return transcript;
      }
    } catch (err) {
      console.log(`[YouTube] Page scrape threw for ${videoId}: ${err instanceof Error ? err.message : err}`);
    }

    console.log(`[YouTube] All transcript methods failed for ${videoId}`);
    return null;
  }

  /**
   * Fetch captions using yt-dlp CLI tool (most reliable method).
   * yt-dlp handles all of YouTube's anti-bot measures.
   */
  private async fetchTranscriptViaYtdlp(videoId: string): Promise<string | null> {
    const safeId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");

    // Use --dump-json to get subtitle URLs without downloading them
    // This avoids the 429 rate limit on subtitle downloads
    const jsonStr = await new Promise<string | null>((resolve) => {
      const cmd = `yt-dlp --skip-download --dump-json --no-check-certificates "https://www.youtube.com/watch?v=${safeId}" 2>&1`;
      exec(cmd, { timeout: 45000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
        if (error) {
          if (stdout?.includes("not recognized") || stdout?.includes("command not found") || error.message?.includes("ENOENT")) {
            console.log("[YouTube] yt-dlp not installed, skipping");
          } else {
            const lastLine = (stdout || "").trim().split("\n").filter(Boolean).pop() || error.message;
            console.log(`[YouTube] yt-dlp dump-json error for ${safeId}: ${lastLine}`);
          }
          resolve(null);
          return;
        }
        resolve(stdout || null);
      });
    });

    if (!jsonStr) return null;

    try {
      // yt-dlp --dump-json outputs video metadata including subtitle URLs
      const data = JSON.parse(jsonStr.trim());

      // Look for auto or manual captions
      const allSubs = { ...(data.subtitles || {}), ...(data.automatic_captions || {}) };

      // Find English subtitle track
      let subUrl: string | null = null;
      const langKeys = Object.keys(allSubs);
      const enKey = langKeys.find((k) => k === "en") ||
                    langKeys.find((k) => k.startsWith("en")) ||
                    langKeys[0];

      if (enKey && allSubs[enKey]) {
        const formats = allSubs[enKey] as Array<{ url: string; ext: string }>;
        // Prefer json3, then srv1 (XML), then vtt
        const json3 = formats.find((f) => f.ext === "json3");
        const srv1 = formats.find((f) => f.ext === "srv1");
        const vtt = formats.find((f) => f.ext === "vtt");
        const chosen = json3 || srv1 || vtt;
        if (chosen) subUrl = chosen.url;
      }

      if (!subUrl) {
        console.log(`[YouTube] yt-dlp found no subtitle URLs for ${safeId} (langs: ${langKeys.join(",")})`);
        return null;
      }

      // Fetch the subtitle content ourselves (no rate limit from yt-dlp)
      const subRes = await fetch(subUrl);
      if (!subRes.ok) {
        console.log(`[YouTube] Subtitle fetch failed for ${safeId}: HTTP ${subRes.status}`);
        return null;
      }

      const content = await subRes.text();

      // Try parsing as JSON3
      try {
        const json = JSON.parse(content);
        if (json.events) {
          const lines: string[] = [];
          for (const event of json.events) {
            if (event.segs) {
              const text = event.segs.map((s: { utf8: string }) => s.utf8 || "").join("").trim();
              if (text && text !== "\n") lines.push(text);
            }
          }
          if (lines.length > 0) return lines.join(" ");
        }
      } catch {
        // Not JSON, try as XML/VTT
      }

      // Try as XML (srv1 format)
      const xmlResult = this.parseXmlCaptions(content);
      if (xmlResult) return xmlResult;

      // Try as VTT/SRT
      const text = content
        .replace(/^\d+\s*$/gm, "")
        .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/g, "")
        .replace(/WEBVTT.*$/gm, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{2,}/g, " ")
        .trim();
      return text.length > 0 ? text : null;

    } catch (err) {
      console.log(`[YouTube] yt-dlp JSON parse error for ${safeId}: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  /**
   * Fetch captions via YouTube's Innertube API with configurable client type.
   */
  private async fetchTranscriptViaInnertube(
    videoId: string,
    client: { clientName: string; clientVersion: string; userAgent: string }
  ): Promise<string | null> {
    const playerRes = await fetch("https://www.youtube.com/youtubei/v1/player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": client.userAgent,
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: client.clientName,
            clientVersion: client.clientVersion,
            hl: "en",
          },
        },
        videoId,
      }),
    });

    const playerData = (await playerRes.json()) as Record<string, unknown>;

    // Log playability status for debugging
    const playability = playerData.playabilityStatus as Record<string, string> | undefined;
    if (playability?.status && playability.status !== "OK") {
      console.log(`[YouTube] Innertube ${client.clientName}: playability=${playability.status} for ${videoId}`);
    }

    const captions = playerData.captions as Record<string, unknown> | undefined;
    if (!captions) return null;

    const renderer = captions.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined;
    if (!renderer) return null;

    const captionTracks = renderer.captionTracks as Array<Record<string, string>> | undefined;
    if (!captionTracks || captionTracks.length === 0) return null;

    // Pick English track if available, otherwise first track
    let track = captionTracks[0];
    for (const t of captionTracks) {
      if (t.languageCode?.startsWith("en")) {
        track = t;
        break;
      }
    }

    let captionUrl = track.baseUrl;
    if (!captionUrl) return null;

    captionUrl = captionUrl.replace(/\\u0026/g, "&");
    const captionRes = await fetch(captionUrl);
    const xml = await captionRes.text();
    return this.parseXmlCaptions(xml);
  }

  /**
   * Fallback: scrape the watch page HTML for captionTracks JSON.
   */
  private async fetchTranscriptViaPageScrape(videoId: string): Promise<string | null> {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });
    const html = await pageRes.text();

    // Try multiple regex patterns for caption data
    let captionJson: string | null = null;

    // Pattern 1: captionTracks array
    const match1 = html.match(/"captionTracks"\s*:\s*(\[.*?\])/s);
    if (match1) captionJson = match1[1];

    // Pattern 2: Look in ytInitialPlayerResponse
    if (!captionJson) {
      const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});\s*(?:var|<\/script>)/s);
      if (playerMatch) {
        try {
          const playerData = JSON.parse(playerMatch[1]);
          const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (tracks?.length > 0) {
            let track = tracks[0];
            for (const t of tracks) {
              if (t.languageCode?.startsWith("en")) { track = t; break; }
            }
            if (track.baseUrl) {
              const captionRes = await fetch(track.baseUrl.replace(/\\u0026/g, "&"));
              const xml = await captionRes.text();
              return this.parseXmlCaptions(xml);
            }
          }
        } catch { /* JSON parse failed, continue */ }
      }
    }

    if (!captionJson) {
      console.log(`[YouTube] No captionTracks in page HTML for ${videoId} (HTML length: ${html.length})`);
      return null;
    }

    const urlMatches = [...captionJson.matchAll(/"baseUrl"\s*:\s*"([^"]+)"/g)];
    const langMatches = [...captionJson.matchAll(/"languageCode"\s*:\s*"([^"]+)"/g)];

    if (urlMatches.length === 0) return null;

    let captionUrl = urlMatches[0][1];
    for (let i = 0; i < langMatches.length && i < urlMatches.length; i++) {
      if (langMatches[i][1].startsWith("en")) {
        captionUrl = urlMatches[i][1];
        break;
      }
    }

    captionUrl = captionUrl.replace(/\\u0026/g, "&");
    const captionRes = await fetch(captionUrl);
    const xml = await captionRes.text();
    return this.parseXmlCaptions(xml);
  }

  /**
   * Parse YouTube XML caption response into plain text.
   */
  private parseXmlCaptions(xml: string): string | null {
    const lines: string[] = [];
    const textRegex = /<text[^>]*>(.*?)<\/text>/gs;
    let match: RegExpExecArray | null;
    while ((match = textRegex.exec(xml)) !== null) {
      const text = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (text) lines.push(text);
    }
    return lines.length > 0 ? lines.join(" ") : null;
  }

  /**
   * Parse ISO 8601 duration (e.g. "PT1M30S") into seconds.
   */
  private parseDuration(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  async fetchStats(): Promise<string> {
    if (!this.isConfigured()) {
      return "YouTube not connected. Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in .env";
    }

    try {
      // Fetch channel stats
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${this.channelId}&key=${this.apiKey}`
      );
      const channelData = (await channelRes.json()) as Record<string, unknown>;
      const items = (channelData.items as Array<Record<string, unknown>>) || [];

      if (items.length === 0) {
        return "YouTube channel not found. Check your YOUTUBE_CHANNEL_ID.";
      }

      const stats = items[0].statistics as Record<string, string>;
      const subscribers = parseInt(stats.subscriberCount || "0", 10);
      const totalViews = parseInt(stats.viewCount || "0", 10);

      this.dataStore.updatePlatform("youtube", {
        followers: subscribers,
        reach: totalViews,
        notes: `Total channel views: ${totalViews.toLocaleString()}`,
      });

      // Fetch recent videos (up to 30 to capture enough Shorts)
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${this.channelId}&maxResults=30&order=date&type=video&key=${this.apiKey}`
      );
      const videosData = (await videosRes.json()) as Record<string, unknown>;
      const videos = (videosData.items as Array<Record<string, unknown>>) || [];

      // Batch video IDs to fetch stats + duration in one call (saves API quota)
      const videoIds = videos
        .map((v) => (v.id as Record<string, string>)?.videoId)
        .filter(Boolean);

      let imported = 0;
      let shortsCount = 0;
      let descriptionFallbacks = 0;
      const transcriptMap = new Map<string, string | null>();

      if (videoIds.length > 0) {
        const detailsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds.join(",")}&key=${this.apiKey}`
        );
        const detailsData = (await detailsRes.json()) as Record<string, unknown>;
        const detailItems = (detailsData.items as Array<Record<string, unknown>>) || [];

        // Fetch transcripts sequentially with delays to avoid YouTube 429 rate limits
        for (const item of detailItems) {
          const videoId = (item.id as string) || "";
          if (videoId) {
            const transcript = await this.fetchTranscript(videoId);
            transcriptMap.set(videoId, transcript);
            // Small delay between requests to avoid rate limiting
            if (transcriptMap.size < detailItems.length) {
              await new Promise((r) => setTimeout(r, 3000));
            }
          }
        }

        for (const item of detailItems) {
          const snippet = item.snippet as Record<string, string>;
          const vStats = item.statistics as Record<string, string>;
          const contentDetails = item.contentDetails as Record<string, string>;
          const videoId = (item.id as string) || "";

          const durationSec = this.parseDuration(contentDetails?.duration || "");
          const title = snippet.title || "untitled";
          // YouTube Shorts can be up to 3 minutes (180s). Also check for #Shorts in title.
          const isShort =
            (durationSec > 0 && durationSec <= 180) ||
            /\bshorts?\b/i.test(title);
          const contentType = isShort ? "short" : "video";

          if (isShort) shortsCount++;

          // Use transcript if available, fall back to video description
          let transcript = transcriptMap.get(videoId) || undefined;
          if (!transcript && snippet.description && snippet.description.trim().length > 10) {
            transcript = `[Description] ${snippet.description.trim()}`;
            descriptionFallbacks++;
          }

          this.dataStore.addContent({
            platform: "youtube",
            contentType,
            topic: snippet.title || "untitled",
            reach: parseInt(vStats.viewCount || "0", 10),
            likes: parseInt(vStats.likeCount || "0", 10),
            comments: parseInt(vStats.commentCount || "0", 10),
            views: parseInt(vStats.viewCount || "0", 10),
            postedAt: snippet.publishedAt,
            transcript,
          });
          imported++;
        }
      }

      const withTranscripts = Array.from(transcriptMap.values()).filter(Boolean).length;
      const totalContent = withTranscripts + descriptionFallbacks;
      return `YouTube synced: ${subscribers.toLocaleString()} subscribers, ${imported} recent videos imported (${shortsCount} Shorts, ${imported - shortsCount} long-form, ${withTranscripts} transcripts + ${descriptionFallbacks} descriptions loaded)`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `YouTube fetch failed: ${message}`;
    }
  }
}

/**
 * TikTok Research API connector.
 * Requires: TikTok for Developers account.
 * Env vars: TIKTOK_ACCESS_TOKEN
 *
 * Note: TikTok's API is more restrictive. For most creators,
 * CSV export from the TikTok Analytics dashboard is easier.
 */
export class TikTokConnector implements PlatformConnector {
  platform = "tiktok";
  private token: string;
  private dataStore: DataStore;

  constructor(dataStore: DataStore) {
    this.token = process.env.TIKTOK_ACCESS_TOKEN || "";
    this.dataStore = dataStore;
  }

  isConfigured(): boolean {
    return this.token.length > 0;
  }

  async fetchStats(): Promise<string> {
    if (!this.isConfigured()) {
      return "TikTok not connected. Set TIKTOK_ACCESS_TOKEN in .env — or use /import with a CSV export from TikTok Analytics (easier)";
    }

    try {
      const res = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count,video_count",
        {
          headers: { Authorization: `Bearer ${this.token}` },
        }
      );
      const data = (await res.json()) as Record<string, unknown>;
      const userInfo = (data.data as Record<string, unknown>)?.user as Record<
        string,
        number
      >;

      if (userInfo) {
        this.dataStore.updatePlatform("tiktok", {
          followers: userInfo.follower_count || 0,
          notes: `Total likes: ${(userInfo.likes_count || 0).toLocaleString()}`,
        });
        return `TikTok synced: ${(userInfo.follower_count || 0).toLocaleString()} followers`;
      }

      return "TikTok: Could not fetch user info. Check your access token.";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `TikTok fetch failed: ${message}`;
    }
  }
}

/**
 * X (Twitter) API v2 connector.
 * Requires: X Developer account (Basic tier or higher).
 * Env vars: X_BEARER_TOKEN, X_USER_ID
 *
 * Get your credentials:
 * 1. Apply at developer.twitter.com
 * 2. Create a project + app
 * 3. Generate a bearer token
 * 4. Find your user ID at tweeterid.com
 * 5. Set X_BEARER_TOKEN and X_USER_ID in .env
 */
export class XConnector implements PlatformConnector {
  platform = "x";
  private bearerToken: string;
  private userId: string;
  private dataStore: DataStore;

  constructor(dataStore: DataStore) {
    this.bearerToken = process.env.X_BEARER_TOKEN || "";
    this.userId = process.env.X_USER_ID || "";
    this.dataStore = dataStore;
  }

  isConfigured(): boolean {
    return this.bearerToken.length > 0 && this.userId.length > 0;
  }

  async fetchStats(): Promise<string> {
    if (!this.isConfigured()) {
      return "X not connected. Set X_BEARER_TOKEN and X_USER_ID in .env";
    }

    try {
      // Fetch user info
      const userRes = await fetch(
        `https://api.twitter.com/2/users/${this.userId}?user.fields=public_metrics`,
        { headers: { Authorization: `Bearer ${this.bearerToken}` } }
      );
      const userData = (await userRes.json()) as Record<string, unknown>;
      const user = userData.data as Record<string, unknown>;
      const metrics = user?.public_metrics as Record<string, number>;

      if (metrics) {
        this.dataStore.updatePlatform("x", {
          followers: metrics.followers_count || 0,
          notes: `Following: ${metrics.following_count || 0} | Tweets: ${metrics.tweet_count || 0}`,
        });

        return `X synced: ${(metrics.followers_count || 0).toLocaleString()} followers`;
      }

      return "X: Could not fetch user info. Check your credentials.";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `X fetch failed: ${message}`;
    }
  }
}

/**
 * ConnectorManager — orchestrates all platform connectors.
 */
export class ConnectorManager {
  private connectors: PlatformConnector[];
  private dataStore: DataStore;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
    this.connectors = [
      // Two Instagram accounts — Rose's personal + brand
      new InstagramConnector(dataStore, {
        platform: "ig_roserenuu",
        label: "Instagram (Rose)",
        handle: "roserenuu",
        envVar: "INSTAGRAM_ROSERENUU_TOKEN",
      }),
      new InstagramConnector(dataStore, {
        platform: "ig_jesusforeveryours",
        label: "Instagram (JFY)",
        handle: "jesusforeveryours",
        envVar: "INSTAGRAM_JFY_TOKEN",
      }),
      new YouTubeConnector(dataStore),
      new TikTokConnector(dataStore),
      new XConnector(dataStore),
    ];
  }

  /**
   * Fetch stats from all configured platforms.
   */
  async fetchAll(): Promise<string> {
    const configured = this.connectors.filter((c) => c.isConfigured());

    if (configured.length === 0) {
      return this.getSetupGuide();
    }

    const results: string[] = [];
    results.push(`Fetching from ${configured.length} connected platform(s)...\n`);

    for (const connector of configured) {
      const result = await connector.fetchStats();
      results.push(`**${connector.platform.toUpperCase()}**: ${result}`);
    }

    const notConfigured = this.connectors.filter((c) => !c.isConfigured());
    if (notConfigured.length > 0) {
      results.push(
        `\nNot connected: ${notConfigured.map((c) => c.platform).join(", ")} — use /connect for setup guide`
      );
    }

    return results.join("\n");
  }

  /**
   * Fetch stats from a single platform.
   */
  async fetchOne(platform: string): Promise<string> {
    const connector = this.connectors.find(
      (c) => c.platform === platform.toLowerCase()
    );
    if (!connector) {
      return `Unknown platform: ${platform}. Supported: ${this.connectors.map((c) => c.platform).join(", ")}`;
    }
    return connector.fetchStats();
  }

  /**
   * Show which platforms are connected and setup instructions.
   */
  getStatus(): string {
    const lines: string[] = ["**Platform Connection Status**\n"];

    for (const c of this.connectors) {
      const status = c.isConfigured() ? "Connected" : "Not connected";
      const icon = c.isConfigured() ? "[OK]" : "[--]";
      lines.push(`${icon} **${c.platform.toUpperCase()}**: ${status}`);
    }

    lines.push("\nUse `/connect` for setup instructions.");
    return lines.join("\n");
  }

  getSetupGuide(): string {
    return `**Connect Your Platforms**

No API keys detected. Here's how to connect each platform:

**Option 1: API Keys (automatic sync)**
Add these to your \`.env\` file:

\`\`\`
# Instagram — @roserenuu (Rose's personal creator account)
INSTAGRAM_ROSERENUU_TOKEN=your_token_here

# Instagram — @jesusforeveryours (brand/ministry account)
INSTAGRAM_JFY_TOKEN=your_token_here

# YouTube (via Google Cloud)
YOUTUBE_API_KEY=your_key_here
YOUTUBE_CHANNEL_ID=your_channel_id_here

# TikTok
TIKTOK_ACCESS_TOKEN=your_token_here

# X / Twitter
X_BEARER_TOKEN=your_bearer_token_here
X_USER_ID=your_user_id_here
\`\`\`

Then use \`/fetch\` to pull your stats automatically.

**Option 2: CSV Import (no API needed)**
Export analytics from each platform's dashboard:
- **Instagram**: Professional Dashboard > Insights > Export
- **YouTube**: Studio > Analytics > Advanced Mode > Export
- **TikTok**: Analytics > Export Data
- **X**: Analytics > Export

Then use \`/import path/to/file.csv\`

**Option 3: Manual Sync**
Just paste your stats: \`/sync instagram 145000 followers reach 800000\``;
  }
}
