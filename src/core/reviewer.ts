import Anthropic from "@anthropic-ai/sdk";
import { BrandConfig } from "../config/brand.js";

export interface ReviewResult {
  approved: boolean;
  revised: string;
  notes: string[];
}

export class QAReviewer {
  private client: Anthropic;
  private brand: BrandConfig;
  private model: string;
  private recentPhrases: Set<string> = new Set();

  constructor(brand: BrandConfig, model?: string) {
    this.client = new Anthropic();
    this.brand = brand;
    this.model = model ?? "claude-sonnet-4-5-20250929";
  }

  async review(
    originalPrompt: string,
    draft: string
  ): Promise<ReviewResult> {
    const avoidWords = this.brand.voice.avoidWords.join(", ");
    const recentList = Array.from(this.recentPhrases).join(", ");

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: `You are the Quality Reviewer for Rose Renuu's "Jesus Forever Yours" brand. Your ONLY job is to catch problems and fix them before content reaches Rose.

You review drafts written by another AI agent. You are the last line of defense.

## What You Check

1. **REPETITION** — The #1 issue. Flag if the draft:
   - Reuses phrases like "I see you", "I am with you", "Trust Me", "Come to Me" more than once in the same piece
   - Uses the same sentence structure repeatedly (e.g., "When you... I am your God of..." over and over)
   - Opens the same way as previous notes ("I see you" or "I know")
   ${recentList ? `- Uses any of these RECENTLY USED phrases (from earlier in this session): ${recentList}` : ""}

2. **VOICE** — Must sound like Rose wrote it:
   - Intimate, tender, like a handwritten letter from God
   - "I am with you" not "I'm with you" (slightly formal, reverent)
   - No churchy jargon, no prosperity gospel language
   - NEVER uses: ${avoidWords}

3. **STRUCTURE** — For Love Notes specifically:
   - Opens with "My Child,"
   - Closes with "Forever Yours, Heavenly Father"
   - Ends with one NLT scripture (full text + reference)
   - 150-250 words (not counting scripture)
   - Has a 2-3 word title

4. **AUTHENTICITY** — Content must:
   - Acknowledge real pain before offering hope
   - Never be dismissive or generic
   - Ground truth in scripture, woven naturally
   - Feel specific, not cookie-cutter

## Your Response Format

Respond ONLY with valid JSON (no markdown fences, no extra text):
{
  "approved": true/false,
  "notes": ["issue 1", "issue 2"],
  "revised": "the full revised content if changes were needed, or empty string if approved as-is"
}

If the draft is good, set approved: true, notes: [], revised: "".
If you find issues, set approved: false, list the issues in notes, and provide the FULL corrected version in revised. Do not explain your changes — just fix them.`,
      messages: [
        {
          role: "user",
          content: `## Original request from Rose:\n${originalPrompt}\n\n## Draft to review:\n${draft}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    try {
      const result = JSON.parse(text) as ReviewResult;

      // Track key phrases from the final output for future repetition checks
      const finalContent = result.revised || draft;
      this.trackPhrases(finalContent);

      return result;
    } catch {
      // If JSON parsing fails, pass through the original draft
      this.trackPhrases(draft);
      return { approved: true, revised: "", notes: [] };
    }
  }

  private trackPhrases(content: string): void {
    const patterns = [
      /I see you/gi,
      /I am with you/gi,
      /Trust Me/gi,
      /Come to Me/gi,
      /Rest in/gi,
      /I understand/gi,
      /I know your/gi,
      /I am your God of \w+/gi,
      /When you .{5,30}, I am/gi,
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          this.recentPhrases.add(match.toLowerCase().trim());
        }
      }
    }

    // Keep the set from growing forever — cap at 50
    if (this.recentPhrases.size > 50) {
      const entries = Array.from(this.recentPhrases);
      this.recentPhrases = new Set(entries.slice(entries.length - 50));
    }
  }

  clearHistory(): void {
    this.recentPhrases.clear();
  }
}
