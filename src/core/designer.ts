import Anthropic from "@anthropic-ai/sdk";
import { createCanvas, registerFont, CanvasRenderingContext2D } from "canvas";
import * as fs from "fs";
import * as path from "path";
import { BrandConfig } from "../config/brand.js";

// Rose's brand color palette — matches brand-references/notes.md
const BRAND_COLORS = {
  // Backgrounds (from Rose's reference guide)
  babyBlue: "#D6E4F0",
  charcoal: "#3A3A3A",
  blushPink: "#E8CFC4",
  palePink: "#F5E4E0",
  warmBeige: "#E8E2D8",
  warmTan: "#C8BFB2",
  dustyMauve: "#9E8B8E",
  roseBrown: "#8B5E5E",
  pinkLinen: "#E8A0A0",
  white: "#FFFFFF",
  cream: "#F5F0EA",
  // Text colors (from Rose's reference guide)
  richBlack: "#1A1A1A",
  softGray: "#B0A8A0",
  deepRed: "#C0392B",
  royalBlue: "#1A4DAF",
  warmBrown: "#6B3A1F",
  darkBrown: "#4A2C17",
  orange: "#F28C28",
  softPink: "#F0B8C8",
  yellowGlow: "#FFD700",
  // Functional
  darkText: "#1A1A1A",
  lightText: "#FFFFFF",
};

// Custom font directory — drop .ttf or .otf files here
const FONTS_DIR = path.join(process.cwd(), "fonts");

// Default brand font — Boston Angel Medium
const BRAND_FONT = "Boston Angel";
const FALLBACK_FONT = "Georgia";

// Register custom fonts from fonts/ directory
function loadCustomFonts(): boolean {
  if (!fs.existsSync(FONTS_DIR)) {
    fs.mkdirSync(FONTS_DIR, { recursive: true });
    return false;
  }

  let loaded = false;
  const fontFiles = fs.readdirSync(FONTS_DIR).filter(
    (f) => f.endsWith(".ttf") || f.endsWith(".otf") || f.endsWith(".woff")
  );

  for (const file of fontFiles) {
    const fontPath = path.join(FONTS_DIR, file);
    const name = file.replace(/\.(ttf|otf|woff)$/, "");

    // Detect weight/style from filename
    const isItalic = /italic/i.test(name);
    const isBold = /bold/i.test(name);
    const weight = isBold ? "bold" : "normal";
    const style = isItalic ? "italic" : "normal";

    // Use the brand font family name for Boston Angel variants
    const family = /boston.?angel/i.test(name) ? BRAND_FONT : name;

    try {
      registerFont(fontPath, { family, weight, style });
      console.log(`  [Iris] Loaded font: ${family} (${weight} ${style}) from ${file}`);
      loaded = true;
    } catch (err) {
      console.log(`  [Iris] Warning: Could not load font ${file}`);
    }
  }

  return loaded;
}

// Try to load custom fonts at startup
const hasCustomFonts = loadCustomFonts();

// Font configuration — uses Boston Angel if available, falls back to Georgia
const FONTS = {
  heading: hasCustomFonts ? BRAND_FONT : FALLBACK_FONT,
  body: hasCustomFonts ? BRAND_FONT : FALLBACK_FONT,
  scripture: hasCustomFonts ? BRAND_FONT : FALLBACK_FONT,
  accent: hasCustomFonts ? BRAND_FONT : FALLBACK_FONT,
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
  text: string;
  files: string[];
  designBrief: string;
}

const OUTPUT_DIR = path.join(process.cwd(), "designs");

// Brand references directory — style guide + reference images live here
const BRAND_REF_DIR = path.join(process.cwd(), "brand-references");

/**
 * Load the brand style guide and any custom style notes Rose has added.
 * Iris uses these to match Rose's actual visual preferences.
 */
