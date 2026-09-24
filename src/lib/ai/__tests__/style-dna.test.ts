// src/lib/ai/__tests__/style-dna.test.ts
import { synthesizeStyleDNA, aggregateAnalyses } from "../synthesis";
import type { ImageStyleAnalysis } from "../schemas";

function createMockImageAnalysis(overrides: Partial<ImageStyleAnalysis> = {}): ImageStyleAnalysis {
  return {
    imageId: "img_test",
    dominantColors: ["#1A1918", "#E2D5C0", "#CF5A3C"],
    typography: {
      detected: true,
      category: "serif",
      characteristics: ["medium", "high contrast"],
      casing: "mixed",
      tracking: "normal",
      lineHeight: "normal",
      alignment: "left",
      textDensity: "sparse",
      scaleStyle: "editorial hierarchy",
      personality: "editorial",
      confidence: 0.8,
      fontCandidate: undefined,
    },
    mood: {
      minimalism: 0.85,
      maximalism: 0.15,
      calm: 0.8,
      energy: 0.3,
      elegance: 0.85,
      playfulness: 0.2,
      seriousness: 0.75,
      warmth: 0.7,
      coolness: 0.3,
      futurism: 0.3,
      nostalgia: 0.6,
      luxury: 0.8,
      rawness: 0.4,
      softness: 0.7,
      boldness: 0.4,
      confidence: 0.8,
    },
    composition: {
      layout: "editorial",
      alignment: "left",
      whitespace: "generous",
      focalPoint: "offset anchor",
      primaryElement: "subject",
      secondaryElements: ["whitespace"],
      scale: "balanced scale",
      personality: "structured editorial",
      symmetryScore: 0.4,
      gridAdherence: 0.8,
      confidence: 0.85,
    },
    density: {
      score: 0.3,
      elementCountApprox: 5,
      whitespaceRatio: 0.7,
      layering: "subtle",
      visualClutter: "low",
      levelLabel: "sparse",
      confidence: 0.8,
    },
    contrast: {
      overall: 0.7,
      color: 0.6,
      tonal: 0.8,
      scale: 0.7,
      typography: 0.6,
      form: 0.5,
      confidence: 0.8,
    },
    texture: {
      materials: ["paper", "fine grain"],
      surfaceStyle: "matte",
      tactileLevel: 0.6,
      visualLanguage: "tactile",
      confidence: 0.75,
    },
    imagery: {
      subjects: ["editorial composition"],
      photographyStyle: ["natural light"],
      treatment: ["clean", "muted palette"],
      lighting: "natural directional",
      moodTone: "editorial",
      confidence: 0.8,
    },
    rhythm: {
      type: "editorial",
      repetition: 0.4,
      pacing: 0.6,
      confidence: 0.75,
    },
    visualCharacteristics: ["Generous whitespace", "High tonal contrast", "Serif headlines"],
    confidence: 0.82,
    ...overrides,
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("STYLE DNA PHASE 2 — VALIDATION TEST SUITE");
  console.log("========================================================\n");

  // --------------------------------------------------------------------------
  // TEST CASE 1: 10 visually similar images -> Strong consistent DNA
  // --------------------------------------------------------------------------
  console.log("TEST CASE 1: 10 visually similar images");
  const case1Analyses = Array.from({ length: 10 }, (_, i) =>
    createMockImageAnalysis({
      imageId: `c1_img_${i + 1}`,
      mood: {
        minimalism: 0.85 + (i % 3) * 0.02,
        maximalism: 0.15,
        calm: 0.8,
        energy: 0.25,
        elegance: 0.9,
        playfulness: 0.15,
        seriousness: 0.8,
        warmth: 0.75,
        coolness: 0.25,
        futurism: 0.2,
        nostalgia: 0.6,
        luxury: 0.85,
        rawness: 0.35,
        softness: 0.75,
        boldness: 0.45,
        confidence: 0.85,
      },
    }),
  );
  const palette1 = ["#1A1918", "#E2D5C0", "#CF5A3C", "#FDFCF8"];
  const dna1 = await synthesizeStyleDNA(case1Analyses, palette1);

  assert(
    dna1.mood.minimalism >= 0.8,
    "Minimalism is strong and dominant",
    `got ${dna1.mood.minimalism}`,
  );
  assert(
    dna1.composition.layoutStyle === "editorial",
    "Layout matches consistent editorial structure",
  );
  assert(
    dna1.confidence.overall >= 0.75,
    "Overall confidence is high",
    `got ${dna1.confidence.overall}`,
  );
  assert(
    dna1.evidence.some(
      (e) => e.strength === "dominant pattern" || e.strength === "strong recurring",
    ),
    "Traceability evidence identifies dominant patterns",
  );
  assert(
    dna1.principles.length >= 5,
    "Generated 5-8 design principles",
    `got ${dna1.principles.length}`,
  );
  assert(dna1.doList.length >= 3, "Generated actionable DO list", `got ${dna1.doList.length}`);
  assert(
    dna1.dontList.length >= 3,
    "Generated actionable DON'T list",
    `got ${dna1.dontList.length}`,
  );

  // --------------------------------------------------------------------------
  // TEST CASE 2: 9 minimal images + 1 highly maximal image (Outlier resistance)
  // --------------------------------------------------------------------------
  console.log("\nTEST CASE 2: 9 minimal images + 1 maximal image (Outlier Resistance)");
  const case2Analyses = [
    // 9 Minimal images
    ...Array.from({ length: 9 }, (_, i) =>
      createMockImageAnalysis({
        imageId: `c2_minimal_${i + 1}`,
        mood: {
          minimalism: 0.9,
          maximalism: 0.1,
          calm: 0.85,
          energy: 0.2,
          elegance: 0.9,
          playfulness: 0.1,
          seriousness: 0.8,
          warmth: 0.7,
          coolness: 0.3,
          futurism: 0.2,
          nostalgia: 0.5,
          luxury: 0.85,
          rawness: 0.3,
          softness: 0.7,
          boldness: 0.3,
          confidence: 0.85,
        },
        density: {
          score: 0.25,
          elementCountApprox: 3,
          whitespaceRatio: 0.75,
          layering: "flat",
          visualClutter: "none",
          levelLabel: "sparse",
          confidence: 0.85,
        },
      }),
    ),
    // 1 Maximal outlier image (e.g. neon chaotic collage)
    createMockImageAnalysis({
      imageId: "c2_maximal_outlier",
      mood: {
        minimalism: 0.05,
        maximalism: 0.95,
        calm: 0.1,
        energy: 0.95,
        elegance: 0.2,
        playfulness: 0.85,
        seriousness: 0.2,
        warmth: 0.5,
        coolness: 0.5,
        futurism: 0.8,
        nostalgia: 0.1,
        luxury: 0.3,
        rawness: 0.9,
        softness: 0.1,
        boldness: 0.95,
        confidence: 0.7,
      },
      density: {
        score: 0.95,
        elementCountApprox: 25,
        whitespaceRatio: 0.05,
        layering: "complex",
        visualClutter: "high",
        levelLabel: "extremely dense",
        confidence: 0.7,
      },
    }),
  ];
  const dna2 = await synthesizeStyleDNA(case2Analyses, palette1);

  assert(
    dna2.mood.minimalism >= 0.75,
    "Minimalism remains dominant despite 1 maximal outlier",
    `minimalism = ${dna2.mood.minimalism}`,
  );
  assert(
    dna2.mood.maximalism <= 0.35,
    "Maximalism outlier is properly damped",
    `maximalism = ${dna2.mood.maximalism}`,
  );
  assert(
    dna2.density <= 0.45,
    "Visual density remains sparse/balanced and is not skewed by outlier",
    `density = ${dna2.density}`,
  );

  // --------------------------------------------------------------------------
  // TEST CASE 3: 10 images with different colors but identical composition
  // --------------------------------------------------------------------------
  console.log("\nTEST CASE 3: 10 images with diverse colors but identical composition");
  const diverseHexPalette = [
    "#FF0055",
    "#00CC88",
    "#0066FF",
    "#FFAA00",
    "#9900FF",
    "#00EEFF",
    "#333333",
    "#FDFCF8",
    "#E2D5C0",
    "#CF5A3C",
  ];
  const case3Analyses = Array.from({ length: 10 }, (_, i) =>
    createMockImageAnalysis({
      imageId: `c3_img_${i + 1}`,
      composition: {
        layout: "editorial",
        alignment: "left",
        whitespace: "generous",
        focalPoint: "offset anchor",
        primaryElement: "subject",
        secondaryElements: ["whitespace"],
        scale: "balanced scale",
        personality: "structured editorial",
        symmetryScore: 0.35,
        gridAdherence: 0.85,
        confidence: 0.9,
      },
    }),
  );
  const dna3 = await synthesizeStyleDNA(case3Analyses, diverseHexPalette);

  assert(
    dna3.composition.layoutStyle === "editorial",
    "Composition layout remains strictly editorial",
    dna3.composition.layoutStyle,
  );
  assert(
    dna3.composition.whitespace >= 0.7,
    "Whitespace remains generous",
    `whitespace = ${dna3.composition.whitespace}`,
  );
  assert(
    dna3.palette.rawHexList.length === 10,
    "Authoritative palette reflects all extracted colors without mutation",
    `length = ${dna3.palette.rawHexList.length}`,
  );
  assert(
    dna3.confidence.composition >= 0.8,
    "Composition confidence is high",
    `composition confidence = ${dna3.confidence.composition}`,
  );

  // --------------------------------------------------------------------------
  // TEST CASE 4: Images with little/no typography
  // --------------------------------------------------------------------------
  console.log("\nTEST CASE 4: Images with no typography");
  const case4Analyses = Array.from({ length: 10 }, (_, i) =>
    createMockImageAnalysis({
      imageId: `c4_notype_${i + 1}`,
      typography: {
        detected: false,
        category: "none",
        characteristics: [],
        casing: "mixed",
        tracking: "normal",
        lineHeight: "normal",
        alignment: "left",
        textDensity: "sparse",
        scaleStyle: "none",
        personality: "neutral",
        confidence: 0.0,
        fontCandidate: undefined,
      },
    }),
  );
  const dna4 = await synthesizeStyleDNA(case4Analyses, palette1);

  assert(
    dna4.confidence.typography === 0,
    "Typography confidence is 0 when no typography is detected in images",
    `typography confidence = ${dna4.confidence.typography}`,
  );
  assert(
    dna4.confidence.typography < dna4.confidence.palette,
    "Typography confidence is significantly lower than palette confidence",
    `type=${dna4.confidence.typography}, palette=${dna4.confidence.palette}`,
  );

  // --------------------------------------------------------------------------
  // TEST CASE 5: Mixed media (Photography + Architecture + Graphic Design)
  // --------------------------------------------------------------------------
  console.log("\nTEST CASE 5: Mixed media (Photography + Architecture + Graphic Design)");
  const case5Analyses = [
    // 4 Editorial portraits & photography
    ...Array.from({ length: 4 }, (_, i) =>
      createMockImageAnalysis({
        imageId: `c5_photo_${i + 1}`,
        imagery: {
          subjects: ["editorial portrait", "still life"],
          photographyStyle: ["natural directional light"],
          treatment: ["clean", "muted palette"],
          lighting: "natural window light",
          moodTone: "editorial",
          confidence: 0.8,
        },
      }),
    ),
    // 3 Architecture & spatial studies
    ...Array.from({ length: 3 }, (_, i) =>
      createMockImageAnalysis({
        imageId: `c5_arch_${i + 1}`,
        imagery: {
          subjects: ["architectural spatial study", "concrete facade"],
          photographyStyle: ["straight-on documentary"],
          treatment: ["monochrome", "crisp shadow"],
          lighting: "hard afternoon sun",
          moodTone: "austere",
          confidence: 0.85,
        },
        texture: {
          materials: ["concrete", "stone", "matte glass"],
          surfaceStyle: "matte",
          tactileLevel: 0.8,
          visualLanguage: "tactile",
          confidence: 0.8,
        },
      }),
    ),
    // 3 Graphic design spreads
    ...Array.from({ length: 3 }, (_, i) =>
      createMockImageAnalysis({
        imageId: `c5_graphic_${i + 1}`,
        typography: {
          detected: true,
          category: "serif",
          characteristics: ["high contrast", "medium"],
          casing: "mixed",
          tracking: "normal",
          lineHeight: "normal",
          alignment: "left",
          textDensity: "sparse",
          scaleStyle: "editorial hierarchy",
          personality: "editorial",
          confidence: 0.85,
        },
      }),
    ),
  ];
  const dna5 = await synthesizeStyleDNA(case5Analyses, palette1);

  assert(
    dna5.identity.name.length > 3,
    "Generated intelligent, evocative style name from mixed media",
    dna5.identity.name,
  );
  assert(
    dna5.principles.length >= 5,
    "Synthesized unified design principles across mixed media",
    `count = ${dna5.principles.length}`,
  );
  assert(
    dna5.evidence.length >= 3,
    "Synthesized cross-media traceability evidence",
    `evidence count = ${dna5.evidence.length}`,
  );

  console.log("\n========================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
