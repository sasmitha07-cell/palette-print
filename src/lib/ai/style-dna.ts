// src/lib/ai/style-dna.ts
import { analyzeImageWithVision, type AnalyzeImageInput } from "./vision";
import { synthesizeStyleDNA } from "./synthesis";
import type { ImageStyleAnalysis, StyleDNA } from "./schemas";

import type { RawImageMetrics } from "../cv-analysis";

export interface StyleDNAPipelineInput {
  images: {
    id: string;
    base64: string;
    mimeType: string;
    dominantColors?: string[];
    cvMetrics?: RawImageMetrics;
  }[];
  authoritativePalette: string[]; // From extractPalette() in color-extraction.ts
}

/**
 * Runs parallel tasks with a max concurrency limit to avoid hitting Gemini rate limits.
 */
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Orchestrates the complete Style DNA analysis and synthesis pipeline:
 * 1. Takes the images and authoritative extracted palette
 * 2. Analyzes each image with Gemini Vision in parallel (concurrency: 3)
 * 3. Gracefully handles any individual failures
 * 4. Aggregates cross-image patterns with Frequency × Consistency × Confidence weighting
 * 5. Synthesizes the final multi-dimensional Style DNA
 */
export async function runStyleDNAPipeline(input: StyleDNAPipelineInput): Promise<StyleDNA> {
  const { images, authoritativePalette } = input;

  if (!images || images.length === 0) {
    throw new Error("Style DNA requires at least 1 inspiration image.");
  }

  // Cap at 10 images
  const targetImages = images.slice(0, 10);

  // Parallel analysis with concurrency limit of 5 for faster completion
  const analyses: ImageStyleAnalysis[] = await mapConcurrent(targetImages, 5, async (img, idx) => {
    const payload: AnalyzeImageInput = {
      imageId: img.id || `img_${idx + 1}`,
      base64: img.base64,
      mimeType: img.mimeType || "image/jpeg",
      dominantColors: img.dominantColors || [],
      cvMetrics: img.cvMetrics,
    };
    return analyzeImageWithVision(payload);
  });

  // Cross-image weighted synthesis
  const styleDNA = await synthesizeStyleDNA(analyses, authoritativePalette);

  return styleDNA;
}