function loadStyleGuide(): string {
  let guide = "";

  // Load main style guide (notes.md)
  const notesPath = path.join(BRAND_REF_DIR, "notes.md");
  if (fs.existsSync(notesPath)) {
    guide += fs.readFileSync(notesPath, "utf-8");
    console.log("  [Iris] Loaded brand style guide from brand-references/notes.md");
  }

  // Load Rose's custom style preferences (my-styles.md) — she can drop new styles here anytime
  const myStylesPath = path.join(BRAND_REF_DIR, "my-styles.md");
  if (fs.existsSync(myStylesPath)) {
    const custom = fs.readFileSync(myStylesPath, "utf-8");
    if (custom.trim()) {
      guide += "\n\n---\n\n# Rose's Custom Style Preferences (HIGHEST PRIORITY — override everything above)\n\n" + custom;
      console.log("  [Iris] Loaded Rose's custom styles from brand-references/my-styles.md");
    }
  }

  // List reference images so Iris knows what examples exist
  if (fs.existsSync(BRAND_REF_DIR)) {
    const images = fs.readdirSync(BRAND_REF_DIR).filter(
      (f) => /\.(jpg|jpeg|png|webp)$/i.test(f)
    );
    if (images.length > 0) {
      guide += `\n\n---\n\n# Reference Images Available\nRose has ${images.length} reference design images in the brand-references/ folder:\n`;
      for (const img of images) {
        guide += `- ${img}\n`;
      }
      guide += "\nThese represent the EXACT style Rose wants. Match this aesthetic closely.\n";
    }
  }

  return guide;
}

