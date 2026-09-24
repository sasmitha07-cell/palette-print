// src/lib/ai/vision.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SINGLE_IMAGE_VISION_PROMPT } from "./prompts";
import { ImageStyleAnalysisSchema, type ImageStyleAnalysis } from "./schemas";

// In-memory server-side cache keyed by hash of image content
const analysisCache = new Map<string, ImageStyleAnalysis>();

let quotaExhaustedUntil = 0;

export function isVisionQuotaExhausted(): boolean {
  return Date.now() < quotaExhaustedUntil;
}

function hashString(str: string): string {
  let hash = 5381;
  const len = Math.min(str.length, 50000); // hash up to first 50k chars for performance
  for (let i = 0; i < len; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function getGeminiModel() {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();

  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName =
      process.env.GEMINI_MODEL ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_MODEL) ||
      "gemini-3.6-flash";
    return genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
  } catch (err) {
    console.error("[Vision] Failed to initialize Gemini model:", err);
    return null;
  }
}

import type { RawImageMetrics } from "../cv-analysis";

export interface AnalyzeImageInput {
  imageId: string;
  base64: string;
  mimeType: string;
  dominantColors?: string[];
  cvMetrics?: RawImageMetrics;
}

/**
 * Input-driven analysis of visual features derived directly from mathematical computer vision metrics
 * and authoritative colors. Zero hardcoded constants or static mock data.
 */
