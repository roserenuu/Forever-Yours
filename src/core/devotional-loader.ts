import * as fs from "fs";
import * as path from "path";

const DEVOTIONAL_DIR = path.join(process.cwd(), "devotional");

/**
 * Load Rose's devotional content from the devotional/ folder.
 * Supports .pdf, .txt, and .md files.
 */
export async function loadDevotional(): Promise<string> {
  if (!fs.existsSync(DEVOTIONAL_DIR)) {
    return "";
  }

  const files = fs.readdirSync(DEVOTIONAL_DIR).filter(
    (f) => /\.(pdf|txt|md)$/i.test(f)
  );

  if (files.length === 0) {
    return "";
  }

  const sections: string[] = [];

  for (const file of files) {
    const filePath = path.join(DEVOTIONAL_DIR, file);
    const ext = path.extname(file).toLowerCase();

    try {
      if (ext === ".pdf") {
        const { PDFParse } = await import("pdf-parse");
        const buffer = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const result = await parser.getText();
        const text = result.text ?? "";
        if (text.trim()) {
          console.log(`  [Devotional] Loaded ${file}`);
          sections.push(text.trim());
        }
      } else {
        // .txt or .md
        const content = fs.readFileSync(filePath, "utf-8").trim();
        if (content) {
          console.log(`  [Devotional] Loaded ${file}`);
          sections.push(content);
        }
      }
    } catch (err) {
      console.error(`  [Devotional] Failed to load ${file}:`, err);
    }
  }

  if (sections.length === 0) {
    return "";
  }

  return sections.join("\n\n---\n\n");
}