const styleGuide = loadStyleGuide();

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

    if (!hasCustomFonts) {
      console.log(`  [Iris] No custom fonts found. Using ${FALLBACK_FONT} as fallback.`);
      console.log(`  [Iris] To use Boston Angel Medium: drop the .ttf/.otf file into the fonts/ folder.`);
    }
  }

  /**
   * Main entry: takes a content request, generates design brief via AI,
   * then renders the actual images.
   */
  async design(briefOrContext: string): Promise<DesignResult> {
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

## Rose's Accounts
- **@roserenuu** — 144K followers, Rose's personal creator account (PRIMARY — grow this first)
- **@jesusforeveryours** — ~8K followers, brand/ministry page (secondary)

## The Team
- Eden (Content Creator) writes the text — you make it BEAUTIFUL
- Selah (QA Reviewer) checks everything
- Mara (Scheduler) plans when to post
- Navi (Analytics) reads the data — FOLLOW HER DIRECTIVES on which visual styles perform best

${styleGuide ? `## ROSE'S BRAND STYLE GUIDE (READ THIS CAREFULLY — THIS IS HER ACTUAL STYLE)\n\n${styleGuide}\n\n` : ""}## CRITICAL: Response Format
You MUST respond with a JSON design plan. This is what gets rendered into actual images.

Available themes: light, dark, blush, pink, blue, beige, mauve, rosebrown, cream

\`\`\`json
{
  "type": "carousel|quote|story|thumbnail|post",
  "theme": "light|dark|blush|pink|blue|beige|mauve|rosebrown|cream",
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
1. FOLLOW THE STYLE GUIDE ABOVE — it represents Rose's ACTUAL preferred aesthetic. Match it exactly.
2. Keep text SHORT per slide — Instagram users scan, not read. Max 40 words per slide.
3. One idea per slide. Don't cram.
4. Title slides should be PUNCHY — 2-5 words that make someone stop scrolling
5. Scripture should always include the full verse text AND reference
6. Use Rose's voice — intimate, warm, like a handwritten letter
7. Vary slide count: short (3-4), medium (5-6), long (7-8). Never repeat the same format back to back.
8. Every slide must look DIFFERENT — vary layout, font weight, background shade, text size
9. Colors should be warm and soft — NEVER harsh or cold
10. Leave breathing room — whitespace is your friend
11. NO watermarks — Rose uses these designs across multiple accounts
12. Use lowercase for softness, UPPERCASE for power, as described in the style guide
13. Design patterns to use: repetition style, centered minimal, mixed weight, pattern interrupts
14. JUST TEXT — no decorative lines, no shapes, no pill buttons, no dots, no dividers. Clean text on a clean background. That's Rose's style.
15. ALL text must be centered in the middle of the slide — vertically AND horizontally. Generous whitespace around everything.`,
      messages: [
        {
          role: "user",
          content: `Create a design plan for: ${briefOrContext}`,
        },
      ],
    });

    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  private async renderFromPlan(planText: string): Promise<DesignResult> {
    // Extract JSON from the response
    const jsonMatch = planText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      // Try parsing the whole thing as JSON
      try {
        const plan = JSON.parse(planText);
        return this.renderDesign(plan, planText);
      } catch {
        return { text: `**Iris's Design Brief**\n\n${planText}\n\n*Note: Could not auto-generate images from this plan. Use the brief above to create in Canva.*`, files: [], designBrief: planText };
      }
    }

    try {
      const plan = JSON.parse(jsonMatch[1]);
      return this.renderDesign(plan, planText);
    } catch (err) {
      return { text: `**Iris's Design Brief**\n\n${planText}\n\n*Note: JSON parsing failed — use the brief above to create in Canva.*`, files: [], designBrief: planText };
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
  ): Promise<DesignResult> {
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

      // No watermark — Rose uses these designs across accounts

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

    return { text: response, files, designBrief: rawPlan };
  }

  private getDimensions(type: string): { width: number; height: number } {
    switch (type) {
      case "carousel":
        return { width: 1080, height: 1440 };
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
    // Themes based on Rose's brand-references/notes.md color palette
    switch (name) {
      case "dark":
        return {
          bg: BRAND_COLORS.charcoal,
          bgSecondary: "#4A4A4A",
          title: BRAND_COLORS.lightText,
          body: "#E8E0D8",
          accent: BRAND_COLORS.yellowGlow,
          scripture: BRAND_COLORS.softPink,
          watermark: "rgba(255,255,255,0.15)",
          decorLine: BRAND_COLORS.softPink,
        };
      case "blush":
        return {
          bg: BRAND_COLORS.blushPink,
          bgSecondary: BRAND_COLORS.palePink,
          title: BRAND_COLORS.darkBrown,
          body: BRAND_COLORS.richBlack,
          accent: BRAND_COLORS.roseBrown,
          scripture: BRAND_COLORS.warmBrown,
          watermark: "rgba(75,44,23,0.12)",
          decorLine: BRAND_COLORS.roseBrown,
        };
      case "pink":
        return {
          bg: BRAND_COLORS.palePink,
          bgSecondary: BRAND_COLORS.blushPink,
          title: BRAND_COLORS.darkBrown,
          body: BRAND_COLORS.richBlack,
          accent: BRAND_COLORS.roseBrown,
          scripture: BRAND_COLORS.warmBrown,
          watermark: "rgba(75,44,23,0.12)",
          decorLine: BRAND_COLORS.pinkLinen,
        };
      case "blue":
        return {
          bg: BRAND_COLORS.babyBlue,
          bgSecondary: "#C4D6E8",
          title: BRAND_COLORS.royalBlue,
          body: BRAND_COLORS.richBlack,
          accent: BRAND_COLORS.royalBlue,
          scripture: BRAND_COLORS.royalBlue,
          watermark: "rgba(26,77,175,0.12)",
          decorLine: BRAND_COLORS.royalBlue,
        };
      case "beige":
        return {
          bg: BRAND_COLORS.warmBeige,
          bgSecondary: BRAND_COLORS.warmTan,
          title: BRAND_COLORS.darkBrown,
          body: BRAND_COLORS.richBlack,
          accent: BRAND_COLORS.warmBrown,
          scripture: BRAND_COLORS.warmBrown,
          watermark: "rgba(75,44,23,0.10)",
          decorLine: BRAND_COLORS.warmBrown,
        };
      case "mauve":
        return {
          bg: BRAND_COLORS.dustyMauve,
          bgSecondary: BRAND_COLORS.roseBrown,
          title: BRAND_COLORS.lightText,
          body: "#F5E4E0",
          accent: BRAND_COLORS.pinkLinen,
          scripture: BRAND_COLORS.softPink,
          watermark: "rgba(255,255,255,0.12)",
          decorLine: BRAND_COLORS.pinkLinen,
        };
      case "rosebrown":
        return {
          bg: BRAND_COLORS.roseBrown,
          bgSecondary: BRAND_COLORS.dustyMauve,
          title: BRAND_COLORS.lightText,
          body: "#F5E4E0",
          accent: BRAND_COLORS.yellowGlow,
          scripture: BRAND_COLORS.softPink,
          watermark: "rgba(255,255,255,0.12)",
          decorLine: BRAND_COLORS.softPink,
        };
      case "cream":
      case "light":
      default:
        return {
          bg: BRAND_COLORS.cream,
          bgSecondary: BRAND_COLORS.palePink,
          title: BRAND_COLORS.darkBrown,
          body: BRAND_COLORS.richBlack,
          accent: BRAND_COLORS.warmBrown,
          scripture: BRAND_COLORS.warmBrown,
          watermark: "rgba(75,44,23,0.10)",
          decorLine: BRAND_COLORS.warmBrown,
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

    // Clean background — no decorative elements, just text
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
    const maxWidth = w - padding * 2;
    const gap = h * 0.04;

    const accentFontSize = Math.floor(w * 0.032);
    const titleFontSize = Math.floor(w * 0.075);
    const titleLineH = Math.floor(w * 0.09);
    const bodyFontSize = Math.floor(w * 0.035);
    const bodyLineH = Math.floor(w * 0.05);

    // Measure total content height for vertical centering
    let totalHeight = 0;
    let accentH = 0, titleH = 0, bodyH = 0;

    if (slide.accent) {
      accentH = accentFontSize;
      totalHeight += accentH;
    }
    if (slide.title) {
      ctx.font = `bold ${titleFontSize}px ${FONTS.heading}`;
      const lines = this.measureWrappedText(ctx, slide.title, maxWidth);
      titleH = lines * titleLineH;
      if (totalHeight > 0) totalHeight += gap;
      totalHeight += titleH;
    }
    if (slide.body) {
      ctx.font = `${bodyFontSize}px ${FONTS.body}`;
      const lines = this.measureWrappedText(ctx, slide.body, maxWidth);
      bodyH = lines * bodyLineH;
      if (totalHeight > 0) totalHeight += gap;
      totalHeight += bodyH;
    }

    // Center vertically
    let y = (h - totalHeight) / 2;

    if (slide.accent) {
      ctx.fillStyle = theme.accent;
      ctx.font = `italic ${accentFontSize}px ${FONTS.accent}`;
      ctx.textAlign = "center";
      ctx.fillText(slide.accent.toUpperCase(), w / 2, y + accentFontSize * 0.8);
      y += accentH + gap;
    }

    if (slide.title) {
      ctx.fillStyle = theme.title;
      ctx.font = `bold ${titleFontSize}px ${FONTS.heading}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.title, w / 2, y + titleLineH * 0.8, maxWidth, titleLineH);
      y += titleH + gap;
    }

    if (slide.body) {
      ctx.fillStyle = theme.body;
      ctx.font = `${bodyFontSize}px ${FONTS.body}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.body, w / 2, y + bodyLineH * 0.8, maxWidth, bodyLineH);
    }
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
    const maxWidth = w - padding * 2;
    const gap = h * 0.04;

    const titleFontSize = Math.floor(w * 0.05);
    const titleLineH = Math.floor(w * 0.065);
    const bodyFontSize = Math.floor(w * 0.04);
    const bodyLineH = Math.floor(w * 0.058);
    const scriptureFontSize = Math.floor(w * 0.033);
    const scriptureLineH = Math.floor(w * 0.048);
    const refFontSize = Math.floor(w * 0.028);

    // Measure total content height for vertical centering
    let totalHeight = 0;
    let titleH = 0, bodyH = 0, scriptureH = 0, refH = 0;

    if (slide.title) {
      ctx.font = `bold ${titleFontSize}px ${FONTS.heading}`;
      const lines = this.measureWrappedText(ctx, slide.title, maxWidth);
      titleH = lines * titleLineH;
      totalHeight += titleH;
    }
    if (slide.body) {
      ctx.font = `${bodyFontSize}px ${FONTS.body}`;
      const lines = this.measureWrappedText(ctx, slide.body, maxWidth);
      bodyH = lines * bodyLineH;
      if (totalHeight > 0) totalHeight += gap;
      totalHeight += bodyH;
    }
    if (slide.scripture) {
      ctx.font = `italic ${scriptureFontSize}px ${FONTS.scripture}`;
      const lines = this.measureWrappedText(ctx, `"${slide.scripture}"`, maxWidth);
      scriptureH = lines * scriptureLineH;
      if (totalHeight > 0) totalHeight += gap;
      totalHeight += scriptureH;
    }
    if (slide.scriptureRef) {
      refH = refFontSize;
      if (totalHeight > 0) totalHeight += gap * 0.5;
      totalHeight += refH;
    }

    // Center vertically
    let y = (h - totalHeight) / 2;

    if (slide.title) {
      ctx.fillStyle = theme.title;
      ctx.font = `bold ${titleFontSize}px ${FONTS.heading}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.title, w / 2, y + titleLineH * 0.8, maxWidth, titleLineH);
      y += titleH + gap;
    }

    if (slide.body) {
      ctx.fillStyle = theme.body;
      ctx.font = `${bodyFontSize}px ${FONTS.body}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.body, w / 2, y + bodyLineH * 0.8, maxWidth, bodyLineH);
      y += bodyH + gap;
    }

    if (slide.scripture) {
      ctx.fillStyle = theme.body;
      ctx.font = `italic ${scriptureFontSize}px ${FONTS.scripture}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, `"${slide.scripture}"`, w / 2, y + scriptureLineH * 0.8, maxWidth, scriptureLineH);
      y += scriptureH + gap * 0.5;
    }

    if (slide.scriptureRef) {
      ctx.fillStyle = theme.scripture;
      ctx.font = `${refFontSize}px ${FONTS.scripture}`;
      ctx.textAlign = "center";
      ctx.fillText(`— ${slide.scriptureRef}`, w / 2, y + refFontSize * 0.8);
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
    const maxWidth = w - padding * 2;
    const gap = h * 0.04;

    const scriptureFontSize = Math.floor(w * 0.042);
    const scriptureLineH = Math.floor(w * 0.06);
    const refFontSize = Math.floor(w * 0.03);

    const scriptureText = slide.scripture || slide.body || "";

    // Measure total content height for vertical centering
    let totalHeight = 0;
    let scriptureH = 0, refH = 0;

    if (scriptureText) {
      ctx.font = `italic ${scriptureFontSize}px ${FONTS.scripture}`;
      const lines = this.measureWrappedText(ctx, scriptureText, maxWidth);
      scriptureH = lines * scriptureLineH;
      totalHeight += scriptureH;
    }
    if (slide.scriptureRef) {
      refH = refFontSize;
      if (totalHeight > 0) totalHeight += gap;
      totalHeight += refH;
    }

    // Center vertically
    let y = (h - totalHeight) / 2;

    if (scriptureText) {
      ctx.fillStyle = theme.body;
      ctx.font = `italic ${scriptureFontSize}px ${FONTS.scripture}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, scriptureText, w / 2, y + scriptureLineH * 0.8, maxWidth, scriptureLineH);
      y += scriptureH + gap;
    }

    if (slide.scriptureRef) {
      ctx.fillStyle = theme.scripture;
      ctx.font = `bold ${refFontSize}px ${FONTS.scripture}`;
      ctx.textAlign = "center";
      ctx.fillText(slide.scriptureRef, w / 2, y + refFontSize * 0.8);
    }
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
    const maxWidth = w - padding * 2;
    const gap = h * 0.04;

    const headingFontSize = Math.floor(w * 0.055);
    const headingLineH = Math.floor(w * 0.07);
    const bodyFontSize = Math.floor(w * 0.035);
    const bodyLineH = Math.floor(w * 0.05);
    const ctaFontSize = Math.floor(w * 0.032);

    // Measure total content height for vertical centering
    let totalHeight = 0;
    let headingH = 0, bodyH = 0, ctaH = 0;

    const headingText = slide.title || slide.cta || "";
    if (headingText) {
      ctx.font = `bold ${headingFontSize}px ${FONTS.heading}`;
      const lines = this.measureWrappedText(ctx, headingText, maxWidth);
      headingH = lines * headingLineH;
      totalHeight += headingH;
    }
    if (slide.body) {
      ctx.font = `${bodyFontSize}px ${FONTS.body}`;
      const lines = this.measureWrappedText(ctx, slide.body, maxWidth);
      bodyH = lines * bodyLineH;
      if (totalHeight > 0) totalHeight += gap;
      totalHeight += bodyH;
    }
    if (slide.cta) {
      ctaH = ctaFontSize;
      if (totalHeight > 0) totalHeight += gap;
      totalHeight += ctaH;
    }

    // Center vertically
    let y = (h - totalHeight) / 2;

    if (headingText) {
      ctx.fillStyle = theme.title;
      ctx.font = `bold ${headingFontSize}px ${FONTS.heading}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, headingText, w / 2, y + headingLineH * 0.8, maxWidth, headingLineH);
      y += headingH + gap;
    }

    if (slide.body) {
      ctx.fillStyle = theme.body;
      ctx.font = `${bodyFontSize}px ${FONTS.body}`;
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.body, w / 2, y + bodyLineH * 0.8, maxWidth, bodyLineH);
      y += bodyH + gap;
    }

    // CTA as plain text — no button/pill shape
    if (slide.cta) {
      ctx.fillStyle = theme.accent;
      ctx.font = `${ctaFontSize}px ${FONTS.accent}`;
      ctx.textAlign = "center";
      ctx.fillText(slide.cta.toUpperCase(), w / 2, y + ctaFontSize * 0.8);
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
    ctx.fillText("@roserenuu", dims.width / 2, dims.height * 0.96);
  }

  /**
   * Measure how many lines wrapped text will take without drawing.
   */
  private measureWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): number {
    const words = text.split(" ");
    let line = "";
    let lineCount = 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        line = words[i] + " ";
        lineCount++;
      } else {
        line = testLine;
      }
    }
    return lineCount + 1;
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
