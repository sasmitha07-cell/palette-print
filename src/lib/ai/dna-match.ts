import type { RawImageMetrics } from "@/lib/cv-analysis";
import { buildStyleDNAContext, type StyleDNAContext } from "./context";

export interface DNAMatchScoreBreakdown {
  overall: number; // 0 - 100
  color: number; // 0 - 100
  composition: number; // 0 - 100
  density: number; // 0 - 100
  contrast: number; // 0 - 100
  texture: number; // 0 - 100
  typography: number; // 0 - 100
  mood: number; // 0 - 100
  imagery: number; // 0 - 100
  rhythm: number; // 0 - 100

  strengths: string[];
  mismatches: string[];
  recommendations: string[];
  explanations: {
    color: string;
    composition: string;
    density: string;
    contrast: string;
    texture: string;
    typography: string;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Compares an uploaded design's genuine computer vision metrics against
 * the user's active Style DNA.
 *
 * NO Math.random() or fake numbers: every score is mathematically derived from
 * pixel-level Euclidean/absolute deltas.
 */
export function calculateRealDNAMatch(
  metrics: RawImageMetrics,
  dna: unknown,
): DNAMatchScoreBreakdown {
  const ctx = buildStyleDNAContext(dna);

  // 1. Color Alignment
  // Compare temperature (warm vs cool) and saturation against authoritative DNA palette
  const dnaTemp = ctx.palette.temperature;
  const dnaSat = ctx.palette.saturation;
  const tempSim = 1 - Math.abs(metrics.temperature - dnaTemp);
  const satSim = 1 - Math.abs(metrics.saturationMean - dnaSat);
  const colorScore = Math.round(clamp((tempSim * 0.6 + satSim * 0.4) * 100, 15, 99));

  // 2. Composition Alignment
  // Compare whitespace ratio and symmetry against DNA composition rules
  const dnaWhitespace = ctx.composition.whitespace;
  const dnaSymmetry = ctx.composition.symmetry;
  const wsSim = 1 - Math.abs(metrics.whitespaceRatio - dnaWhitespace);
  const symSim = 1 - Math.abs(metrics.horizontalSymmetry - dnaSymmetry);
  const compScore = Math.round(clamp((wsSim * 0.65 + symSim * 0.35) * 100, 15, 99));

  // 3. Density Alignment
  // Compare Sobel edge density with DNA density score
  const dnaDensity = ctx.density.score;
  const densitySim = 1 - Math.abs(metrics.edgeDensity - dnaDensity);
  const densityScore = Math.round(clamp(densitySim * 100, 15, 99));

  // 4. Contrast Alignment
  // Compare RMS tonal contrast against DNA contrast
  const dnaContrast = ctx.contrast.overall;
  const contrastSim = 1 - Math.abs(metrics.contrastRms - dnaContrast);
  const contrastScore = Math.round(clamp(contrastSim * 100, 15, 99));

  // 5. Texture Alignment
  // Compare micro-grain variance against tactile depth
  const dnaTactile = ctx.texture.tactileLevel;
  const texSim = 1 - Math.abs(metrics.textureVariance - dnaTactile);
  const textureScore = Math.round(clamp(texSim * 100, 15, 99));

  // 6. Typography Alignment
  // Evaluate typographic stroke presence against DNA typography preferences
  const expectedType = ctx.typography.detected ? 0.45 : 0.2;
  const typeSim = 1 - Math.abs(metrics.typographicProbability - expectedType);
  const typeScore = Math.round(clamp(typeSim * 100, 20, 98));

  // 7. Mood & Imagery Proxies
  const moodScore = Math.round(colorScore * 0.5 + contrastScore * 0.3 + compScore * 0.2);
  const imageryScore = Math.round(textureScore * 0.5 + colorScore * 0.5);
  const rhythmScore = Math.round(compScore * 0.6 + densityScore * 0.4);

  // Weighted Overall Match Percentage
  const overall = Math.round(
    colorScore * 0.25 +
      compScore * 0.2 +
      densityScore * 0.15 +
      contrastScore * 0.15 +
      textureScore * 0.15 +
      typeScore * 0.1,
  );

  // Dynamic Explanations generated from measured deltas
  const explanations = {
    color:
      colorScore > 80
        ? `Strong alignment with your ${ctx.palette.temperatureLabel} palette (${metrics.temperature > 0.5 ? "warm" : "cool"} balance matches your ${(dnaTemp * 100).toFixed(0)}% baseline).`
        : `Color temperature (${(metrics.temperature * 100).toFixed(0)}%) deviates from your DNA's ${(dnaTemp * 100).toFixed(0)}% ${ctx.palette.temperatureLabel} signature.`,

    composition:
      compScore > 80
        ? `Negative space (${(metrics.whitespaceRatio * 100).toFixed(0)}%) closely mirrors your ${ctx.composition.whitespaceLabel}.`
        : metrics.whitespaceRatio < dnaWhitespace
          ? `Contains ${(Math.abs(metrics.whitespaceRatio - dnaWhitespace) * 100).toFixed(0)}% less negative space than your DNA expects (${ctx.composition.whitespaceLabel}).`
          : `Vastly more sparse than your typical balanced layout preference.`,

    density:
      densityScore > 80
        ? `Visual density matches your ${ctx.density.label} preference (${(metrics.edgeDensity * 100).toFixed(0)}% edge density).`
        : metrics.edgeDensity > dnaDensity
          ? `Information density is ${(Math.abs(metrics.edgeDensity - dnaDensity) * 100).toFixed(0)}% higher than your DNA threshold; layout reads cluttered.`
          : `Visual elements are substantially more minimal than your balanced signature.`,

    contrast:
      contrastScore > 80
        ? `Tonal luminance dynamic (${(metrics.contrastRms * 100).toFixed(0)}%) is faithful to your contrast baseline.`
        : metrics.contrastRms > dnaContrast
          ? `Luminance contrast is too severe; your DNA favors subtle tonal restraint.`
          : `Tonal range is flatter than your DNA's ${(dnaContrast * 100).toFixed(0)}% baseline.`,

    texture:
      textureScore > 80
        ? `Surface tactile finish aligns with your ${ctx.texture.surfaceStyle} material quality.`
        : `Surface finish lacks your DNA's characteristic ${ctx.texture.surfaceStyle} depth.`,

    typography:
      typeScore > 80
        ? `Text proportion and hierarchy presence adhere to your ${ctx.typography.primaryCategory} standards.`
        : `Text density or stroke hierarchy diverges from your ${ctx.typography.personality} typography.`,
  };

  // Strengths (scores >= 78)
  const strengths: string[] = [];
  if (colorScore >= 78)
    strengths.push(
      `Harmonious color balance aligned with ${ctx.palette.primary.hex} & ${ctx.palette.accent.hex}`,
    );
  if (compScore >= 78)
    strengths.push(`Spatial breathing room honors your ${ctx.composition.whitespaceLabel}`);
  if (densityScore >= 78)
    strengths.push(`Visual density matches your ${ctx.density.label} preference`);
  if (contrastScore >= 78)
    strengths.push(`RMS tonal dynamic maintains authentic contrast hierarchy`);
  if (textureScore >= 78)
    strengths.push(`Tactile quality reflects your ${ctx.texture.surfaceStyle} preference`);
  if (typeScore >= 78)
    strengths.push(`Typographic balance mirrors your ${ctx.typography.primaryCategory} styling`);

  if (strengths.length === 0) {
    strengths.push(`Shares baseline palette family`);
  }

  // Mismatches (scores < 75)
  const mismatches: string[] = [];
  if (colorScore < 75)
    mismatches.push(
      `Color temperature is ${metrics.temperature > dnaTemp ? "warmer" : "cooler"} than your ${ctx.palette.temperatureLabel} DNA`,
    );
  if (compScore < 75)
    mismatches.push(
      `Negative space deviates by ${(Math.abs(metrics.whitespaceRatio - dnaWhitespace) * 100).toFixed(0)}% from your signature`,
    );
  if (densityScore < 75)
    mismatches.push(
      `Edge clutter is ${metrics.edgeDensity > dnaDensity ? "higher" : "lower"} than your DNA baseline`,
    );
  if (contrastScore < 75)
    mismatches.push(
      `Contrast level is ${metrics.contrastRms > dnaContrast ? "too aggressive" : "under-contrasted"}`,
    );
  if (textureScore < 75) mismatches.push(`Missing tactile ${ctx.texture.surfaceStyle} finish`);

  // Actionable Recommendations derived from weakest dimensions
  const recommendations: string[] = [];
  const scoresRanked = [
    { dim: "color", score: colorScore },
    { dim: "comp", score: compScore },
    { dim: "density", score: densityScore },
    { dim: "contrast", score: contrastScore },
    { dim: "texture", score: textureScore },
  ].sort((a, b) => a.score - b.score);

  for (const item of scoresRanked.slice(0, 3)) {
    if (item.dim === "color") {
      recommendations.push(
        metrics.temperature > dnaTemp
          ? `Cool down the palette tones toward ${ctx.palette.neutral.hex} and limit ${ctx.palette.accent.hex} to solitary points.`
          : `Warm up the background using your authoritative neutral (${ctx.palette.neutral.hex}).`,
      );
    } else if (item.dim === "comp") {
      recommendations.push(
        metrics.whitespaceRatio < dnaWhitespace
          ? `Increase margin whitespace by 20% to achieve your DNA's ${ctx.composition.whitespaceLabel}.`
          : `Tighten outer margins to reduce excessive negative void.`,
      );
    } else if (item.dim === "density") {
      recommendations.push(
        metrics.edgeDensity > dnaDensity
          ? `Remove secondary decorative dividers and reduce card borders to eliminate clutter.`
          : `Introduce subtle structural rules to give the composition grounded weight.`,
      );
    } else if (item.dim === "contrast") {
      recommendations.push(
        metrics.contrastRms > dnaContrast
          ? `Soften deep blacks to ${ctx.palette.primary.hex} to preserve tonal elegance.`
          : `Deepen the primary headline tone to ${ctx.palette.primary.hex} for punchier hierarchy.`,
      );
    } else if (item.dim === "texture") {
      recommendations.push(
        `Apply a subtle ${ctx.texture.surfaceStyle} grain or paper stock texture to reduce digital flat-finish.`,
      );
    }
  }

  return {
    overall,
    color: colorScore,
    composition: compScore,
    density: densityScore,
    contrast: contrastScore,
    texture: textureScore,
    typography: typeScore,
    mood: moodScore,
    imagery: imageryScore,
    rhythm: rhythmScore,
    strengths,
    mismatches,
    recommendations,
    explanations,
  };
}
