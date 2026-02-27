import { DataStore } from "./datastore.js";
import { exec } from "child_process";

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
 *   - @jesusforeveryours (ministry/content brand — ~8K)
 *
 * Each account gets its own token and is tracked separately.
 */
export class InstagramConnector implements PlatformConnector {
  platform: string;
  private label: string;
  private handle: string;
  private token: string;
  private openaiKey: string;
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
    this.openaiKey = process.env.OPENAI_API_KEY || "";
  }

  isConfigured(): boolean {
    return this.token.length > 0;
  }

  /**
   * Discover the Instagram Business/Creator Account ID via the Facebook Graph API.
   * The token must have pages_show_list + instagram_basic permissions.
   * Flow: User Token → Facebook Pages → Page's instagram_business_account → IG ID
   */
  private async discoverIgAccountId(): Promise<{
    igId: string;
    username: string;
    followersCount: number;
    mediaCount: number;
  } | null> {
    // Step 1: Get Facebook Pages the user manages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token=${this.token}`
    );
    const pagesData = (await pagesRes.json()) as Record<string, unknown>;

    if (pagesData.error) {
      throw new Error(
        (pagesData.error as Record<string, string>).message || "Failed to fetch Facebook Pages"
      );
    }

    const pages = (pagesData.data as Array<Record<string, unknown>>) || [];

    // Step 2: Find the page with an Instagram Business Account
    for (const page of pages) {
      const igAccount = page.instagram_business_account as Record<string, string> | undefined;
      if (!igAccount?.id) continue;

      // Step 3: Get IG account details to match by handle
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${igAccount.id}?fields=id,username,followers_count,media_count&access_token=${this.token}`
      );
      const igData = (await igRes.json()) as Record<string, unknown>;

      if (igData.error) continue;

      const username = (igData.username as string) || "";

      // Match by handle, or if there's only one page, use it
      if (
        username.toLowerCase() === this.handle.toLowerCase() ||
        pages.length === 1
      ) {
        return {
          igId: igAccount.id,
          username,
          followersCount: (igData.followers_count as number) || 0,
          mediaCount: (igData.media_count as number) || 0,
        };
      }
    }

    // If no exact match found but pages exist, try the first one with an IG account
    for (const page of pages) {
      const igAccount = page.instagram_business_account as Record<string, string> | undefined;
      if (igAccount?.id) {
        const igRes = await fetch(
          `https://graph.facebook.com/v21.0/${igAccount.id}?fields=id,username,followers_count,media_count&access_token=${this.token}`
        );
        const igData = (await igRes.json()) as Record<string, unknown>;
        if (!igData.error) {
          return {
            igId: igAccount.id,
            username: (igData.username as string) || "",
            followersCount: (igData.followers_count as number) || 0,
            mediaCount: (igData.media_count as number) || 0,
          };
        }
      }
    }

    return null;
  }

  async fetchStats(): Promise<string> {
    if (!this.isConfigured()) {
      return `${this.label} (@${this.handle}) not connected. Set the token in .env`;
    }

    try {
      // Discover Instagram Business Account ID via Facebook Graph API
      const igAccount = await this.discoverIgAccountId();

      if (!igAccount) {
        return `${this.label} error: Could not find an Instagram Business/Creator account linked to this token. Make sure the Facebook Page is connected to @${this.handle} and the token has pages_show_list + instagram_basic permissions.`;
      }

      const { igId, username, followersCount: followers } = igAccount;

      this.dataStore.updatePlatform(this.platform, {
        followers,
        notes: `@${username}`,
      });

      // Fetch recent media via Facebook Graph API (Instagram Graph API endpoint)
      const mediaRes = await fetch(
        `https://graph.facebook.com/v21.0/${igId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=25&access_token=${this.token}`
      );
      const media = (await mediaRes.json()) as Record<string, unknown>;
      const posts = (media.data as Array<Record<string, unknown>>) || [];

      let imported = 0;
      let transcribed = 0;
      const MAX_TRANSCRIPTIONS = 10;

      for (const post of posts.slice(0, 20)) {
        try {
          const insightsRes = await fetch(
            `https://graph.facebook.com/v21.0/${post.id}/insights?metric=reach,saved,shares&access_token=${this.token}`
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

          // Transcribe VIDEO/REEL posts so Navi can analyze what Rose is saying
          let transcript: string | undefined;
          if (
            post.media_type === "VIDEO" &&
            post.media_url &&
            this.openaiKey &&
            transcribed < MAX_TRANSCRIPTIONS
          ) {
            transcript =
              (await this.transcribeVideo(
                post.media_url as string,
                post.id as string
              )) || undefined;
            if (transcript) transcribed++;
            // Small delay between transcription requests
            if (transcribed < MAX_TRANSCRIPTIONS) {
              await new Promise((r) => setTimeout(r, 1500));
            }
          }

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
            transcript,
          });
          imported++;
        } catch {
          // Individual post insight fetch may fail for some media types
        }
      }

      const transcriptNote = transcribed > 0 ? `, ${transcribed} Reels transcribed` : "";
      return `${this.label} (@${username}) synced: ${followers.toLocaleString()} followers, ${imported} recent posts imported${transcriptNote}`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `${this.label} fetch failed: ${message}`;
    }
  }

  /**
   * Download an Instagram Reel/Video and transcribe it via OpenAI Whisper API.
   * Returns the spoken transcript text, or null if transcription fails.
   */
  private async transcribeVideo(
    mediaUrl: string,
    postId: string
  ): Promise<string | null> {
    try {
      // Download video from Instagram CDN
      const videoRes = await fetch(mediaUrl, { redirect: "follow" });
      if (!videoRes.ok) {
        console.log(
          `  [${this.label}] Video download failed for ${postId}: HTTP ${videoRes.status}`
        );
        return null;
      }

      const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

      // Skip if too large for Whisper API (25MB limit)
      if (videoBuffer.length > 25 * 1024 * 1024) {
        console.log(
          `  [${this.label}] Video too large to transcribe: ${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB`
        );
        return null;
      }

      // Build multipart form data for Whisper API
      const boundary = "----WhisperBoundary" + Date.now();
      const body = Buffer.concat([
        Buffer.from(
          `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="ig_${postId}.mp4"\r\n` +
            `Content-Type: video/mp4\r\n\r\n`
        ),
        videoBuffer,
        Buffer.from(
          `\r\n--${boundary}\r\n` +
            `Content-Disposition: form-data; name="model"\r\n\r\n` +
            `whisper-1\r\n` +
            `--${boundary}--\r\n`
        ),
      ]);

      const whisperRes = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.openaiKey}`,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
          },
          body,
        }
      );

      if (!whisperRes.ok) {
        const errText = await whisperRes.text().catch(() => "");
        console.log(
          `  [${this.label}] Whisper API error for ${postId}: HTTP ${whisperRes.status} ${errText.slice(0, 200)}`
        );
        return null;
      }

      const result = (await whisperRes.json()) as { text?: string };
      const text = result.text?.trim();

      // Skip empty or very short transcripts (probably just music, no speech)
      if (!text || text.length < 10) {
        console.log(
          `  [${this.label}] No meaningful speech detected in ${postId}`
        );
        return null;
      }

      console.log(
        `  [${this.label}] Transcribed ${postId}: "${text.slice(0, 80)}${text.length > 80 ? "..." : ""}"`
      );
      return text;
    } catch (err) {
      console.log(
        `  [${this.label}] Transcription failed for ${postId}: ${err instanceof Error ? err.message : err}`
      );
      return null;
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
    const clients: Array<{ clientName: string; clientVersion: string; userAgent: string; apiKey?: string; androidSdkVersion?: number }> = [
      {
        clientName: "ANDROID",
        clientVersion: "19.29.37",
        userAgent: "com.google.android.youtube/19.29.37 (Linux; U; Android 14) gzip",
        apiKey: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
        androidSdkVersion: 34,
      },
      {
        clientName: "IOS",
        clientVersion: "19.29.1",
        userAgent: "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X;)",
        apiKey: "AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc",
      },
      {
        clientName: "WEB",
        clientVersion: "2.20241126.01.00",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      {
        clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
        clientVersion: "2.0",
        userAgent: "Mozilla/5.0",
      },
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
    client: { clientName: string; clientVersion: string; userAgent: string; apiKey?: string; androidSdkVersion?: number }
  ): Promise<string | null> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": client.userAgent,
    };

    // Android client needs X-Goog-Api-Format-Version header
    if (client.clientName === "ANDROID") {
      headers["X-Goog-Api-Format-Version"] = "2";
    }

    const url = client.apiKey
      ? `https://www.youtube.com/youtubei/v1/player?key=${client.apiKey}`
      : "https://www.youtube.com/youtubei/v1/player";

    const contextClient: Record<string, unknown> = {
      clientName: client.clientName,
      clientVersion: client.clientVersion,
      hl: "en",
    };
    if (client.androidSdkVersion) {
      contextClient.androidSdkVersion = client.androidSdkVersion;
      contextClient.osName = "Android";
      contextClient.osVersion = "14";
      contextClient.platform = "MOBILE";
    }

    const playerRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        context: { client: contextClient },
        videoId,
      }),
    });

    if (!playerRes.ok) {
      console.log(`[YouTube] Innertube ${client.clientName}: HTTP ${playerRes.status} for ${videoId}`);
      return null;
    }

    const playerData = (await playerRes.json()) as Record<string, unknown>;

    // Log playability status for debugging
    const playability = playerData.playabilityStatus as Record<string, string> | undefined;
    if (playability?.status && playability.status !== "OK") {
      console.log(`[YouTube] Innertube ${client.clientName}: playability=${playability.status} for ${videoId}`);
      return null;
    }

    const captions = playerData.captions as Record<string, unknown> | undefined;
    if (!captions) {
      console.log(`[YouTube] Innertube ${client.clientName}: no captions object for ${videoId}`);
      return null;
    }

    const renderer = captions.playerCaptionsTracklistRenderer as Record<string, unknown> | undefined;
    if (!renderer) return null;

    const captionTracks = renderer.captionTracks as Array<Record<string, string>> | undefined;
    if (!captionTracks || captionTracks.length === 0) {
      console.log(`[YouTube] Innertube ${client.clientName}: no caption tracks for ${videoId}`);
      return null;
    }

    console.log(`[YouTube] Innertube ${client.clientName}: found ${captionTracks.length} caption track(s) for ${videoId}`);

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
    if (!captionRes.ok) {
      console.log(`[YouTube] Innertube ${client.clientName}: caption download HTTP ${captionRes.status} for ${videoId}`);
      return null;
    }
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
    const raw = platform.toLowerCase().trim();

    // "instagram" / "insta" / "ig" → fetch BOTH Instagram accounts
    if (["instagram", "insta", "ig"].includes(raw)) {
      const igConnectors = this.connectors.filter((c) =>
        c.platform.startsWith("ig_")
      );
      if (igConnectors.length === 0) {
        return "No Instagram accounts configured. Use /connect for setup guide.";
      }
      const results: string[] = [];
      for (const c of igConnectors) {
        results.push(await c.fetchStats());
      }
      return results.join("\n");
    }

    const normalized = this.normalizePlatform(raw);
    const connector = this.connectors.find(
      (c) => c.platform === normalized
    );
    if (!connector) {
      return `Unknown platform: ${platform}. Supported: instagram, youtube, tiktok, x, ${this.connectors.map((c) => c.platform).join(", ")}`;
    }
    return connector.fetchStats();
  }

  private normalizePlatform(raw: string): string {
    const aliases: Record<string, string> = {
      ig: "ig_roserenuu",
      insta: "ig_roserenuu",
      instagram: "ig_roserenuu",
      roserenuu: "ig_roserenuu",
      jfy: "ig_jesusforeveryours",
      jesusforeveryours: "ig_jesusforeveryours",
      tt: "tiktok",
      yt: "youtube",
      twitter: "x",
      fb: "facebook",
    };
    return aliases[raw] || raw;
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
