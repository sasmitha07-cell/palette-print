// src/verify-dna.ts
import { deriveAnalysisFromImage } from "./lib/ai/vision";
import { synthesizeStyleDNA } from "./lib/ai/synthesis";

console.log("=== PALETTE PRINT STYLE DNA: RADICAL DIFFERENCE VERIFICATION ===");

// -------------------------------------------------------------
// SET A: Minimal, Light, High Whitespace, Subtle Warm Neutral
// -------------------------------------------------------------
const setA_cvMetrics = {
  imageId: "ref_1",
  width: 1200,
  height: 1600,
  aspectRatio: 0.75,
  luminanceMean: 0.88,
  contrastRms: 0.28,
  saturationMean: 0.12,
  saturationStdDev: 0.08,
  temperature: 0.68,
  edgeDensity: 0.11, // very sparse edges
  whitespaceRatio: 0.78, // vast negative space
  horizontalSymmetry: 0.52,
  verticalSymmetry: 0.48,
  textureVariance: 0.55, // tactile paper grain
  typographicProbability: 0.08, // NO typography
};

const setA_colors = ["#F8F6F0", "#EAE4D7", "#D4C5B0", "#C86D51", "#2B2824"];

const setA_analyses = Array.from({ length: 10 }, (_, i) =>
  deriveAnalysisFromImage(`img_a_${i + 1}`, setA_colors, {
    ...setA_cvMetrics,
    edgeDensity: 0.1 + (i % 3) * 0.02,
    whitespaceRatio: 0.76 + (i % 2) * 0.04,
  }),
);

// -------------------------------------------------------------
// SET B: Maximal, Dark, Complex Clutter, High Saturation, Digital
// -------------------------------------------------------------
const setB_cvMetrics = {
  imageId: "ref_1",
  width: 1600,
  height: 900,
  aspectRatio: 1.77,
  luminanceMean: 0.22,
  contrastRms: 0.84,
  saturationMean: 0.72,
  saturationStdDev: 0.35,
  temperature: 0.25, // cool cyan/blue
  edgeDensity: 0.79, // dense clutter / complex layers
  whitespaceRatio: 0.14, // wall-to-wall graphics
  horizontalSymmetry: 0.35,
  verticalSymmetry: 0.32,
  textureVariance: 0.18, // smooth digital vector
  typographicProbability: 0.82, // dense typography detected!
};

const setB_colors = ["#0A0E17", "#1E293B", "#38BDF8", "#F43F5E", "#F8FAFC"];

const setB_analyses = Array.from({ length: 10 }, (_, i) =>
  deriveAnalysisFromImage(`img_b_${i + 1}`, setB_colors, {
    ...setB_cvMetrics,
    edgeDensity: 0.75 + (i % 3) * 0.03,
    whitespaceRatio: 0.12 + (i % 2) * 0.03,
  }),
);

async function runTest() {
  const dnaA = await synthesizeStyleDNA(setA_analyses, setA_colors);
  const dnaB = await synthesizeStyleDNA(setB_analyses, setB_colors);

  console.log("\n--- SET A (Minimal / Light / Tactile / No Text) ---");
  console.log("Style Name:       ", dnaA.identity.name);
  console.log("Tagline:          ", dnaA.identity.tagline);
  console.log("Minimalism:       ", dnaA.mood.minimalism);
  console.log("Maximalism:       ", dnaA.mood.maximalism);
  console.log("Energy:           ", dnaA.mood.energy);
  console.log("Density Score:    ", dnaA.density, `(${dnaA.densityLabel})`);
  console.log("Contrast Overall: ", dnaA.contrast.overall);
  console.log(
    "Typography:       ",
    dnaA.typography.detected ? "DETECTED" : "NOT DETECTED (Honest)",
    dnaA.typography.primaryCategory,
  );
  console.log("Principles:       ", dnaA.principles.slice(0, 3));
  console.log("Design Twins:     ", dnaA.twins.map((t) => `${t.name} (${t.match}%)`).join(", "));
  console.log("Radar Fingerprint:", dnaA.fingerprint);

  console.log("\n--- SET B (Maximal / Dark / Cluttered / High Saturation / Dense Text) ---");
  console.log("Style Name:       ", dnaB.identity.name);
  console.log("Tagline:          ", dnaB.identity.tagline);
  console.log("Minimalism:       ", dnaB.mood.minimalism);
  console.log("Maximalism:       ", dnaB.mood.maximalism);
  console.log("Energy:           ", dnaB.mood.energy);
  console.log("Density Score:    ", dnaB.density, `(${dnaB.densityLabel})`);
  console.log("Contrast Overall: ", dnaB.contrast.overall);
  console.log(
    "Typography:       ",
    dnaB.typography.detected ? "DETECTED" : "NOT DETECTED",
    dnaB.typography.primaryCategory,
  );
  console.log("Principles:       ", dnaB.principles.slice(0, 3));
  console.log("Design Twins:     ", dnaB.twins.map((t) => `${t.name} (${t.match}%)`).join(", "));
  console.log("Radar Fingerprint:", dnaB.fingerprint);

  // Assertions
  const diffMinimalism = Math.abs(dnaA.mood.minimalism - dnaB.mood.minimalism);
  const diffDensity = Math.abs(dnaA.density - dnaB.density);
  const diffContrast = Math.abs(dnaA.contrast.overall - dnaB.contrast.overall);

  console.log("\n--- DELTAS ---");
  console.log("Minimalism Delta: ", diffMinimalism.toFixed(2), "(Target: > 0.40)");
  console.log("Density Delta:    ", diffDensity.toFixed(2), "(Target: > 0.40)");
  console.log("Contrast Delta:   ", diffContrast.toFixed(2), "(Target: > 0.35)");

  if (
    diffMinimalism > 0.4 &&
    diffDensity > 0.4 &&
    diffContrast > 0.35 &&
    dnaA.identity.name !== dnaB.identity.name
  ) {
    console.log(
      "\n>>> SUCCESS: Set A and Set B produced radically different, 100% input-driven Style DNA! <<<\n",
    );
  } else {
    console.error("\n>>> FAILED: Insufficient difference between sets! <<<\n");
    process.exit(1);
  }
}

runTest().catch(console.error);
