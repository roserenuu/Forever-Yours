import Anthropic from "@anthropic-ai/sdk";
import { createCanvas, CanvasRenderingContext2D } from "canvas";
import * as fs from "fs";
import * as path from "path";
import { BrandConfig } from "../config/brand.js";

// Rose's brand color palette
const BRAND_COLORS = {
  cream: "#FFF8F0",
  warmWhite: "#FFFDF9",
  softPink: "#F5E6E0",
  blushPink: "#E8C4C4",
  dustyRose: "#C9A0A0",
  deepBurgundy: "#6B2D3E",
  warmBrown: "#8B6F5E",
  softGold: "#D4A574",
  gentleSage: "#B5C4B1",
  charcoal: "#3A3A3A",
  darkText: "#2C2C2C",
  lightText: "#FFFFFF",
  scriptureGold: "#C4956A",
};

// Font stacks (system fonts that look good)
const FONTS = {
  heading: "Georgia",
  body: "Georgia",
  scripture: "Georgia",
  accent: "Arial",
};

export interface DesignRequest {
  type: "carousel" | "quote" | "story" | "thumbnail" | "post";
  title?: string;
  bodyText: string;
  scripture?: string;
  scriptureRef?: string;
  slideCount?: number;
  account?: "jesusforeveryours" | "roserenuu";
}

export interface DesignResult {
  files: string[];
  designBrief: string;
}

const OUTPUT_DIR = path.join(process.cwd(), "designs");

export class DesignerAgent {
  readonly name = "Iris";
  private client: Anthropic;
  private brand: BrandConfig;
  private model: string;

  constructor(brand: BrandConfig, model?: string) {
    this.client = new Anthropic();
    this.brand = brand;
    this.model = model ?? "claude-sonnet-4-5-20250929";

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  }

  /**
   * Main entry: takes a content request, generates design brief via AI,
   * then renders the actual images.
   */
  async design(briefOrContext: string): Promise<string> {
    // Step 1: Ask AI to create a structured design plan
    const designPlan = await this.generateDesignPlan(briefOrContext);

    // Step 2: Parse the design plan and render images
    const result = await this.renderFromPlan(designPlan);

    return result;
  }

