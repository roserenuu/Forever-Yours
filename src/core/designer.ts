import Anthropic from "@anthropic-ai/sdk";
import { createCanvas, registerFont, CanvasRenderingContext2D } from "canvas";
import * as fs from "fs";
import * as path from "path";
import { BrandConfig } from "../config/brand.js";

// ─────────────────────────────────────────────────────────────────────────────
// Rose's brand color palette — matches brand-references/notes.md
// ─────────────────────────────────────────────────────────────────────────────
const BRAND_COLORS = {
  // Backgrounds
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
  // Text colors
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

// ─────────────────────────────────────────────────────────────────────────────
// Font system — 9 Google Font families matching Rose's style guide
// ─────────────────────────────────────────────────────────────────────────────
const FONTS_DIR = path.join(process.cwd(), "fonts");

const FONT_FAMILIES = {
  playfair: "Playfair Display",
  cormorant: "Cormorant Garamond",
  dancing: "Dancing Script",
  greatVibes: "Great Vibes",
  fraunces: "Fraunces",
  caveat: "Caveat",
  oswald: "Oswald",
  lora: "Lora",
  dmSerif: "DM Serif Display",
};

// Font style mapping — which font to use for which purpose (from notes.md)
type FontStyleKey = "editorial" | "delicate" | "script" | "formal" | "retro" | "handwritten" | "condensed" | "warm" | "display";
const FONT_STYLE_MAP: Record<FontStyleKey, { family: string; defaultWeight: string; defaultStyle: string }> = {
  editorial:   { family: FONT_FAMILIES.playfair,   defaultWeight: "bold",   defaultStyle: "normal" },
  delicate:    { family: FONT_FAMILIES.cormorant,   defaultWeight: "normal", defaultStyle: "italic" },
  script:      { family: FONT_FAMILIES.dancing,     defaultWeight: "normal", defaultStyle: "normal" },
  formal:      { family: FONT_FAMILIES.greatVibes,  defaultWeight: "normal", defaultStyle: "normal" },
  retro:       { family: FONT_FAMILIES.fraunces,    defaultWeight: "bold",   defaultStyle: "normal" },
  handwritten: { family: FONT_FAMILIES.caveat,      defaultWeight: "normal", defaultStyle: "normal" },
  condensed:   { family: FONT_FAMILIES.oswald,      defaultWeight: "bold",   defaultStyle: "normal" },
  warm:        { family: FONT_FAMILIES.lora,        defaultWeight: "normal", defaultStyle: "normal" },
  display:     { family: FONT_FAMILIES.dmSerif,     defaultWeight: "normal", defaultStyle: "normal" },
};

// Layout → default font style mapping (AI can override per slide)
const LAYOUT_FONT_DEFAULTS: Record<string, FontStyleKey> = {
  title: "editorial",
  body: "warm",
  scripture: "delicate",
  cta: "condensed",
  repetition: "editorial",
  highlight: "warm",
  whisper: "delicate",
  impact: "condensed",
  handwritten: "handwritten",
  script: "script",
};

const FALLBACK_FONT = "Georgia";

// Font registration — maps downloaded TTF files to family names
const FONT_REGISTRATIONS: Array<{ file: string; family: string; weight: string; style: string }> = [
  { file: "PlayfairDisplay.ttf",             family: FONT_FAMILIES.playfair,   weight: "bold",   style: "normal" },
  { file: "PlayfairDisplay-Italic.ttf",      family: FONT_FAMILIES.playfair,   weight: "bold",   style: "italic" },
  { file: "CormorantGaramond-LightItalic.ttf", family: FONT_FAMILIES.cormorant, weight: "normal", style: "italic" },
  { file: "CormorantGaramond-Italic.ttf",    family: FONT_FAMILIES.cormorant,  weight: "bold",   style: "italic" },
  { file: "DancingScript.ttf",               family: FONT_FAMILIES.dancing,    weight: "normal", style: "normal" },
  { file: "GreatVibes-Regular.ttf",          family: FONT_FAMILIES.greatVibes, weight: "normal", style: "normal" },
  { file: "Fraunces.ttf",                    family: FONT_FAMILIES.fraunces,   weight: "bold",   style: "normal" },
  { file: "Fraunces-Italic.ttf",             family: FONT_FAMILIES.fraunces,   weight: "bold",   style: "italic" },
  { file: "Caveat.ttf",                      family: FONT_FAMILIES.caveat,     weight: "normal", style: "normal" },
  { file: "Oswald.ttf",                      family: FONT_FAMILIES.oswald,     weight: "bold",   style: "normal" },
  { file: "Lora.ttf",                        family: FONT_FAMILIES.lora,       weight: "normal", style: "normal" },
  { file: "Lora-Italic.ttf",                 family: FONT_FAMILIES.lora,       weight: "normal", style: "italic" },
  { file: "DMSerifDisplay-Regular.ttf",      family: FONT_FAMILIES.dmSerif,    weight: "normal", style: "normal" },
  { file: "DMSerifDisplay-Italic.ttf",       family: FONT_FAMILIES.dmSerif,    weight: "normal", style: "italic" },
];

function loadBrandFonts(): Set<string> {
  const loaded = new Set<string>();
  if (!fs.existsSync(FONTS_DIR)) {
    fs.mkdirSync(FONTS_DIR, { recursive: true });
    return loaded;
  }

  for (const reg of FONT_REGISTRATIONS) {
    const fontPath = path.join(FONTS_DIR, reg.file);
    if (!fs.existsSync(fontPath)) continue;
    try {
      registerFont(fontPath, { family: reg.family, weight: reg.weight, style: reg.style });
      loaded.add(reg.family);
    } catch {
      // Skip fonts that fail to load
    }
  }

  // Also load any Boston Angel fonts Rose may have dropped in
  const extraFiles = fs.readdirSync(FONTS_DIR).filter(
    (f) => (f.endsWith(".ttf") || f.endsWith(".otf")) && /boston.?angel/i.test(f)
  );
  for (const file of extraFiles) {
    try {
      const isItalic = /italic/i.test(file);
      const isBold = /bold/i.test(file);
      registerFont(path.join(FONTS_DIR, file), {
        family: "Boston Angel",
        weight: isBold ? "bold" : "normal",
        style: isItalic ? "italic" : "normal",
      });
      loaded.add("Boston Angel");
    } catch { /* skip */ }
  }

  if (loaded.size > 0) {
    console.log(`  [Iris] Loaded ${loaded.size} brand font families: ${[...loaded].join(", ")}`);
  }
  return loaded;
}

const loadedFamilies = loadBrandFonts();

function fontFamily(style: FontStyleKey): string {
  const mapping = FONT_STYLE_MAP[style];
  return loadedFamilies.has(mapping.family) ? mapping.family : FALLBACK_FONT;
}

function fontString(style: FontStyleKey, sizePx: number, weightOverride?: string, styleOverride?: string): string {
  const mapping = FONT_STYLE_MAP[style];
  const weight = weightOverride || mapping.defaultWeight;
  const fStyle = styleOverride || mapping.defaultStyle;
  const family = fontFamily(style);
  const parts: string[] = [];
  if (fStyle === "italic") parts.push("italic");
  if (weight === "bold") parts.push("bold");
  parts.push(`${sizePx}px`);
  parts.push(family);
  return parts.join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Texture engine — procedural linen, paper grain, fabric effects
// ─────────────────────────────────────────────────────────────────────────────
type TextureType = "none" | "linen" | "paper" | "fabric";

function applyTexture(ctx: CanvasRenderingContext2D, w: number, h: number, texture: TextureType): void {
  if (texture === "none") return;

  // Use a seeded approach for consistent textures
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  switch (texture) {
    case "paper": {
      // Subtle random noise grain — like real paper
      for (let i = 0; i < data.length; i += 4) {
        const noise = (simpleRandom(i) - 0.5) * 12;
        data[i] = clamp(data[i] + noise);
        data[i + 1] = clamp(data[i + 1] + noise);
        data[i + 2] = clamp(data[i + 2] + noise);
      }
      break;
    }
    case "linen": {
      // Horizontal + vertical fiber lines
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const hFiber = (y % 3 === 0) ? -4 : 0;
          const vFiber = (x % 4 === 0) ? -3 : 0;
          const noise = (simpleRandom(idx) - 0.5) * 6;
          const delta = hFiber + vFiber + noise;
          data[idx] = clamp(data[idx] + delta);
          data[idx + 1] = clamp(data[idx + 1] + delta);
          data[idx + 2] = clamp(data[idx + 2] + delta);
        }
      }
      break;
    }
    case "fabric": {
      // Cross-hatch woven pattern
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const crossA = ((x + y) % 6 < 2) ? -5 : 0;
          const crossB = ((x - y + h) % 8 < 2) ? -3 : 0;
          const noise = (simpleRandom(idx) - 0.5) * 4;
          const delta = crossA + crossB + noise;
          data[idx] = clamp(data[idx] + delta);
          data[idx + 1] = clamp(data[idx + 1] + delta);
          data[idx + 2] = clamp(data[idx + 2] + delta);
        }
      }
      break;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function simpleRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Hex color utilities
// ─────────────────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
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

interface SlideData {
  layout?: string;
  fontStyle?: FontStyleKey;
  title?: string;
  body?: string;
  scripture?: string;
  scriptureRef?: string;
  accent?: string;
  cta?: string;
  highlight?: string;
  repeatPhrase?: string;
  repeatCount?: number;
}

interface DesignPlan {
  type: string;
  theme?: string;
  texture?: TextureType;
  slides: SlideData[];
  designNotes?: string;
}

interface ThemeColors {
  bg: string;
  bgSecondary: string;
  title: string;
  body: string;
  accent: string;
  scripture: string;
  highlightBg: string;
  decorLine: string;
}

const OUTPUT_DIR = path.join(process.cwd(), "designs");
const BRAND_REF_DIR = path.join(process.cwd(), "brand-references");

function loadStyleGuide(): string {
  let guide = "";

  const notesPath = path.join(BRAND_REF_DIR, "notes.md");
  if (fs.existsSync(notesPath)) {
    guide += fs.readFileSync(notesPath, "utf-8");
    console.log("  [Iris] Loaded brand style guide from brand-references/notes.md");
  }

  const myStylesPath = path.join(BRAND_REF_DIR, "my-styles.md");
  if (fs.existsSync(myStylesPath)) {
    const custom = fs.readFileSync(myStylesPath, "utf-8");
    if (custom.trim()) {
      guide += "\n\n---\n\n# Rose's Custom Style Preferences (HIGHEST PRIORITY — override everything above)\n\n" + custom;
      console.log("  [Iris] Loaded Rose's custom styles from brand-references/my-styles.md");
    }
  }

  if (fs.existsSync(BRAND_REF_DIR)) {
    const images = fs.readdirSync(BRAND_REF_DIR).filter(
      (f) => /\.(jpg|jpeg|png|webp)$/i.test(f)
    );
    if (images.length > 0) {
      guide += `\n\n---\n\n# Reference Images Available\nRose has ${images.length} reference design images in the brand-references/ folder:\n`;
      for (const img of images) guide += `- ${img}\n`;
      guide += "\nThese represent the EXACT style Rose wants. Match this aesthetic closely.\n";
    }
  }

  return guide;
}

const styleGuide = loadStyleGuide();

// ─────────────────────────────────────────────────────────────────────────────
// DesignerAgent — Iris
// ─────────────────────────────────────────────────────────────────────────────
export class DesignerAgent {
  readonly name = "Iris";
  private client: Anthropic;
  private brand: BrandConfig;
  private model: string;

  constructor(brand: BrandConfig, model?: string) {
    this.client = new Anthropic();
    this.brand = brand;
    this.model = model ?? "claude-sonnet-4-5-20250929";

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    if (loadedFamilies.size === 0) {
      console.log(`  [Iris] No brand fonts found. Using ${FALLBACK_FONT} as fallback.`);
      console.log(`  [Iris] To upgrade: run the font download script or drop TTF/OTF files into fonts/`);
    }
  }

  async design(briefOrContext: string): Promise<DesignResult> {
    const designPlan = await this.generateDesignPlan(briefOrContext);
    return this.renderFromPlan(designPlan);
  }

  private async generateDesignPlan(briefOrContext: string): Promise<string> {
    const fontList = loadedFamilies.size > 0
      ? `Available fonts: ${[...loadedFamilies].join(", ")}`
      : "Using fallback font (Georgia). Custom brand fonts not yet installed.";

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: `You are Iris — the Visual Design Director for Rose Renuu's "Jesus Forever Yours" brand. You create beautiful, on-brand graphics that Rose can post directly to Instagram, TikTok, YouTube, and more.

## Your Job
Generate STRUCTURED design plans that can be rendered into actual images. You provide the EXACT text, colors, layout, font style, and texture for each slide so they can be built automatically.

## Rose's Accounts
- **@roserenuu** — 144K followers, Rose's personal creator account (PRIMARY — grow this first)
- **@jesusforeveryours** — ~8K followers, brand/ministry page (secondary)

## The Team
- Eden (Content Creator) writes the text — you make it BEAUTIFUL
- Selah (QA Reviewer) checks everything
- Mara (Scheduler) plans when to post
- Navi (Analytics) reads the data — FOLLOW HER DIRECTIVES on which visual styles perform best

${styleGuide ? `## ROSE'S BRAND STYLE GUIDE (READ THIS CAREFULLY — THIS IS HER ACTUAL STYLE)\n\n${styleGuide}\n\n` : ""}## Typography System
${fontList}

You can specify a **fontStyle** per slide to control which font family is used:
| fontStyle | Font | Use For |
|-----------|------|---------|
| editorial | Playfair Display (bold serif) | Headlines, powerful statements, "Keep going." |
| delicate | Cormorant Garamond (light italic) | Soft quotes, whisper text, "god is with you." |
| script | Dancing Script (flowing cursive) | Cursive accents, "you are deeply loved." |
| formal | Great Vibes (elegant script) | Formal cursive, wedding-style elegance |
| retro | Fraunces (display serif) | Retro statements, "hello, December." |
| handwritten | Caveat (casual handwriting) | Personal, raw feel, "Dear God..." |
| condensed | Oswald (bold sans) | Impact statements, ALL CAPS power text |
| warm | Lora (clean serif) | Readable body text, warm statements |
| display | DM Serif Display | Display headlines, classic editorial |

## CRITICAL: Response Format
You MUST respond with a JSON design plan.

Available themes: light, dark, blush, pink, blue, beige, mauve, rosebrown, cream
Available textures: none, linen, paper, fabric
Available layouts: title, body, scripture, cta, repetition, highlight, whisper, impact, handwritten, script

\`\`\`json
{
  "type": "carousel|quote|story|thumbnail|post",
  "theme": "light|dark|blush|pink|blue|beige|mauve|rosebrown|cream",
  "texture": "none|linen|paper|fabric",
  "slides": [
    {
      "layout": "title|body|scripture|cta|repetition|highlight|whisper|impact|handwritten|script",
      "fontStyle": "editorial|delicate|script|formal|retro|handwritten|condensed|warm|display",
      "title": "optional title text",
      "body": "main text — use **bold** and *italic* markers for mixed-weight typography",
      "scripture": "optional scripture text",
      "scriptureRef": "John 3:16 NLT",
      "accent": "optional small accent text",
      "cta": "optional CTA text",
      "highlight": "exact phrase from body to highlight with a glow effect",
      "repeatPhrase": "phrase to repeat (only for repetition layout)",
      "repeatCount": 8
    }
  ],
  "designNotes": "Brief notes about the design direction for Rose"
}
\`\`\`

## Layout Guide

### Standard Layouts
- **title** — Bold headline slide. Use editorial or condensed fontStyle. Hook slide for carousels.
- **body** — Main content slide. Clean readable text. Use warm fontStyle.
- **scripture** — Bible verse in delicate italic with reference below.
- **cta** — Call to action. "Save this.", "Tag someone who needs this."

### NEW Premium Layouts
- **repetition** — Same phrase repeated with growing visual intensity (like "god is with you." x9). Set \`repeatPhrase\` and \`repeatCount\` (4-12). The phrase gets progressively larger and bolder down the slide.
- **highlight** — Text with a glowing highlight behind a key phrase. Set \`highlight\` to the exact words to glow. Like Rose's yellow highlight effect.
- **whisper** — Ultra-delicate lowercase text with maximum whitespace. Perfect for "god is with you." or "one day at a time." Uses delicate fontStyle by default.
- **impact** — Bold condensed all-caps statement. Maximum visual weight. Uses condensed fontStyle.
- **handwritten** — Personal, raw handwriting feel. Uses Caveat. Great for "Dear God..." letters.
- **script** — Elegant flowing cursive. Uses Dancing Script. For phrases like "you are deeply loved."

## Rules
1. FOLLOW THE STYLE GUIDE — match Rose's ACTUAL preferred aesthetic
2. Keep text SHORT per slide — max 40 words per slide
3. One idea per slide. Don't cram.
4. Title slides: PUNCHY — 2-5 words that stop the scroll
5. Scripture: always include full verse text AND reference
6. Use Rose's voice — intimate, warm, like a handwritten letter
7. Vary slide count: short (3-4), medium (5-6), long (7-8). Never repeat format back to back.
8. Every slide must look DIFFERENT — vary layout, fontStyle, background shade
9. Colors: warm and soft — NEVER harsh or cold
10. Whitespace is your friend — never cramped
11. NO watermarks
12. Lowercase = softness, UPPERCASE = power
13. VARY FONT STYLES across slides — don't use the same fontStyle for every slide. Mix editorial + delicate + warm + handwritten etc.
14. Use texture sparingly — "paper" for warm organic feel, "linen" for fabric texture, "fabric" for woven look. "none" for clean modern.
15. JUST TEXT — no decorative lines, shapes, pill buttons, dots, or dividers. Clean text on a clean background.
16. ALL text must be centered — vertically AND horizontally. Generous whitespace.
17. Use **bold** and *italic* markers in body text for mixed-weight typography — this makes text more dynamic.
18. Use the repetition layout when a phrase deserves to sink in — it's one of Rose's signature patterns.
19. Use highlight when one phrase in a sentence deserves extra visual emphasis.`,
      messages: [
        { role: "user", content: `Create a design plan for: ${briefOrContext}` },
      ],
    });

    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  private async renderFromPlan(planText: string): Promise<DesignResult> {
    const jsonMatch = planText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : planText;

    try {
      const plan: DesignPlan = JSON.parse(jsonStr);
      return this.renderDesign(plan, planText);
    } catch {
      return {
        text: `**Iris's Design Brief**\n\n${planText}\n\n*Note: Could not auto-generate images from this plan. Use the brief above to create in Canva.*`,
        files: [],
        designBrief: planText,
      };
    }
  }

  private async renderDesign(plan: DesignPlan, rawPlan: string): Promise<DesignResult> {
    const dims = this.getDimensions(plan.type);
    const theme = this.getTheme(plan.theme || "light");
    const texture: TextureType = plan.texture || "none";
    const timestamp = Date.now();
    const files: string[] = [];

    for (let i = 0; i < plan.slides.length; i++) {
      const slide = plan.slides[i];
      const canvas = createCanvas(dims.width, dims.height);
      const ctx = canvas.getContext("2d");

      // 1. Draw background
      this.drawBackground(ctx, dims.width, dims.height, theme);

      // 2. Apply texture
      applyTexture(ctx, dims.width, dims.height, texture);

      // 3. Draw slide content
      const layout = slide.layout || "body";
      const fStyle = slide.fontStyle || LAYOUT_FONT_DEFAULTS[layout] || "warm";

      switch (layout) {
        case "title":
          this.drawTitleSlide(ctx, dims, theme, slide, fStyle);
          break;
        case "scripture":
          this.drawScriptureSlide(ctx, dims, theme, slide, fStyle);
          break;
        case "cta":
          this.drawCtaSlide(ctx, dims, theme, slide, fStyle);
          break;
        case "repetition":
          this.drawRepetitionSlide(ctx, dims, theme, slide, fStyle);
          break;
        case "highlight":
          this.drawHighlightSlide(ctx, dims, theme, slide, fStyle);
          break;
        case "whisper":
          this.drawWhisperSlide(ctx, dims, theme, slide);
          break;
        case "impact":
          this.drawImpactSlide(ctx, dims, theme, slide);
          break;
        case "handwritten":
          this.drawHandwrittenSlide(ctx, dims, theme, slide);
          break;
        case "script":
          this.drawScriptSlide(ctx, dims, theme, slide);
          break;
        default:
          this.drawBodySlide(ctx, dims, theme, slide, fStyle);
      }

      // Save
      const filename = `${plan.type}_${timestamp}_slide${i + 1}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, canvas.toBuffer("image/png"));
      files.push(filepath);
    }

    // Build response
    let response = `**Iris's Design — ${plan.slides.length} graphic(s) created**\n\n`;
    response += `Type: **${plan.type.toUpperCase()}** | Theme: **${plan.theme || "light"}**`;
    if (texture !== "none") response += ` | Texture: **${texture}**`;
    response += ` | Size: **${dims.width}x${dims.height}px**\n\n`;

    const layoutsUsed = [...new Set(plan.slides.map(s => s.layout || "body"))];
    const fontsUsed = [...new Set(plan.slides.map(s => s.fontStyle || LAYOUT_FONT_DEFAULTS[s.layout || "body"] || "warm"))];
    response += `Layouts: ${layoutsUsed.join(", ")} | Fonts: ${fontsUsed.join(", ")}\n\n`;

    response += `**Files saved to \`designs/\` folder:**\n`;
    for (const f of files) response += `- \`${path.basename(f)}\`\n`;
    if (plan.designNotes) response += `\n**Design Notes:** ${plan.designNotes}\n`;
    response += `\n**Ready to post!** Upload these directly to Instagram, no editing needed.`;

    return { text: response, files, designBrief: rawPlan };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Dimensions
  // ─────────────────────────────────────────────────────────────────────────
  private getDimensions(type: string): { width: number; height: number } {
    switch (type) {
      case "carousel": return { width: 1080, height: 1440 };
      case "story":    return { width: 1080, height: 1920 };
      case "thumbnail": return { width: 1280, height: 720 };
      case "quote":
      case "post":
      default:         return { width: 1080, height: 1080 };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Theme colors
  // ─────────────────────────────────────────────────────────────────────────
  private getTheme(name: string): ThemeColors {
    switch (name) {
      case "dark":
        return {
          bg: BRAND_COLORS.charcoal, bgSecondary: "#4A4A4A",
          title: BRAND_COLORS.lightText, body: "#E8E0D8",
          accent: BRAND_COLORS.yellowGlow, scripture: BRAND_COLORS.softPink,
          highlightBg: hexToRgba(BRAND_COLORS.yellowGlow, 0.25), decorLine: BRAND_COLORS.softPink,
        };
      case "blush":
        return {
          bg: BRAND_COLORS.blushPink, bgSecondary: BRAND_COLORS.palePink,
          title: BRAND_COLORS.darkBrown, body: BRAND_COLORS.richBlack,
          accent: BRAND_COLORS.roseBrown, scripture: BRAND_COLORS.warmBrown,
          highlightBg: hexToRgba(BRAND_COLORS.pinkLinen, 0.35), decorLine: BRAND_COLORS.roseBrown,
        };
      case "pink":
        return {
          bg: BRAND_COLORS.palePink, bgSecondary: BRAND_COLORS.blushPink,
          title: BRAND_COLORS.darkBrown, body: BRAND_COLORS.richBlack,
          accent: BRAND_COLORS.roseBrown, scripture: BRAND_COLORS.warmBrown,
          highlightBg: hexToRgba(BRAND_COLORS.softPink, 0.3), decorLine: BRAND_COLORS.pinkLinen,
        };
      case "blue":
        return {
          bg: BRAND_COLORS.babyBlue, bgSecondary: "#C4D6E8",
          title: BRAND_COLORS.royalBlue, body: BRAND_COLORS.richBlack,
          accent: BRAND_COLORS.royalBlue, scripture: BRAND_COLORS.royalBlue,
          highlightBg: hexToRgba(BRAND_COLORS.royalBlue, 0.12), decorLine: BRAND_COLORS.royalBlue,
        };
      case "beige":
        return {
          bg: BRAND_COLORS.warmBeige, bgSecondary: BRAND_COLORS.warmTan,
          title: BRAND_COLORS.darkBrown, body: BRAND_COLORS.richBlack,
          accent: BRAND_COLORS.warmBrown, scripture: BRAND_COLORS.warmBrown,
          highlightBg: hexToRgba(BRAND_COLORS.yellowGlow, 0.2), decorLine: BRAND_COLORS.warmBrown,
        };
      case "mauve":
        return {
          bg: BRAND_COLORS.dustyMauve, bgSecondary: BRAND_COLORS.roseBrown,
          title: BRAND_COLORS.lightText, body: "#F5E4E0",
          accent: BRAND_COLORS.pinkLinen, scripture: BRAND_COLORS.softPink,
          highlightBg: hexToRgba(BRAND_COLORS.pinkLinen, 0.25), decorLine: BRAND_COLORS.pinkLinen,
        };
      case "rosebrown":
        return {
          bg: BRAND_COLORS.roseBrown, bgSecondary: BRAND_COLORS.dustyMauve,
          title: BRAND_COLORS.lightText, body: "#F5E4E0",
          accent: BRAND_COLORS.yellowGlow, scripture: BRAND_COLORS.softPink,
          highlightBg: hexToRgba(BRAND_COLORS.yellowGlow, 0.25), decorLine: BRAND_COLORS.softPink,
        };
      case "cream":
      case "light":
      default:
        return {
          bg: BRAND_COLORS.cream, bgSecondary: BRAND_COLORS.palePink,
          title: BRAND_COLORS.darkBrown, body: BRAND_COLORS.richBlack,
          accent: BRAND_COLORS.warmBrown, scripture: BRAND_COLORS.warmBrown,
          highlightBg: hexToRgba(BRAND_COLORS.yellowGlow, 0.25), decorLine: BRAND_COLORS.warmBrown,
        };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Background
  // ─────────────────────────────────────────────────────────────────────────
  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeColors): void {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle gradient overlay for depth
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(255,255,255,0.05)");
    grad.addColorStop(1, "rgba(0,0,0,0.03)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT: Title — Bold headline (Playfair Display by default)
  // ─────────────────────────────────────────────────────────────────────────
  private drawTitleSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ThemeColors,
    slide: SlideData,
    fStyle: FontStyleKey
  ): void {
    const { width: w, height: h } = dims;
    const padding = w * 0.12;
    const maxWidth = w - padding * 2;
    const gap = h * 0.04;

    const accentSize = Math.floor(w * 0.032);
    const titleSize = Math.floor(w * 0.075);
    const titleLineH = Math.floor(w * 0.095);
    const bodySize = Math.floor(w * 0.035);
    const bodyLineH = Math.floor(w * 0.05);

    let totalH = 0;
    let accentH = 0, titleH = 0, bodyH = 0;

    if (slide.accent) {
      accentH = accentSize;
      totalH += accentH;
    }
    if (slide.title) {
      ctx.font = fontString(fStyle, titleSize, "bold");
      titleH = this.measureWrappedText(ctx, slide.title, maxWidth) * titleLineH;
      if (totalH > 0) totalH += gap;
      totalH += titleH;
    }
    if (slide.body) {
      ctx.font = fontString("warm", bodySize);
      bodyH = this.measureWrappedText(ctx, this.stripMarkers(slide.body), maxWidth) * bodyLineH;
      if (totalH > 0) totalH += gap;
      totalH += bodyH;
    }

    let y = (h - totalH) / 2;

    if (slide.accent) {
      ctx.fillStyle = theme.accent;
      ctx.font = fontString("delicate", accentSize, "normal", "italic");
      ctx.textAlign = "center";
      ctx.fillText(slide.accent.toUpperCase(), w / 2, y + accentSize * 0.8);
      y += accentH + gap;
    }

    if (slide.title) {
      ctx.fillStyle = theme.title;
      ctx.font = fontString(fStyle, titleSize, "bold");
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.title, w / 2, y + titleLineH * 0.8, maxWidth, titleLineH);
      y += titleH + gap;
    }

    if (slide.body) {
      ctx.fillStyle = theme.body;
      this.drawMixedWeightText(ctx, slide.body, w / 2, y, maxWidth, bodyLineH, bodySize, "warm", theme);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT: Body — Clean readable content (Lora by default)
  // ─────────────────────────────────────────────────────────────────────────
  private drawBodySlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ThemeColors,
    slide: SlideData,
    fStyle: FontStyleKey
  ): void {
    const { width: w, height: h } = dims;
    const padding = w * 0.12;
    const maxWidth = w - padding * 2;
    const gap = h * 0.04;

    const titleSize = Math.floor(w * 0.05);
    const titleLineH = Math.floor(w * 0.065);
    const bodySize = Math.floor(w * 0.04);
    const bodyLineH = Math.floor(w * 0.058);
    const scriptureSize = Math.floor(w * 0.033);
    const scriptureLineH = Math.floor(w * 0.048);
    const refSize = Math.floor(w * 0.028);

    let totalH = 0;
    let titleH = 0, bodyH = 0, scriptureH = 0, refH = 0;

    if (slide.title) {
      ctx.font = fontString(fStyle, titleSize, "bold");
      titleH = this.measureWrappedText(ctx, slide.title, maxWidth) * titleLineH;
      totalH += titleH;
    }
    if (slide.body) {
      ctx.font = fontString(fStyle, bodySize);
      bodyH = this.measureWrappedText(ctx, this.stripMarkers(slide.body), maxWidth) * bodyLineH;
      if (totalH > 0) totalH += gap;
      totalH += bodyH;
    }
    if (slide.scripture) {
      ctx.font = fontString("delicate", scriptureSize, "normal", "italic");
      scriptureH = this.measureWrappedText(ctx, `\u201C${slide.scripture}\u201D`, maxWidth) * scriptureLineH;
      if (totalH > 0) totalH += gap;
      totalH += scriptureH;
    }
    if (slide.scriptureRef) {
      refH = refSize;
      if (totalH > 0) totalH += gap * 0.5;
      totalH += refH;
    }

    let y = (h - totalH) / 2;

    if (slide.title) {
      ctx.fillStyle = theme.title;
      ctx.font = fontString(fStyle, titleSize, "bold");
      ctx.textAlign = "center";
      this.wrapText(ctx, slide.title, w / 2, y + titleLineH * 0.8, maxWidth, titleLineH);
      y += titleH + gap;
    }

    if (slide.body) {
      ctx.fillStyle = theme.body;
      this.drawMixedWeightText(ctx, slide.body, w / 2, y, maxWidth, bodyLineH, bodySize, fStyle, theme);
      y += bodyH + gap;
    }

    if (slide.scripture) {
      ctx.fillStyle = theme.scripture;
      ctx.font = fontString("delicate", scriptureSize, "normal", "italic");
      ctx.textAlign = "center";
      this.wrapText(ctx, `\u201C${slide.scripture}\u201D`, w / 2, y + scriptureLineH * 0.8, maxWidth, scriptureLineH);
      y += scriptureH + gap * 0.5;
    }

    if (slide.scriptureRef) {
      ctx.fillStyle = theme.scripture;
      ctx.font = fontString("delicate", refSize, "bold", "italic");
      ctx.textAlign = "center";
      ctx.fillText(`\u2014 ${slide.scriptureRef}`, w / 2, y + refSize * 0.8);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT: Scripture — Delicate italic (Cormorant Garamond by default)
  // ─────────────────────────────────────────────────────────────────────────
  private drawScriptureSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ThemeColors,
    slide: SlideData,
    fStyle: FontStyleKey
  ): void {
    const { width: w, height: h } = dims;
    const padding = w * 0.14;
    const maxWidth = w - padding * 2;
    const gap = h * 0.04;

    const scriptureSize = Math.floor(w * 0.042);
    const scriptureLineH = Math.floor(w * 0.06);
    const refSize = Math.floor(w * 0.03);

    const text = slide.scripture || slide.body || "";
    const actualStyle = fStyle === "delicate" || fStyle === "warm" ? fStyle : "delicate";

    let totalH = 0;
    let scriptureH = 0, refH = 0;

    if (text) {
      ctx.font = fontString(actualStyle, scriptureSize, "normal", "italic");
      scriptureH = this.measureWrappedText(ctx, text, maxWidth) * scriptureLineH;
      totalH += scriptureH;
    }
    if (slide.scriptureRef) {
      refH = refSize;
      if (totalH > 0) totalH += gap;
      totalH += refH;
    }

    let y = (h - totalH) / 2;

    if (text) {
      ctx.fillStyle = theme.body;
      ctx.font = fontString(actualStyle, scriptureSize, "normal", "italic");
      ctx.textAlign = "center";
      this.wrapText(ctx, text, w / 2, y + scriptureLineH * 0.8, maxWidth, scriptureLineH);
      y += scriptureH + gap;
    }

    if (slide.scriptureRef) {
      ctx.fillStyle = theme.scripture;
      ctx.font = fontString(actualStyle, refSize, "bold");
      ctx.textAlign = "center";
      ctx.fillText(slide.scriptureRef, w / 2, y + refSize * 0.8);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT: CTA — Call to action
  // ─────────────────────────────────────────────────────────────────────────
  private drawCtaSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ThemeColors,
    slide: SlideData,
    fStyle: FontStyleKey
  ): void {
    const { width: w, height: h } = dims;
    const padding = w * 0.12;
    const maxWidth = w - padding * 2;
    const gap = h * 0.04;

    const headingSize = Math.floor(w * 0.055);
    const headingLineH = Math.floor(w * 0.07);
    const bodySize = Math.floor(w * 0.035);
    const bodyLineH = Math.floor(w * 0.05);
    const ctaSize = Math.floor(w * 0.032);

    let totalH = 0;
    let headingH = 0, bodyH = 0, ctaH = 0;

    const headingText = slide.title || slide.cta || "";
    if (headingText) {
      ctx.font = fontString(fStyle, headingSize, "bold");
      headingH = this.measureWrappedText(ctx, headingText, maxWidth) * headingLineH;
      totalH += headingH;
    }
    if (slide.body) {
      ctx.font = fontString("warm", bodySize);
      bodyH = this.measureWrappedText(ctx, this.stripMarkers(slide.body), maxWidth) * bodyLineH;
      if (totalH > 0) totalH += gap;
      totalH += bodyH;
    }
    if (slide.cta && slide.title) {
      ctaH = ctaSize;
      if (totalH > 0) totalH += gap;
      totalH += ctaH;
    }

    let y = (h - totalH) / 2;

    if (headingText) {
      ctx.fillStyle = theme.title;
      ctx.font = fontString(fStyle, headingSize, "bold");
      ctx.textAlign = "center";
      this.wrapText(ctx, headingText, w / 2, y + headingLineH * 0.8, maxWidth, headingLineH);
      y += headingH + gap;
    }

    if (slide.body) {
      ctx.fillStyle = theme.body;
      this.drawMixedWeightText(ctx, slide.body, w / 2, y, maxWidth, bodyLineH, bodySize, "warm", theme);
      y += bodyH + gap;
    }

    if (slide.cta && slide.title) {
      ctx.fillStyle = theme.accent;
      ctx.font = fontString("condensed", ctaSize);
      ctx.textAlign = "center";
      ctx.fillText(slide.cta.toUpperCase(), w / 2, y + ctaSize * 0.8);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT: Repetition — "god is with you." repeated with growing intensity
  // ─────────────────────────────────────────────────────────────────────────
  private drawRepetitionSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ThemeColors,
    slide: SlideData,
    fStyle: FontStyleKey
  ): void {
    const { width: w, height: h } = dims;
    const phrase = slide.repeatPhrase || slide.body || slide.title || "";
    const count = Math.min(slide.repeatCount || 8, 14);
    if (!phrase || count < 2) return;

    const padding = w * 0.1;
    const maxWidth = w - padding * 2;

    // Calculate available vertical space and distribute lines
    const totalVerticalSpace = h * 0.7;
    const lineGap = totalVerticalSpace / count;
    const startY = (h - totalVerticalSpace) / 2;

    const minSize = Math.floor(w * 0.025);
    const maxSize = Math.floor(w * 0.06);
    const sizeStep = (maxSize - minSize) / (count - 1);

    // Opacity grows from subtle to full
    const minOpacity = 0.2;

    ctx.textAlign = "center";

    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const size = Math.floor(minSize + sizeStep * i);
      const opacity = minOpacity + (1 - minOpacity) * progress;

      // Last line is bold, rest are normal weight
      const weight = i === count - 1 ? "bold" : "normal";
      ctx.font = fontString(fStyle, size, weight);

      // Blend color from muted to full
      ctx.globalAlpha = opacity;
      ctx.fillStyle = theme.title;

      const y = startY + i * lineGap + size * 0.8;
      this.wrapText(ctx, phrase, w / 2, y, maxWidth, size * 1.2);
    }

    ctx.globalAlpha = 1;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT: Highlight — Text with glowing highlight behind a key phrase
  // ─────────────────────────────────────────────────────────────────────────
  private drawHighlightSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ThemeColors,
    slide: SlideData,
    fStyle: FontStyleKey
  ): void {
    const { width: w, height: h } = dims;
    const padding = w * 0.12;
    const maxWidth = w - padding * 2;
    const gap = h * 0.04;

    const bodySize = Math.floor(w * 0.042);
    const bodyLineH = Math.floor(w * 0.062);

    const text = slide.body || slide.title || "";
    const highlightPhrase = slide.highlight || "";

    if (!text) return;

    // Measure total height for centering
    ctx.font = fontString(fStyle, bodySize);
    const lines = this.getWrappedLines(ctx, this.stripMarkers(text), maxWidth);
    const totalH = lines.length * bodyLineH;
    let y = (h - totalH) / 2;

    ctx.textAlign = "center";

    // Draw each line, highlighting the target phrase
    for (const line of lines) {
      const lineY = y + bodySize * 0.8;

      if (highlightPhrase && line.toLowerCase().includes(highlightPhrase.toLowerCase())) {
        // Find the highlight phrase bounds
        const idx = line.toLowerCase().indexOf(highlightPhrase.toLowerCase());
        const before = line.substring(0, idx);
        const phrase = line.substring(idx, idx + highlightPhrase.length);
        const after = line.substring(idx + highlightPhrase.length);

        ctx.font = fontString(fStyle, bodySize);
        const beforeW = ctx.measureText(before).width;
        const phraseW = ctx.measureText(phrase).width;
        const fullW = ctx.measureText(line).width;

        // Position relative to center
        const lineStartX = w / 2 - fullW / 2;
        const hlX = lineStartX + beforeW;
        const hlPad = bodySize * 0.15;

        // Draw highlight rectangle
        ctx.fillStyle = theme.highlightBg;
        ctx.fillRect(hlX - hlPad, lineY - bodySize * 0.85, phraseW + hlPad * 2, bodySize * 1.15);

        // Draw full line text on top
        ctx.fillStyle = theme.body;
        ctx.font = fontString(fStyle, bodySize);
        ctx.textAlign = "center";
        ctx.fillText(line, w / 2, lineY);
      } else {
        ctx.fillStyle = theme.body;
        ctx.font = fontString(fStyle, bodySize);
        ctx.fillText(line, w / 2, lineY);
      }

      y += bodyLineH;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT: Whisper — Ultra-delicate lowercase, maximum whitespace
  // ─────────────────────────────────────────────────────────────────────────
  private drawWhisperSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ThemeColors,
    slide: SlideData
  ): void {
    const { width: w, height: h } = dims;
    const padding = w * 0.18; // Extra padding for maximum whitespace
    const maxWidth = w - padding * 2;

    const bodySize = Math.floor(w * 0.038);
    const bodyLineH = Math.floor(w * 0.058);

    const text = slide.body || slide.title || "";
    if (!text) return;

    ctx.font = fontString("delicate", bodySize, "normal", "italic");
    const lines = this.getWrappedLines(ctx, text, maxWidth);
    const totalH = lines.length * bodyLineH;
    let y = (h - totalH) / 2;

    ctx.fillStyle = theme.body;
    ctx.textAlign = "center";

    for (const line of lines) {
      ctx.fillText(line, w / 2, y + bodySize * 0.8);
      y += bodyLineH;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT: Impact — Bold condensed sans ALL CAPS (Oswald by default)
  // ─────────────────────────────────────────────────────────────────────────
  private drawImpactSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ThemeColors,
    slide: SlideData
  ): void {
    const { width: w, height: h } = dims;
    const padding = w * 0.1;
    const maxWidth = w - padding * 2;

    const titleSize = Math.floor(w * 0.08);
    const titleLineH = Math.floor(w * 0.1);

    const text = (slide.title || slide.body || "").toUpperCase();
    if (!text) return;

    ctx.font = fontString("condensed", titleSize, "bold");
    const lines = this.getWrappedLines(ctx, text, maxWidth);
    const totalH = lines.length * titleLineH;
    let y = (h - totalH) / 2;

    ctx.fillStyle = theme.title;
    ctx.textAlign = "center";

    for (const line of lines) {
      ctx.fillText(line, w / 2, y + titleSize * 0.8);
      y += titleLineH;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT: Handwritten — Personal raw feel (Caveat by default)
  // ─────────────────────────────────────────────────────────────────────────
  private drawHandwrittenSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ThemeColors,
    slide: SlideData
  ): void {
    const { width: w, height: h } = dims;
    const padding = w * 0.12;
    const maxWidth = w - padding * 2;

    const bodySize = Math.floor(w * 0.048);
    const bodyLineH = Math.floor(w * 0.07);

    const text = slide.body || slide.title || "";
    if (!text) return;

    ctx.font = fontString("handwritten", bodySize);
    const lines = this.getWrappedLines(ctx, text, maxWidth);
    const totalH = lines.length * bodyLineH;
    let y = (h - totalH) / 2;

    ctx.fillStyle = theme.body;
    ctx.textAlign = "center";

    for (const line of lines) {
      ctx.fillText(line, w / 2, y + bodySize * 0.8);
      y += bodyLineH;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT: Script — Elegant flowing cursive (Dancing Script by default)
  // ─────────────────────────────────────────────────────────────────────────
  private drawScriptSlide(
    ctx: CanvasRenderingContext2D,
    dims: { width: number; height: number },
    theme: ThemeColors,
    slide: SlideData
  ): void {
    const { width: w, height: h } = dims;
    const padding = w * 0.14;
    const maxWidth = w - padding * 2;

    const bodySize = Math.floor(w * 0.052);
    const bodyLineH = Math.floor(w * 0.075);

    const text = slide.body || slide.title || "";
    if (!text) return;

    ctx.font = fontString("script", bodySize);
    const lines = this.getWrappedLines(ctx, text, maxWidth);
    const totalH = lines.length * bodyLineH;
    let y = (h - totalH) / 2;

    ctx.fillStyle = theme.title;
    ctx.textAlign = "center";

    for (const line of lines) {
      ctx.fillText(line, w / 2, y + bodySize * 0.8);
      y += bodyLineH;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mixed-weight typography — parses **bold** and *italic* markers
  // ─────────────────────────────────────────────────────────────────────────
  private drawMixedWeightText(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    startY: number,
    maxWidth: number,
    lineHeight: number,
    fontSize: number,
    fStyle: FontStyleKey,
    theme: ThemeColors
  ): void {
    // If no markers, draw normally
    if (!text.includes("**") && !text.includes("*")) {
      ctx.font = fontString(fStyle, fontSize);
      ctx.textAlign = "center";
      const y = startY + lineHeight * 0.8;
      this.wrapText(ctx, text, centerX, y, maxWidth, lineHeight);
      return;
    }

    // Parse segments: **bold**, *italic*, and plain text
    const segments = this.parseMarkers(text);

    // Get wrapped lines from plain text
    const plainText = segments.map(s => s.text).join("");
    ctx.font = fontString(fStyle, fontSize);
    const lines = this.getWrappedLines(ctx, plainText, maxWidth);

    let charIdx = 0;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      const y = startY + lineNum * lineHeight + lineHeight * 0.8;

      // Measure full line width for centering
      ctx.font = fontString(fStyle, fontSize);
      const lineWidth = ctx.measureText(line).width;
      let x = centerX - lineWidth / 2;

      // Draw each character segment with correct styling
      let lineCharIdx = 0;
      while (lineCharIdx < line.length) {
        // Find which segment this character belongs to
        const seg = this.getSegmentAt(segments, charIdx + lineCharIdx);
        if (!seg) break;

        // Find how many characters of this segment remain on this line
        const remaining = line.substring(lineCharIdx);
        const segRemaining = seg.text.substring(charIdx + lineCharIdx - seg.startIdx);
        const chunkLen = Math.min(remaining.length, segRemaining.length);
        const chunk = remaining.substring(0, chunkLen);

        // Set font based on marker
        if (seg.style === "bold") {
          ctx.font = fontString(fStyle, fontSize, "bold");
        } else if (seg.style === "italic") {
          ctx.font = fontString(fStyle, fontSize, "normal", "italic");
        } else {
          ctx.font = fontString(fStyle, fontSize);
        }

        ctx.fillStyle = theme.body;
        ctx.textAlign = "left";
        ctx.fillText(chunk, x, y);
        x += ctx.measureText(chunk).width;
        lineCharIdx += chunkLen;
      }

      charIdx += line.length;
      // Account for the space that wrapping removed
      if (lineNum < lines.length - 1) {
        charIdx++; // space between wrapped lines
      }
    }

    ctx.textAlign = "center";
  }

  private parseMarkers(text: string): Array<{ text: string; style: "bold" | "italic" | "normal"; startIdx: number }> {
    const segments: Array<{ text: string; style: "bold" | "italic" | "normal"; startIdx: number }> = [];
    let plainIdx = 0;

    // Process **bold** first, then *italic*
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Plain text before this match
      if (match.index > lastIdx) {
        const plain = text.substring(lastIdx, match.index);
        segments.push({ text: plain, style: "normal", startIdx: plainIdx });
        plainIdx += plain.length;
      }

      if (match[1] !== undefined) {
        // **bold**
        segments.push({ text: match[1], style: "bold", startIdx: plainIdx });
        plainIdx += match[1].length;
      } else if (match[2] !== undefined) {
        // *italic*
        segments.push({ text: match[2], style: "italic", startIdx: plainIdx });
        plainIdx += match[2].length;
      }

      lastIdx = match.index + match[0].length;
    }

    // Remaining plain text
    if (lastIdx < text.length) {
      const plain = text.substring(lastIdx);
      segments.push({ text: plain, style: "normal", startIdx: plainIdx });
    }

    return segments;
  }

  private getSegmentAt(
    segments: Array<{ text: string; style: "bold" | "italic" | "normal"; startIdx: number }>,
    charIdx: number
  ): { text: string; style: "bold" | "italic" | "normal"; startIdx: number } | null {
    for (const seg of segments) {
      if (charIdx >= seg.startIdx && charIdx < seg.startIdx + seg.text.length) {
        return seg;
      }
    }
    return segments.length > 0 ? segments[segments.length - 1] : null;
  }

  private stripMarkers(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Text measurement and wrapping utilities
  // ─────────────────────────────────────────────────────────────────────────
  private getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = line + (line ? " " : "") + words[i];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  private measureWrappedText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number {
    return this.getWrappedLines(ctx, text, maxWidth).length;
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number {
    const lines = this.getWrappedLines(ctx, text, maxWidth);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight);
    }
    return lines.length;
  }

  clearHistory(): void {
    // No history to clear
  }
}
