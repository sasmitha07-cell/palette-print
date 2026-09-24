import { extractPalette } from "./color-extraction";
import { synthesizeStyleDNA } from "./ai/synthesis";
import { buildHeuristicFallbackAnalysis } from "./ai/vision";
import type { StyleDNA } from "./ai/schemas";

export type { StyleDNA };

export async function generateStyleDNA(files: File[]): Promise<StyleDNA> {
  // 1. Authoritative color extraction (Untouched)
  const palette = await extractPalette(files);

  // 2. Build baseline analyses
  const analyses = files.map((file, idx) =>
    buildHeuristicFallbackAnalysis(`seed_${idx + 1}`, palette),
  );

  // 3. Multi-image synthesis
  return synthesizeStyleDNA(analyses, palette);
}