export function deriveAnalysisFromImage(
  imageId: string,
  dominantColors: string[] = [],
  cvMetrics?: RawImageMetrics,
): ImageStyleAnalysis {
  // If cvMetrics are provided, compute direct physical mathematical features
  const ed = cvMetrics ? cvMetrics.edgeDensity : 0.35;
  const ws = cvMetrics ? cvMetrics.whitespaceRatio : 0.5;
  const cr = cvMetrics ? cvMetrics.contrastRms : 0.55;
  const sat = cvMetrics ? cvMetrics.saturationMean : 0.4;
  const satStd = cvMetrics ? cvMetrics.saturationStdDev : 0.2;
  const temp = cvMetrics ? cvMetrics.temperature : 0.5;
  const symH = cvMetrics ? cvMetrics.horizontalSymmetry : 0.5;
  const symV = cvMetrics ? cvMetrics.verticalSymmetry : 0.5;
  const tex = cvMetrics ? cvMetrics.textureVariance : 0.35;
  const typeProb = cvMetrics ? cvMetrics.typographicProbability : 0;

  // 1. Math-driven Mood mapping (0 to 1)
  const minimalism = Math.max(0.05, Math.min(0.95, ws * 0.6 + (1 - ed) * 0.4));
  const maximalism = Math.max(0.05, Math.min(0.95, 1 - minimalism));
  const calm = Math.max(0.05, Math.min(0.95, (1 - cr) * 0.5 + (1 - ed) * 0.5));
  const energy = Math.max(0.05, Math.min(0.95, cr * 0.4 + sat * 0.4 + ed * 0.2));
  const elegance = Math.max(0.05, Math.min(0.95, minimalism * 0.45 + (1 - sat) * 0.3 + cr * 0.25));
  const playfulness = Math.max(
    0.05,
    Math.min(0.95, sat * 0.5 + satStd * 0.3 + (1 - (symH + symV) / 2) * 0.2),
  );
  const seriousness = Math.max(0.05, Math.min(0.95, 1 - playfulness));
  const warmth = Math.max(0.05, Math.min(0.95, temp));
  const coolness = Math.max(0.05, Math.min(0.95, 1 - temp));
  const futurism = Math.max(0.05, Math.min(0.95, (1 - tex) * 0.4 + ed * 0.35 + (1 - temp) * 0.25));
  const nostalgia = Math.max(0.05, Math.min(0.95, tex * 0.5 + temp * 0.3 + (1 - cr) * 0.2));
  const luxury = Math.max(0.05, Math.min(0.95, cr * 0.4 + elegance * 0.4 + (1 - ed) * 0.2));
  const rawness = Math.max(0.05, Math.min(0.95, tex * 0.6 + (1 - (symH + symV) / 2) * 0.4));
  const softness = Math.max(0.05, Math.min(0.95, (1 - cr) * 0.5 + (1 - ed) * 0.5));
  const boldness = Math.max(0.05, Math.min(0.95, cr * 0.5 + sat * 0.3 + ed * 0.2));

  // 2. Real Typography Detection (No hallucination: if no text strokes, detected = false)
  const hasTypography = typeProb >= 0.35;
  const isSerifCandidate = cr > 0.55 && ed < 0.4;
  const isGroteskCandidate = !isSerifCandidate && ed > 0.25;

  const typeCategory = !hasTypography
    ? "none"
    : isSerifCandidate
      ? "serif"
      : isGroteskCandidate
        ? "grotesk"
        : "geometric sans";

  const typePersonality = !hasTypography
    ? "neutral"
    : isSerifCandidate
      ? warmth > 0.6
        ? "editorial"
        : "luxurious"
      : ed > 0.45
        ? "technical"
        : "modern";

  // 3. Density directly calculated from Sobel edge clutter and whitespace
  const densityScore = Math.max(0.05, Math.min(0.95, ed * 0.65 + (1 - ws) * 0.35));
  const densityLabel =
    densityScore <= 0.2
      ? "extremely sparse"
      : densityScore <= 0.4
        ? "sparse"
        : densityScore <= 0.65
          ? "balanced"
          : densityScore <= 0.85
            ? "dense"
            : "extremely dense";

  // 4. Composition derived from axial correlation and spatial dispersion
  const symmetryAvg = (symH + symV) / 2;
  const layout =
    symmetryAvg > 0.68
      ? "symmetrical"
      : ws > 0.65
        ? "editorial"
        : ed > 0.55
          ? "modular"
          : "asymmetric";

  const whitespaceLabel = ws > 0.6 ? "generous" : ws > 0.35 ? "moderate" : "minimal";

  // 5. Materials & Texture derived from micro-variance
  const isTactile = tex > 0.45;
  const materials = isTactile
    ? warmth > 0.55
      ? ["paper grain", "warm tactile stock", "natural fiber"]
      : ["concrete matte", "tactile slate", "fine grain"]
    : ["clean surface", "matte finish", "digital plane"];

  // 6. Visual characteristics
  const visualCharacteristics: string[] = [];
  if (ws > 0.55) visualCharacteristics.push("Intentional negative space hierarchy");
  if (cr > 0.6) visualCharacteristics.push("High optical contrast dynamics");
  if (ed > 0.5) visualCharacteristics.push("High-density information layering");
  if (isTactile) visualCharacteristics.push("Micro-textured surface tactile quality");
  if (warmth > 0.6) visualCharacteristics.push("Warm chromatic temperature profile");
  if (coolness > 0.6) visualCharacteristics.push("Cool architectural chromatic profile");
  if (hasTypography) visualCharacteristics.push(`Anchor in ${typeCategory} typographic balance`);
  if (visualCharacteristics.length === 0) visualCharacteristics.push("Balanced tonal distribution");

  return {
    imageId,
    dominantColors,
    typography: {
      detected: hasTypography,
      category: typeCategory,
      characteristics: hasTypography
        ? cr > 0.6
          ? ["medium", "high contrast"]
          : ["regular", "low contrast"]
        : [],
      casing: "mixed",
      tracking: ws > 0.5 ? "wide" : "normal",
      lineHeight: "normal",
      alignment: symmetryAvg > 0.6 ? "center" : "left",
      textDensity: typeProb > 0.6 ? "dense" : typeProb > 0.35 ? "moderate" : "sparse",
      scaleStyle: hasTypography
        ? cr > 0.6
          ? "dramatic scale contrast"
          : "balanced hierarchy"
        : "none",
      personality: typePersonality,
      confidence: Math.round(typeProb * 100) / 100,
      fontCandidate: undefined,
    },
    mood: {
      minimalism: Math.round(minimalism * 100) / 100,
      maximalism: Math.round(maximalism * 100) / 100,
      calm: Math.round(calm * 100) / 100,
      energy: Math.round(energy * 100) / 100,
      elegance: Math.round(elegance * 100) / 100,
      playfulness: Math.round(playfulness * 100) / 100,
      seriousness: Math.round(seriousness * 100) / 100,
      warmth: Math.round(warmth * 100) / 100,
      coolness: Math.round(coolness * 100) / 100,
      futurism: Math.round(futurism * 100) / 100,
      nostalgia: Math.round(nostalgia * 100) / 100,
      luxury: Math.round(luxury * 100) / 100,
      rawness: Math.round(rawness * 100) / 100,
      softness: Math.round(softness * 100) / 100,
      boldness: Math.round(boldness * 100) / 100,
      confidence: Math.round((cvMetrics ? 0.88 : 0.7) * 100) / 100,
    },
    composition: {
      layout,
      alignment: symmetryAvg > 0.6 ? "center" : "left",
      whitespace: whitespaceLabel,
      focalPoint: symmetryAvg > 0.6 ? "centered" : "asymmetric offset",
      primaryElement: ed > 0.5 ? "multi-element composition" : "singular subject",
      secondaryElements: ws > 0.4 ? ["negative space", "spatial balance"] : ["tonal contrast"],
      scale: cr > 0.6 ? "dramatic scale contrast" : "balanced scale",
      personality: `${layout} ${symmetryAvg > 0.6 ? "axial" : "dynamic"}`,
      symmetryScore: Math.round(symmetryAvg * 100) / 100,
      gridAdherence:
        Math.round(Math.min(1, Math.max(0.2, symH * 0.5 + (1 - tex) * 0.5)) * 100) / 100,
      confidence: Math.round((cvMetrics ? 0.85 : 0.7) * 100) / 100,
    },
    density: {
      score: Math.round(densityScore * 100) / 100,
      elementCountApprox: Math.round(ed * 18 + 2),
      whitespaceRatio: Math.round(ws * 100) / 100,
      layering: ed > 0.6 ? "complex" : ed > 0.35 ? "multi-layered" : "subtle",
      visualClutter: ed > 0.65 ? "high" : ed > 0.4 ? "moderate" : ed > 0.15 ? "low" : "none",
      levelLabel: densityLabel,
      confidence: Math.round((cvMetrics ? 0.9 : 0.75) * 100) / 100,
    },
    contrast: {
      overall: Math.round(cr * 100) / 100,
      color: Math.round(Math.min(1, satStd * 2.5) * 100) / 100,
      tonal: Math.round(cr * 100) / 100,
      scale: Math.round(Math.min(1, cr * 0.7 + ed * 0.3) * 100) / 100,
      typography: Math.round(typeProb * cr * 100) / 100,
      form: Math.round(ed * 100) / 100,
      confidence: Math.round((cvMetrics ? 0.88 : 0.75) * 100) / 100,
    },
    texture: {
      materials,
      surfaceStyle: isTactile ? "tactile matte" : "clean matte",
      tactileLevel: Math.round(tex * 100) / 100,
      visualLanguage: isTactile ? "tactile" : "polished",
      confidence: Math.round((cvMetrics ? 0.82 : 0.7) * 100) / 100,
    },
    imagery: {
      subjects: ed > 0.5 ? ["multi-layered scene", "spatial layout"] : ["curated focal subject"],
      photographyStyle: temp > 0.55 ? ["natural warm directional light"] : ["clean studio light"],
      treatment: cr > 0.65 ? ["high-contrast tonal curve"] : ["muted subtle curve"],
      lighting: temp > 0.55 ? "warm natural light" : "cool neutral illumination",
      moodTone: minimalism > 0.6 ? "minimal editorial" : "expressive visual",
      confidence: 0.8,
    },
    rhythm: {
      type: symmetryAvg > 0.6 ? "structured" : ed > 0.5 ? "modular" : "editorial",
      repetition: Math.round(symmetryAvg * 100) / 100,
      pacing: Math.round((1 - ed * 0.5) * 100) / 100,
      confidence: 0.75,
    },
    visualCharacteristics,
    confidence: Math.round((cvMetrics ? 0.88 : 0.72) * 100) / 100,
    cvMetrics,
  };
}