  private async generateDesignPlan(briefOrContext: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 3000,
      system: `You are Iris — the Visual Design Director for Rose Renuu's "Jesus Forever Yours" brand. You create beautiful, on-brand graphics that Rose can post directly to Instagram, TikTok, YouTube, and more.

## Your Job
Generate STRUCTURED design plans that can be rendered into actual images. You don't just describe designs — you provide the EXACT text, colors, and layout for each slide/graphic so they can be built automatically.

## The Team
- Eden (Content Creator) writes the text — you make it BEAUTIFUL
- Selah (QA Reviewer) checks everything
- Mara (Scheduler) plans when to post — you make sure designs match the calendar
- Zion (Marketing) handles organic promos — you make promo graphics that don't feel like ads
- Adara (Ad Copy) writes ad copy — you design the ad creative
- Lyra (Email) handles newsletters — you design email header graphics
- Kaia (Community) manages engagement — you create engagement graphics (polls, Q&As)
- Nova (Partnerships) handles brand deals — you design branded partnership content
- Navi (Analytics) reads the data — FOLLOW HER DIRECTIVES on which visual styles perform best

## Rose's Brand Visual Identity
- **Primary Colors**: Cream (#FFF8F0), Soft Pink (#F5E6E0), Blush Pink (#E8C4C4), Dusty Rose (#C9A0A0)
- **Accent Colors**: Deep Burgundy (#6B2D3E), Warm Brown (#8B6F5E), Soft Gold (#D4A574), Gentle Sage (#B5C4B1)
- **Text Colors**: Charcoal (#3A3A3A) for body, Deep Burgundy for headings, Gold (#C4956A) for scripture refs
- **Fonts**: Serif fonts (Georgia-style) for elegance. Clean, readable, not cluttered
- **Style**: Minimalist, warm, intimate, elegant. Think hand-written letter aesthetic meets modern design
- **Mood**: Soft, safe, sacred. Like a quiet morning with coffee and your Bible
- **NEVER**: Neon colors, harsh contrasts, cluttered designs, salesy graphics, generic stock photo feel

## Design Types

### CAROUSEL (1080x1350px, multiple slides)
- Slide 1: Title slide — big title, small subtitle, brand watermark
- Middle slides: Content — one key point per slide, large readable text
- Last slide: Scripture + CTA ("Save this", "Follow @jesusforeveryours")
- Max 10 slides. Consistent colors across all slides.

### QUOTE GRAPHIC (1080x1080px, single)
- Centered text, elegant layout
- Scripture reference at bottom
- Brand watermark subtle in corner
- Perfect for Love Notes

### STORY (1080x1920px, vertical)
- Full-screen vertical
- Text centered with breathing room
- Can have multiple story slides for series

### THUMBNAIL (1280x720px, landscape)
- YouTube thumbnail or blog header
- Bold text, clear at small sizes
- Rose's face placeholder area if needed

### POST (1080x1080px, single)
- General Instagram post
- Can be quote, announcement, testimonial, etc.

## CRITICAL: Response Format
You MUST respond with a JSON design plan. This is what gets rendered into actual images.

\`\`\`json
{
  "type": "carousel|quote|story|thumbnail|post",
  "theme": "light|dark|pink|sage|burgundy",
  "slides": [
    {
      "layout": "title|body|scripture|cta|split",
      "title": "optional title text",
      "body": "the main text content for this slide",
      "scripture": "optional scripture text",
      "scriptureRef": "optional reference like John 3:16 NLT",
      "accent": "optional small accent text (subtitle, label, etc.)",
      "cta": "optional call-to-action text"
    }
  ],
  "designNotes": "Brief notes about the design direction for Rose"
}
\`\`\`

## Rules
1. Keep text SHORT per slide — Instagram users scan, not read. Max 40 words per slide.
2. One idea per slide. Don't cram.
3. Title slides should be PUNCHY — 2-5 words that make someone stop scrolling
4. Scripture should always include the full verse text AND reference
5. Use Rose's voice — intimate, warm, like a handwritten letter
6. Every carousel ends with a CTA slide
7. Colors should be warm and soft — NEVER harsh or cold
8. Leave breathing room — white space is your friend
9. Brand watermark (@jesusforeveryours) on every graphic, small and subtle`,
      messages: [
        {
          role: "user",
          content: `Create a design plan for: ${briefOrContext}`,
        },
      ],
    });

    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  private async renderFromPlan(planText: string): Promise<string> {
    // Extract JSON from the response
    const jsonMatch = planText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      // Try parsing the whole thing as JSON
      try {
        const plan = JSON.parse(planText);
        return this.renderDesign(plan, planText);
      } catch {
        return `**Iris's Design Brief**\n\n${planText}\n\n*Note: Could not auto-generate images from this plan. Use the brief above to create in Canva.*`;
      }
    }

    try {
      const plan = JSON.parse(jsonMatch[1]);
      return this.renderDesign(plan, planText);
    } catch (err) {
      return `**Iris's Design Brief**\n\n${planText}\n\n*Note: JSON parsing failed — use the brief above to create in Canva.*`;
    }
  }

  private async renderDesign(
    plan: {
      type: string;
      theme?: string;
      slides: Array<{
        layout?: string;
        title?: string;
        body?: string;
        scripture?: string;
        scriptureRef?: string;
        accent?: string;
        cta?: string;
      }>;
      designNotes?: string;
    },
    rawPlan: string
  ): Promise<string> {
    const dims = this.getDimensions(plan.type);
    const theme = this.getTheme(plan.theme || "light");
    const timestamp = Date.now();
    const files: string[] = [];

    for (let i = 0; i < plan.slides.length; i++) {
      const slide = plan.slides[i];
      const canvas = createCanvas(dims.width, dims.height);
      const ctx = canvas.getContext("2d");

      // Draw background
      this.drawBackground(ctx, dims.width, dims.height, theme, slide.layout || "body");

      // Draw content based on layout
      const layout = slide.layout || "body";
      switch (layout) {
        case "title":
          this.drawTitleSlide(ctx, dims, theme, slide);
          break;
        case "scripture":
          this.drawScriptureSlide(ctx, dims, theme, slide);
          break;
        case "cta":
          this.drawCtaSlide(ctx, dims, theme, slide);
          break;
        default:
          this.drawBodySlide(ctx, dims, theme, slide);
      }

      // Add watermark
      this.drawWatermark(ctx, dims, theme);

      // Save to file
      const filename = `${plan.type}_${timestamp}_slide${i + 1}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filepath, buffer);
      files.push(filepath);
    }

    // Build response
    let response = `**Iris's Design — ${plan.slides.length} graphic(s) created**\n\n`;
    response += `Type: **${plan.type.toUpperCase()}** | Theme: **${plan.theme || "light"}** | Size: **${dims.width}x${dims.height}px**\n\n`;
    response += `**Files saved to \`designs/\` folder:**\n`;
    for (const f of files) {
      response += `- \`${path.basename(f)}\`\n`;
    }
    if (plan.designNotes) {
      response += `\n**Design Notes:** ${plan.designNotes}\n`;
    }
    response += `\n**Ready to post!** Upload these directly to Instagram, no editing needed.`;

    return response;
  }

  private getDimensions(type: string): { width: number; height: number } {
    switch (type) {
      case "carousel":
        return { width: 1080, height: 1350 };
      case "story":
        return { width: 1080, height: 1920 };
      case "thumbnail":
        return { width: 1280, height: 720 };
      case "quote":
      case "post":
      default:
        return { width: 1080, height: 1080 };
    }
  }

  private getTheme(name: string): {
    bg: string;
    bgSecondary: string;
    title: string;
    body: string;
    accent: string;
    scripture: string;
    watermark: string;
    decorLine: string;
  } {
    switch (name) {
      case "dark":
        return {
          bg: BRAND_COLORS.charcoal,
          bgSecondary: "#4A4A4A",
          title: BRAND_COLORS.lightText,
          body: "#E8E0D8",
          accent: BRAND_COLORS.softGold,
          scripture: BRAND_COLORS.scriptureGold,
          watermark: "rgba(255,255,255,0.15)",
          decorLine: BRAND_COLORS.softGold,
        };
      case "pink":
        return {
          bg: BRAND_COLORS.softPink,
          bgSecondary: BRAND_COLORS.blushPink,
          title: BRAND_COLORS.deepBurgundy,
          body: BRAND_COLORS.darkText,
          accent: BRAND_COLORS.dustyRose,
          scripture: BRAND_COLORS.scriptureGold,
          watermark: "rgba(107,45,62,0.12)",
          decorLine: BRAND_COLORS.dustyRose,
        };
      case "sage":
        return {
          bg: "#F0F4EE",
          bgSecondary: BRAND_COLORS.gentleSage,
          title: "#3A4A3A",
          body: BRAND_COLORS.darkText,
          accent: BRAND_COLORS.gentleSage,
          scripture: "#6B7B6B",
          watermark: "rgba(58,74,58,0.12)",
          decorLine: BRAND_COLORS.gentleSage,
        };
      case "burgundy":
        return {
          bg: BRAND_COLORS.deepBurgundy,
          bgSecondary: "#8B3D52",
          title: BRAND_COLORS.lightText,
          body: "#F5E6E0",
          accent: BRAND_COLORS.softGold,
          scripture: BRAND_COLORS.softGold,
          watermark: "rgba(255,255,255,0.12)",
          decorLine: BRAND_COLORS.softGold,
        };
      case "light":
      default:
        return {
          bg: BRAND_COLORS.cream,
          bgSecondary: BRAND_COLORS.softPink,
          title: BRAND_COLORS.deepBurgundy,
          body: BRAND_COLORS.darkText,
          accent: BRAND_COLORS.dustyRose,
          scripture: BRAND_COLORS.scriptureGold,
          watermark: "rgba(107,45,62,0.10)",
          decorLine: BRAND_COLORS.dustyRose,
        };
    }
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    theme: ReturnType<typeof this.getTheme>,
    layout: string
  ): void {
    // Solid background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle gradient overlay for depth
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(255,255,255,0.05)");
    grad.addColorStop(1, "rgba(0,0,0,0.03)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative elements
    if (layout === "title" || layout === "cta") {
      // Top and bottom decorative lines
      ctx.strokeStyle = theme.decorLine;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;

      // Top line
      const margin = w * 0.15;
      ctx.beginPath();
      ctx.moveTo(margin, h * 0.12);
      ctx.lineTo(w - margin, h * 0.12);
      ctx.stroke();

      // Bottom line
      ctx.beginPath();
      ctx.moveTo(margin, h * 0.88);
      ctx.lineTo(w - margin, h * 0.88);
      ctx.stroke();

      ctx.globalAlpha = 1;
    }

    // Small decorative dot/diamond in corners for elegance
    ctx.fillStyle = theme.decorLine;
    ctx.globalAlpha = 0.15;
    const dotSize = 6;

    // Top-left corner cluster
    ctx.beginPath();
    ctx.arc(w * 0.08, h * 0.06, dotSize, 0, Math.PI * 2);
    ctx.fill();

    // Bottom-right corner cluster
    ctx.beginPath();
    ctx.arc(w * 0.92, h * 0.94, dotSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  private drawTitleSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ReturnType<typeof this.getTheme>,
    slide: { title?: string; body?: string; accent?: string }
  ): void {
    const w = dims.width;
    const h = dims.height;
    const padding = w * 0.12;

    // Accent label (small text above title)
    if (slide.accent) {
      ctx.fillStyle = theme.accent;
      ctx.font = `italic ${Math.floor(w * 0.032)}px ${FONTS.accent}`;
      ctx.textAlign = "center";
      ctx.fillText(slide.accent.toUpperCase(), w / 2, h * 0.35);
    }

    // Title (big, bold)
    if (slide.title) {
      ctx.fillStyle = theme.title;
      ctx.font = `bold ${Math.floor(w * 0.075)}px ${FONTS.heading}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.title, w / 2, h * 0.45, w - padding * 2, Math.floor(w * 0.09));
    }

    // Subtitle / body (smaller text below)
    if (slide.body) {
      ctx.fillStyle = theme.body;
      ctx.font = `${Math.floor(w * 0.035)}px ${FONTS.body}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.body, w / 2, h * 0.62, w - padding * 2, Math.floor(w * 0.05));
    }

    // Decorative divider between title and body
    ctx.strokeStyle = theme.decorLine;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.55);
    ctx.lineTo(w * 0.65, h * 0.55);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawBodySlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ReturnType<typeof this.getTheme>,
    slide: { title?: string; body?: string; scripture?: string; scriptureRef?: string }
  ): void {
    const w = dims.width;
    const h = dims.height;
    const padding = w * 0.12;

    let yPos = h * 0.18;

    // Small title/heading if present
    if (slide.title) {
      ctx.fillStyle = theme.title;
      ctx.font = `bold ${Math.floor(w * 0.05)}px ${FONTS.heading}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.title, w / 2, yPos, w - padding * 2, Math.floor(w * 0.065));
      yPos += Math.floor(w * 0.08);
    }

    // Main body text
    if (slide.body) {
      ctx.fillStyle = theme.body;
      ctx.font = `${Math.floor(w * 0.04)}px ${FONTS.body}`;
      ctx.textAlign = "center";
      const lines = this.wrapText(ctx, slide.body, w / 2, yPos, w - padding * 2, Math.floor(w * 0.058));
      yPos += lines * Math.floor(w * 0.058) + Math.floor(w * 0.04);
    }

    // Scripture at bottom
    if (slide.scripture) {
      ctx.fillStyle = theme.body;
      ctx.font = `italic ${Math.floor(w * 0.033)}px ${FONTS.scripture}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, `"${slide.scripture}"`, w / 2, h * 0.75, w - padding * 2, Math.floor(w * 0.048));
    }
    if (slide.scriptureRef) {
      ctx.fillStyle = theme.scripture;
      ctx.font = `${Math.floor(w * 0.028)}px ${FONTS.scripture}`;
      ctx.textAlign = "center";
      ctx.fillText(`— ${slide.scriptureRef}`, w / 2, h * 0.87);
    }
  }

  private drawScriptureSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ReturnType<typeof this.getTheme>,
    slide: { scripture?: string; scriptureRef?: string; body?: string }
  ): void {
    const w = dims.width;
    const h = dims.height;
    const padding = w * 0.14;

    // Large opening quote mark
    ctx.fillStyle = theme.decorLine;
    ctx.globalAlpha = 0.2;
    ctx.font = `${Math.floor(w * 0.2)}px ${FONTS.heading}`;
    ctx.textAlign = "center";
    ctx.fillText("\u201C", w / 2, h * 0.25);
    ctx.globalAlpha = 1;

    // Scripture text (centered, elegant)
    const scriptureText = slide.scripture || slide.body || "";
    ctx.fillStyle = theme.body;
    ctx.font = `italic ${Math.floor(w * 0.042)}px ${FONTS.scripture}`;
    ctx.textAlign = "center";
    this.wrapText(ctx, scriptureText, w / 2, h * 0.38, w - padding * 2, Math.floor(w * 0.06));

    // Reference
    if (slide.scriptureRef) {
      ctx.fillStyle = theme.scripture;
      ctx.font = `bold ${Math.floor(w * 0.03)}px ${FONTS.scripture}`;
      ctx.textAlign = "center";
      ctx.fillText(slide.scriptureRef, w / 2, h * 0.78);
    }

    // Decorative line under scripture
    ctx.strokeStyle = theme.decorLine;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.72);
    ctx.lineTo(w * 0.7, h * 0.72);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawCtaSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ReturnType<typeof this.getTheme>,
    slide: { title?: string; body?: string; cta?: string }
  ): void {
    const w = dims.width;
    const h = dims.height;
    const padding = w * 0.12;

    // CTA heading
    if (slide.title || slide.cta) {
      ctx.fillStyle = theme.title;
      ctx.font = `bold ${Math.floor(w * 0.055)}px ${FONTS.heading}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.title || slide.cta || "", w / 2, h * 0.38, w - padding * 2, Math.floor(w * 0.07));
    }

    // Body text
    if (slide.body) {
      ctx.fillStyle = theme.body;
      ctx.font = `${Math.floor(w * 0.035)}px ${FONTS.body}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.body, w / 2, h * 0.52, w - padding * 2, Math.floor(w * 0.05));
    }

    // CTA button-style element
    if (slide.cta) {
      const btnY = h * 0.68;
      const btnW = w * 0.5;
      const btnH = h * 0.06;
      const btnX = (w - btnW) / 2;
      const radius = btnH / 2;

      // Rounded rectangle button
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.moveTo(btnX + radius, btnY);
      ctx.lineTo(btnX + btnW - radius, btnY);
      ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + radius);
      ctx.lineTo(btnX + btnW, btnY + btnH - radius);
      ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - radius, btnY + btnH);
      ctx.lineTo(btnX + radius, btnY + btnH);
      ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - radius);
      ctx.lineTo(btnX, btnY + radius);
      ctx.quadraticCurveTo(btnX, btnY, btnX + radius, btnY);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Button border
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Button text
      ctx.fillStyle = theme.title;
      ctx.font = `${Math.floor(w * 0.028)}px ${FONTS.accent}`;
      ctx.textAlign = "center";
      ctx.fillText(slide.cta.toUpperCase(), w / 2, btnY + btnH * 0.65);
    }
  }

  private drawWatermark(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ReturnType<typeof this.getTheme>
  ): void {
    ctx.fillStyle = theme.watermark;
    ctx.font = `${Math.floor(dims.width * 0.022)}px ${FONTS.accent}`;
    ctx.textAlign = "center";
    ctx.fillText("@jesusforeveryours", dims.width / 2, dims.height * 0.96);
  }

  /**
   * Wrap text and draw it, returns number of lines drawn.
   */
  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number {
    const words = text.split(" ");
    let line = "";
    let lineCount = 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
        line = words[i] + " ";
        lineCount++;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
    return lineCount + 1;
  }

  clearHistory(): void {
    // No history to clear for designer
  }
}