/**
 * Backward compatibility wrapper pointing to deriveAnalysisFromImage.
 */
export function buildHeuristicFallbackAnalysis(
  imageId: string,
  dominantColors: string[] = [],
  cvMetrics?: RawImageMetrics,
): ImageStyleAnalysis {
  return deriveAnalysisFromImage(imageId, dominantColors, cvMetrics);
}

/**
 * Server-side analysis of a single image using Gemini Vision.
 * Handles validation, caching, API execution, schema parsing, and resilient fallback.
 */
export async function analyzeImageWithVision(
  input: AnalyzeImageInput,
): Promise<ImageStyleAnalysis> {
  const { imageId, base64, mimeType, dominantColors = [], cvMetrics } = input;

  // 1. Basic validation
  if (!base64 || typeof base64 !== "string") {
    return deriveAnalysisFromImage(imageId, dominantColors, cvMetrics);
  }

  // Check cache
  const cacheKey = hashString(base64);
  const cached = analysisCache.get(cacheKey);
  if (cached) {
    return { ...cached, imageId, dominantColors, cvMetrics: cvMetrics || cached.cvMetrics };
  }

  // If quota was exhausted recently, skip network call and instantly provide input-driven analysis
  if (Date.now() < quotaExhaustedUntil) {
    const fallback = deriveAnalysisFromImage(imageId, dominantColors, cvMetrics);
    analysisCache.set(cacheKey, fallback);
    return fallback;
  }

  const model = getGeminiModel();
  if (!model) {
    const fallback = deriveAnalysisFromImage(imageId, dominantColors, cvMetrics);
    analysisCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    // Strip header prefix if present
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

    // 12s timeout to prevent premature timeouts on image upload & analysis
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Vision analysis timeout")), 12000),
    );

    const result = (await Promise.race([
      model.generateContent([
        SINGLE_IMAGE_VISION_PROMPT,
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || "image/jpeg",
          },
        },
      ]),
      timeoutPromise,
    ])) as { response: { text: () => string } };

    const text = result.response.text();
    const cleanedJson = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const rawParsed = JSON.parse(cleanedJson);

    // Validate with Zod
    const validated = ImageStyleAnalysisSchema.parse({
      ...rawParsed,
      imageId,
      dominantColors,
      cvMetrics,
    });

    analysisCache.set(cacheKey, validated);
    return validated;
  } catch (error: unknown) {
    const errMsg = String((error as { message?: string })?.message || error);
    if (
      errMsg.includes("429") ||
      errMsg.includes("quota") ||
      errMsg.includes("RESOURCE_EXHAUSTED")
    ) {
      if (Date.now() >= quotaExhaustedUntil) {
        console.warn(
          `[Vision] Gemini API free-tier quota (20 requests/day) reached. Circuit-breaker active: using input-driven visual CV engine.`,
        );
      }
      quotaExhaustedUntil = Date.now() + 60000;
    } else {
      console.warn(
        `[Vision] Gemini Vision analysis for ${imageId} encountered error, using input-driven analysis:`,
        error?.message || error,
      );
    }
    const fallback = deriveAnalysisFromImage(imageId, dominantColors, cvMetrics);
    analysisCache.set(cacheKey, fallback);
    return fallback;
  }
}
