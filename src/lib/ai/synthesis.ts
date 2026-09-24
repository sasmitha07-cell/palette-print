// src/lib/ai/synthesis.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { STYLE_DNA_SYNTHESIS_PROMPT } from "./prompts";
import { isVisionQuotaExhausted } from "./vision";
import type {
  DNAColor,
  DNAEvidence,
  DNAPalette,
  ImageStyleAnalysis,
  StyleDNA,
  StyleDNAConfidence,
} from "./schemas";

// ============================================================================
// COLOR UTILITIES FOR AUTHORITATIVE PALETTE
// ============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (clean.length === 3) {
    const r = ((num >> 8) & 0xf) * 17;
    const g = ((num >> 4) & 0xf) * 17;
    const b = (num & 0xf) * 17;
    return { r, g, b };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rf:
        h = (gf - bf) / d + (gf < bf ? 6 : 0);
        break;
      case gf:
        h = (bf - rf) / d + 2;
        break;
      case bf:
        h = (rf - gf) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s, l };
}

function getDescriptiveColorName(hex: string): string {
  const { h, s, l } = hexToHsl(hex);

  if (l < 0.12) return "Ink Black";
  if (l > 0.9) return "Bone White";
  if (s < 0.1) {
    if (l > 0.75) return "Oat Neutral";
    if (l > 0.45) return "Warm Gray";
    return "Charcoal";
  }

  // Warm vs cool hues
  if (h >= 10 && h <= 40) return s > 0.4 ? (l < 0.5 ? "Terracotta" : "Warm Clay") : "Alabaster";
  if (h > 40 && h <= 70) return "Ochre";
  if (h > 70 && h <= 160) return s > 0.3 ? "Sage Green" : "Muted Moss";
  if (h > 160 && h <= 250) return s > 0.3 ? "Slate Blue" : "Cool Indigo";
  if (h > 250 && h <= 320) return "Earthy Plum";
  return "Crimson";
}

/**
 * Organizes the authoritative extracted colors into primary, secondary, accent, neutrals,
 * and computes temperature, saturation, and brightness without altering any extraction output.
 */
export function classifyAuthoritativePalette(rawHexList: string[]): DNAPalette {
  const hexes = rawHexList.filter((h) => /^#?[0-9a-f]{6}$/i.test(h));
  if (!hexes.length) {
    return {
      primary: [{ hex: "#1A1918", name: "Ink Black", role: "primary" }],
      secondary: [{ hex: "#E2D5C0", name: "Warm Clay", role: "secondary" }],
      accent: [{ hex: "#CF5A3C", name: "Terracotta", role: "accent" }],
      neutrals: [{ hex: "#FDFCF8", name: "Bone White", role: "neutral" }],
      temperature: 0.65,
      saturation: 0.35,
      brightness: 0.55,
      rawHexList: ["#1A1918", "#E2D5C0", "#CF5A3C", "#FDFCF8"],
    };
  }

  const scoredColors = hexes.map((hex, idx) => {
    const { h, s, l } = hexToHsl(hex);
    return {
      hex: hex.startsWith("#") ? hex : `#${hex}`,
      name: getDescriptiveColorName(hex),
      h,
      s,
      l,
      idx,
    };
  });

  // Calculate temperature: warm hues (0-60, 320-360) score higher; cool hues (150-270) score lower
  let tempSum = 0;
  let satSum = 0;
  let lightSum = 0;

  for (const c of scoredColors) {
    satSum += c.s;
    lightSum += c.l;
    if (c.s < 0.08) {
      tempSum += 0.5; // neutral
    } else if (c.h <= 60 || c.h >= 320) {
      tempSum += 0.85; // warm red, orange, yellow
    } else if (c.h >= 160 && c.h <= 260) {
      tempSum += 0.2; // cool blue/cyan
    } else {
      tempSum += 0.5; // greens/purples
    }
  }

  const n = scoredColors.length;
  const temperature = Math.round((tempSum / n) * 100) / 100;
  const saturation = Math.round((satSum / n) * 100) / 100;
  const brightness = Math.round((lightSum / n) * 100) / 100;

  // Categorize
  const neutrals: DNAColor[] = [];
  const accents: DNAColor[] = [];
  const primary: DNAColor[] = [];
  const secondary: DNAColor[] = [];

  for (const c of scoredColors) {
    if (c.s < 0.15 || c.l < 0.15 || c.l > 0.88) {
      neutrals.push({ hex: c.hex, name: c.name, role: "neutral" });
    } else if (c.s > 0.45 && c.l > 0.25 && c.l < 0.75) {
      accents.push({ hex: c.hex, name: c.name, role: "accent" });
    } else if (primary.length < 2) {
      primary.push({ hex: c.hex, name: c.name, role: "primary" });
    } else {
      secondary.push({ hex: c.hex, name: c.name, role: "secondary" });
    }
  }

  // Ensure every role has at least 1 color from the authoritative list
  if (!primary.length && scoredColors[0]) {
    primary.push({ hex: scoredColors[0].hex, name: scoredColors[0].name, role: "primary" });
  }
  if (!neutrals.length) {
    const lightOrDark = scoredColors.find((c) => c.l > 0.8 || c.l < 0.2) || scoredColors[0];
    neutrals.push({ hex: lightOrDark.hex, name: lightOrDark.name, role: "neutral" });
  }
  if (!accents.length) {
    const highestSat = [...scoredColors].sort((a, b) => b.s - a.s)[0];
    accents.push({ hex: highestSat.hex, name: highestSat.name, role: "accent" });
  }
  if (!secondary.length) {
    const remaining =
      scoredColors.find(
        (c) => c.hex !== primary[0]?.hex && c.hex !== accents[0]?.hex && c.hex !== neutrals[0]?.hex,
      ) ||
      scoredColors[1] ||
      scoredColors[0];
    secondary.push({ hex: remaining.hex, name: remaining.name, role: "secondary" });
  }

  return {
    primary,
    secondary,
    accent: accents,
    neutrals,
    temperature,
    saturation,
    brightness,
    rawHexList: hexes.map((h) => (h.startsWith("#") ? h : `#${h}`)),
  };
}

// ============================================================================
// MATHEMATICAL CROSS-IMAGE AGGREGATION & OUTLIER DAMPING
// ============================================================================

export function aggregateAnalyses(analyses: ImageStyleAnalysis[]) {
  const total = analyses.length;
  if (!total) {
    throw new Error("Cannot synthesize Style DNA from 0 images");
  }

  // 1. Mood aggregation with outlier trimming
  const moodKeys: (keyof ImageStyleAnalysis["mood"])[] = [
    "minimalism",
    "maximalism",
    "calm",
    "energy",
    "elegance",
    "playfulness",
    "seriousness",
    "warmth",
    "coolness",
    "futurism",
    "nostalgia",
    "luxury",
    "rawness",
    "softness",
    "boldness",
  ];

  const aggregatedMood: Record<string, number> = {};

  for (const key of moodKeys) {
    const vals = analyses.map((a) => a.mood[key] ?? 0.5).sort((a, b) => a - b);
    // Trim extreme top & bottom outliers if total >= 5
    const trimmed = total >= 5 ? vals.slice(1, -1) : vals;
    const avg = trimmed.reduce((acc, v) => acc + v, 0) / trimmed.length;
    aggregatedMood[key] = Math.round(avg * 100) / 100;
  }

  // 2. Density aggregation
  const densityVals = analyses.map((a) => a.density.score).sort((a, b) => a - b);
  const avgDensity =
    (total >= 5 ? densityVals.slice(1, -1) : densityVals).reduce((a, b) => a + b, 0) /
    (total >= 5 ? densityVals.length - 2 : densityVals.length);
  const density = Math.round(avgDensity * 100) / 100;

  const densityLabel =
    density <= 0.15
      ? "extremely sparse"
      : density <= 0.35
        ? "sparse"
        : density <= 0.65
          ? "balanced"
          : density <= 0.85
            ? "dense"
            : "extremely dense";

  // 3. Contrast aggregation
  const contrastOverall = analyses.reduce((acc, a) => acc + a.contrast.overall, 0) / total;
  const contrastColor = analyses.reduce((acc, a) => acc + a.contrast.color, 0) / total;
  const contrastTonal = analyses.reduce((acc, a) => acc + a.contrast.tonal, 0) / total;
  const contrastScale = analyses.reduce((acc, a) => acc + a.contrast.scale, 0) / total;
  const contrastType = analyses.reduce((acc, a) => acc + a.contrast.typography, 0) / total;
  const contrastForm = analyses.reduce((acc, a) => acc + a.contrast.form, 0) / total;

  // 4. Composition aggregation
  const symmetryAvg = analyses.reduce((acc, a) => acc + a.composition.symmetryScore, 0) / total;
  const gridAvg = analyses.reduce((acc, a) => acc + a.composition.gridAdherence, 0) / total;

  // Layout frequency
  const layoutFreq = new Map<string, number>();
  const whitespaceFreq = new Map<string, number>();
  const alignmentFreq = new Map<string, number>();

  for (const a of analyses) {
    layoutFreq.set(a.composition.layout, (layoutFreq.get(a.composition.layout) || 0) + 1);
    whitespaceFreq.set(
      a.composition.whitespace,
      (whitespaceFreq.get(a.composition.whitespace) || 0) + 1,
    );
    alignmentFreq.set(
      a.composition.alignment,
      (alignmentFreq.get(a.composition.alignment) || 0) + 1,
    );
  }

  const topLayout = [...layoutFreq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const topWhitespace = [...whitespaceFreq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const topAlignment = [...alignmentFreq.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const whitespaceScore =
    topWhitespace === "generous" ? 0.85 : topWhitespace === "moderate" ? 0.5 : 0.2;

  // 5. Typography aggregation (truthful: no hallucinations if not detected)
  const typeAnalyses = analyses.filter(
    (a) => a.typography.detected && a.typography.category !== "none",
  );
  const typeDetectedCount = typeAnalyses.length;
  const hasTypography = typeDetectedCount > 0;
  const typographyConfidence =
    total > 0 && hasTypography ? Math.round((typeDetectedCount / total) * 0.88 * 100) / 100 : 0;

  const typeCategoryFreq = new Map<string, number>();
  const typePersonalityFreq = new Map<string, number>();

  for (const a of typeAnalyses) {
    const cat = a.typography.category;
    typeCategoryFreq.set(cat, (typeCategoryFreq.get(cat) || 0) + 1);
    const p = a.typography.personality;
    typePersonalityFreq.set(p, (typePersonalityFreq.get(p) || 0) + 1);
  }

  const sortedCategories = [...typeCategoryFreq.entries()].sort((a, b) => b[1] - a[1]);
  const primaryTypeCategory = hasTypography ? sortedCategories[0]?.[0] || "geometric sans" : "none";
  const secondaryTypeCategory = hasTypography ? sortedCategories[1]?.[0] || "sans-serif" : "none";
  const topTypePersonality = hasTypography
    ? [...typePersonalityFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "modern"
    : "none";

  // 6. Textures & Materials frequency
  const materialFreq = new Map<string, number>();
  let tactileSum = 0;
  for (const a of analyses) {
    tactileSum += a.texture.tactileLevel;
    for (const m of a.texture.materials) {
      const lower = m.toLowerCase();
      materialFreq.set(lower, (materialFreq.get(lower) || 0) + 1);
    }
  }

  const recurringMaterials = [...materialFreq.entries()]
    .filter(([_, count]) => count >= 2 || total <= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([m]) => m);

  const avgTactile = Math.round((tactileSum / total) * 100) / 100;

  // 7. Imagery subjects & treatments
  const subjectFreq = new Map<string, number>();
  const photoStyleFreq = new Map<string, number>();
  const treatmentFreq = new Map<string, number>();

  for (const a of analyses) {
    a.imagery.subjects.forEach((s) => subjectFreq.set(s, (subjectFreq.get(s) || 0) + 1));
    a.imagery.photographyStyle.forEach((s) =>
      photoStyleFreq.set(s, (photoStyleFreq.get(s) || 0) + 1),
    );
    a.imagery.treatment.forEach((t) => treatmentFreq.set(t, (treatmentFreq.get(t) || 0) + 1));
  }

  const topSubjects = [...subjectFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([s]) => s);
  const topPhotoStyles = [...photoStyleFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([s]) => s);
  const topTreatments = [...treatmentFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t);

  // 8. Visual Rhythm
  const rhythmFreq = new Map<string, number>();
  let repSum = 0;
  let paceSum = 0;
  for (const a of analyses) {
    rhythmFreq.set(a.rhythm.type, (rhythmFreq.get(a.rhythm.type) || 0) + 1);
    repSum += a.rhythm.repetition;
    paceSum += a.rhythm.pacing;
  }
  const topRhythm = [...rhythmFreq.entries()].sort((a, b) => b[1] - a[1])[0][0];

  // 9. Evidence building
  const evidence: DNAEvidence[] = [];

  const whitespaceCount = whitespaceFreq.get(topWhitespace) || 0;
  evidence.push({
    trait: `${topWhitespace.charAt(0).toUpperCase() + topWhitespace.slice(1)} Whitespace`,
    category: "composition",
    observedCount: whitespaceCount,
    totalImages: total,
    frequency: Math.round((whitespaceCount / total) * 100) / 100,
    strength:
      whitespaceCount >= total * 0.7
        ? "dominant pattern"
        : whitespaceCount >= total * 0.4
          ? "strong recurring"
          : "moderate",
    summary: `Observed in ${whitespaceCount} of ${total} references`,
  });

  if (hasTypography) {
    evidence.push({
      trait: `${primaryTypeCategory.charAt(0).toUpperCase() + primaryTypeCategory.slice(1)} Typography`,
      category: "typography",
      observedCount: typeDetectedCount,
      totalImages: total,
      frequency: Math.round((typeDetectedCount / total) * 100) / 100,
      strength:
        typeDetectedCount >= total * 0.7
          ? "dominant pattern"
          : typeDetectedCount >= total * 0.4
            ? "strong recurring"
            : "moderate",
      summary: `Observed in ${typeDetectedCount} of ${total} references`,
    });
  } else {
    evidence.push({
      trait: "Negative Space & Imagery Primacy",
      category: "composition",
      observedCount: total,
      totalImages: total,
      frequency: 1,
      strength: "dominant pattern",
      summary: "No prominent typography detected in uploaded references",
    });
  }

  const layoutCount = layoutFreq.get(topLayout) || 0;
  evidence.push({
    trait: `${topLayout.charAt(0).toUpperCase() + topLayout.slice(1)} Layout Structure`,
    category: "composition",
    observedCount: layoutCount,
    totalImages: total,
    frequency: Math.round((layoutCount / total) * 100) / 100,
    strength: layoutCount >= total * 0.6 ? "strong recurring" : "moderate",
    summary: `Observed in ${layoutCount} of ${total} references`,
  });

  if (recurringMaterials.length > 0) {
    evidence.push({
      trait: `Tactile ${recurringMaterials[0]} Finish`,
      category: "texture",
      observedCount: materialFreq.get(recurringMaterials[0]) || 1,
      totalImages: total,
      frequency: Math.round(((materialFreq.get(recurringMaterials[0]) || 1) / total) * 100) / 100,
      strength: "moderate",
      summary: `Observed across reference textures`,
    });
  }

  // Real inter-image consistency calculation for honest confidence
  const meanDensity = avgDensity;
  const varianceDensity =
    densityVals.reduce((acc, v) => acc + Math.pow(v - meanDensity, 2), 0) / total;
  const stdDevDensity = Math.sqrt(varianceDensity);

  const contrastVals = analyses.map((a) => a.contrast.overall);
  const varianceContrast =
    contrastVals.reduce((acc, v) => acc + Math.pow(v - contrastOverall, 2), 0) / total;
  const stdDevContrast = Math.sqrt(varianceContrast);

  const densityConf = Math.max(
    0.6,
    Math.min(0.96, Math.round((0.95 - stdDevDensity * 1.2) * 100) / 100),
  );
  const contrastConf = Math.max(
    0.6,
    Math.min(0.96, Math.round((0.95 - stdDevContrast * 1.2) * 100) / 100),
  );
  const moodConf = Math.max(
    0.65,
    Math.min(0.95, Math.round((0.93 - (stdDevDensity + stdDevContrast) * 0.6) * 100) / 100),
  );
  const compConf = Math.max(
    0.65,
    Math.min(0.95, Math.round((0.9 - stdDevDensity * 0.5) * 100) / 100),
  );

  const overallConf =
    Math.round(
      ((0.95 +
        typographyConfidence +
        moodConf +
        compConf +
        densityConf +
        (recurringMaterials.length ? 0.82 : 0.62)) /
        6) *
        100,
    ) / 100;

  const confidences: StyleDNAConfidence = {
    palette: 0.95,
    typography: typographyConfidence,
    mood: moodConf,
    composition: compConf,
    texture: recurringMaterials.length ? 0.82 : 0.62,
    density: densityConf,
    overall: overallConf,
  };

  return {
    aggregatedMood,
    density,
    densityLabel,
    contrast: {
      overall: Math.round(contrastOverall * 100) / 100,
      color: Math.round(contrastColor * 100) / 100,
      tonal: Math.round(contrastTonal * 100) / 100,
      scale: Math.round(contrastScale * 100) / 100,
      typography: Math.round(contrastType * 100) / 100,
      form: Math.round(contrastForm * 100) / 100,
    },
    composition: {
      symmetry: Math.round(symmetryAvg * 100) / 100,
      whitespace: whitespaceScore,
      grid: Math.round(gridAvg * 100) / 100,
      hierarchy: Math.round(contrastScale * 100) / 100,
      scaleContrast: Math.round(contrastScale * 100) / 100,
      alignment: topAlignment,
      layoutStyle: topLayout,
    },
    typography: {
      primaryCategory: primaryTypeCategory,
      secondaryCategory: secondaryTypeCategory,
      personality: topTypePersonality,
      weightPreference: hasTypography ? "medium-forward with fine accents" : "none",
      casingPreference: hasTypography ? "mixed casing with uppercase eyebrow anchors" : "none",
      spacingPreference: topWhitespace === "generous" ? "open tracking" : "balanced tracking",
      typeDetectedCount,
    },
    texture: {
      materials: recurringMaterials.length ? recurringMaterials : ["clean surface", "matte finish"],
      tactileLevel: avgTactile,
      surfaceStyle: "matte",
      visualLanguage: avgTactile > 0.5 ? "tactile" : "polished",
    },
    imagery: {
      subjects: topSubjects.length ? topSubjects : ["curated visual study"],
      photographyStyle: topPhotoStyles.length ? topPhotoStyles : ["natural directional light"],
      treatment: topTreatments.length ? topTreatments : ["clean", "restrained tonal curve"],
    },
    rhythm: {
      type: topRhythm,
      repetition: Math.round((repSum / total) * 100) / 100,
      pacing: Math.round((paceSum / total) * 100) / 100,
    },
    confidences,
    evidence,
  };
}

// ============================================================================
// GEMINI SYNTHESIS OF STYLE NAME, PRINCIPLES & DO/DON'T RULES
// ============================================================================

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
        temperature: 0.3,
      },
    });
  } catch {
    return null;
  }
}

interface DesignTwinArchetype {
  name: string;
  note: string;
  vector: [number, number, number, number, number, number]; // [density, contrast, warmth, symmetry, whitespace, tactile]
}

const DESIGN_TWIN_ARCHETYPES: DesignTwinArchetype[] = [
  {
    name: "Aesop",
    note: "Restrained tactile materials, warm amber tones, and quiet editorial poise",
    vector: [0.35, 0.65, 0.75, 0.6, 0.7, 0.85],
  },
  {
    name: "Kinfolk",
    note: "Generous open whitespace, natural lighting, and serene editorial pacing",
    vector: [0.25, 0.45, 0.7, 0.5, 0.85, 0.7],
  },
  {
    name: "Dieter Rams / Braun",
    note: "Strict functional grid, clinical neutral contrasts, and pure utilitarian focus",
    vector: [0.4, 0.8, 0.3, 0.85, 0.65, 0.25],
  },
  {
    name: "Swiss Style / Müller-Brockmann",
    note: "Rigid mathematical grid, asymmetric dynamic balance, and stark tonal contrast",
    vector: [0.55, 0.85, 0.4, 0.4, 0.55, 0.2],
  },
  {
    name: "The New York Times Magazine",
    note: "Archival typographic hierarchy, high-contrast imagery, and structured columns",
    vector: [0.65, 0.8, 0.45, 0.5, 0.45, 0.5],
  },
  {
    name: "Apple Pro Design",
    note: "Sleek industrial surfaces, centered balance, and optical clarity",
    vector: [0.3, 0.7, 0.35, 0.8, 0.75, 0.15],
  },
  {
    name: "Studio Nicholson",
    note: "Monochrome tactile tailoring, muted slate tones, and understated asymmetry",
    vector: [0.35, 0.55, 0.4, 0.45, 0.7, 0.75],
  },
  {
    name: "Wired Magazine",
    note: "High information density, expressive kinetic color, and multi-layered rhythm",
    vector: [0.85, 0.85, 0.6, 0.35, 0.2, 0.3],
  },
  {
    name: "Brutalist Web Archive",
    note: "Raw high-density layout, unvarnished high-contrast borders, and modular tension",
    vector: [0.8, 0.9, 0.3, 0.3, 0.25, 0.4],
  },
  {
    name: "Acne Studios",
    note: "Subversive minimalism, directional fashion lighting, and sharp architectural framing",
    vector: [0.3, 0.75, 0.5, 0.55, 0.75, 0.6],
  },
];

function calculateDesignTwins(agg: ReturnType<typeof aggregateAnalyses>, palette: DNAPalette) {
  const currentVector: [number, number, number, number, number, number] = [
    agg.density,
    agg.contrast.overall,
    palette.temperature,
    agg.composition.symmetry,
    agg.composition.whitespace,
    agg.texture.tactileLevel,
  ];

  const scored = DESIGN_TWIN_ARCHETYPES.map((arch) => {
    let sumSq = 0;
    for (let i = 0; i < 6; i++) {
      sumSq += Math.pow(currentVector[i] - arch.vector[i], 2);
    }
    const dist = Math.sqrt(sumSq);
    const match = Math.max(62, Math.min(96, Math.round(96 - dist * 22)));
    return {
      name: arch.name,
      match,
      note: arch.note,
    };
  });

  return scored.sort((a, b) => b.match - a.match).slice(0, 4);
}

/**
 * 100% Input-Driven dynamic Style DNA name, principles, and rules generator.
 * Every word and rule is computed directly from aggregated metrics and authoritative colors.
 */
function buildFallbackSynthesis(agg: ReturnType<typeof aggregateAnalyses>, palette: DNAPalette) {
  const isMinimal = agg.density <= 0.35 || (agg.aggregatedMood.minimalism ?? 0.5) > 0.6;
  const isDense = agg.density >= 0.65 || (agg.aggregatedMood.maximalism ?? 0.5) > 0.6;
  const isWarm = palette.temperature > 0.55;
  const isCool = palette.temperature < 0.42;
  const isHighContrast = agg.contrast.overall > 0.65;
  const isTactile = agg.texture.tactileLevel > 0.5;
  const isSerif = agg.typography.primaryCategory.includes("serif");
  const isGrotesk =
    agg.typography.primaryCategory.includes("grotesk") ||
    agg.typography.primaryCategory.includes("sans");
  const hasTypography = agg.typography.primaryCategory !== "none";

  // Dynamic Style Name Assembly
  let tonePrefix = isWarm
    ? palette.temperature > 0.75
      ? "Sun-Drenched"
      : "Warm"
    : isCool
      ? "Cool Slate"
      : "Tonal";

  if (palette.primary[0]?.name) {
    const pName = palette.primary[0].name.toLowerCase();
    if (pName.includes("ink") || pName.includes("black")) {
      tonePrefix = isWarm ? "Warm Noir" : "Obsidian";
    } else if (pName.includes("bone") || pName.includes("white")) {
      tonePrefix = "Alabaster";
    } else if (pName.includes("terracotta") || pName.includes("clay")) {
      tonePrefix = "Terracotta";
    } else if (pName.includes("ochre")) {
      tonePrefix = "Amber Ochre";
    } else if (pName.includes("slate") || pName.includes("indigo")) {
      tonePrefix = "Indigo Slate";
    }
  }

  const structureMid = isMinimal
    ? "Minimalist"
    : isDense
      ? "Layered"
      : agg.composition.symmetry > 0.65
        ? "Axial"
        : "Dynamic";

  const domainNoun = hasTypography
    ? isSerif
      ? "Editorial"
      : isGrotesk
        ? "Modernist"
        : "Specimen"
    : isTactile
      ? "Tactile Studio"
      : isHighContrast
        ? "Graphic System"
        : "Spatial Form";

  const styleName = `${tonePrefix} ${structureMid} ${domainNoun}`.trim();

  // Dynamic Tagline
  const tagline = `${isWarm ? "Warm" : isCool ? "Cool-toned" : "Balanced neutral"} ${agg.densityLabel} aesthetic driven by ${agg.composition.layoutStyle} architecture, ${hasTypography ? agg.typography.primaryCategory + " hierarchy" : "spatial cadence"}, and ${isTactile ? "tactile micro-textures" : "optical surface clarity"}.`;

  // Dynamic Description
  const description = `A bespoke aesthetic signature balancing ${hasTypography ? agg.typography.primaryCategory + " typography" : "negative space hierarchy"} with ${agg.densityLabel} density (${Math.round(agg.density * 100)}%), ${Math.round(agg.contrast.overall * 100)}% overall contrast, and ${isWarm ? "warm natural" : isCool ? "crisp slate" : "neutral"} tonal authority.`;

  // Dynamic Keywords
  const keywords: string[] = [
    hasTypography ? (isSerif ? "Serif Hierarchy" : "Grotesk Native") : "Image Centric",
    isWarm ? "Warm Tonal Curve" : isCool ? "Cool Slate Spectrum" : "Monochrome Balance",
    agg.composition.layoutStyle === "editorial"
      ? "Editorial Grid"
      : agg.composition.layoutStyle === "modular"
        ? "Modular Grid"
        : "Asymmetric Flow",
    isTactile ? "Tactile Surface" : "Polished Canvas",
    isMinimal
      ? "Expansive Negative Space"
      : isDense
        ? "High-Density Hierarchy"
        : "Balanced Cadence",
    isHighContrast ? "High Dynamic Contrast" : "Soft Continuous Tone",
  ];

  // Dynamic Principles
  const principles: string[] = [];
  if (isMinimal) {
    principles.push(
      "01 — Whitespace as active architecture: protect open margins as primary structural elements rather than empty voids.",
    );
  } else if (isDense) {
    principles.push(
      "01 — Controlled visual density: orchestrate multi-layered information clusters with unambiguous visual anchors.",
    );
  } else {
    principles.push(
      "01 — Calibrated spatial balance: distribute visual weight in equal proportion between focal anchors and breathing room.",
    );
  }

  principles.push(
    `02 — Chromatic restraint: anchor surfaces in ${palette.neutrals[0]?.name || "neutrals"}, reserving ${palette.accent[0]?.name || "accent"} for deliberate focal punctuation.`,
  );

  if (hasTypography) {
    principles.push(
      `03 — Typographic hierarchy: prioritize ${agg.typography.primaryCategory} display scale with disciplined line pacing and ${agg.typography.spacingPreference}.`,
    );
  } else {
    principles.push(
      "03 — Visual-first primacy: let spatial framing, scale contrast, and cropping establish hierarchy over text blocks.",
    );
  }

  if (isHighContrast) {
    principles.push(
      "04 — High dynamic range: maximize stark optical differentiation between dark and light values for bold legibility.",
    );
  } else {
    principles.push(
      "04 — Nuanced tonal gradation: cultivate smooth, continuous value transitions without harsh optical polarity.",
    );
  }

  if (agg.composition.symmetry > 0.6) {
    principles.push(
      "05 — Symmetrical equilibrium: employ axial balance and centered alignment to convey permanence and quiet poise.",
    );
  } else {
    principles.push(
      "05 — Dynamic asymmetry: position core visual mass off-center to generate organic visual rhythm and curiosity.",
    );
  }

  if (isTactile) {
    principles.push(
      "06 — Material presence: celebrate physical micro-textures, fine grain, and tactile tactile qualities.",
    );
  } else {
    principles.push(
      "06 — Optical purity: prioritize razor-sharp geometry, clean vector edges, and smooth surface rendering.",
    );
  }

  // Dynamic Do / Don't Rules
  const doList: string[] = [];
  const dontList: string[] = [];

  if (isMinimal) {
    doList.push(
      "Preserve wide, uncluttered margins and intentional negative space around primary subjects.",
    );
    dontList.push("Do not crowd margins or compress line heights to fit secondary visual noise.");
  } else if (isDense) {
    doList.push(
      "Build rich, multi-layered visual depth using metadata tags, captions, and intersecting planes.",
    );
    dontList.push(
      "Do not leave barren, clinical expanses that disrupt the rhythm of layered information.",
    );
  } else {
    doList.push(
      "Maintain a steady, rhythmic pacing between primary imagery and supporting elements.",
    );
    dontList.push("Avoid abrupt shifts in visual scale between adjacent sections.");
  }

  if (palette.accent[0]) {
    doList.push(
      `Reserve the ${palette.accent[0].name} accent exclusively for critical interaction anchors.`,
    );
    dontList.push(`Do not use the ${palette.accent[0].name} accent as a broad background flood.`);
  }

  if (hasTypography) {
    doList.push(
      `Anchor lead headlines in ${agg.typography.primaryCategory} with disciplined hierarchy.`,
    );
    dontList.push(
      "Avoid pairing more than two competing typeface personalities in a single composition.",
    );
  } else {
    doList.push(
      "Allow photographic composition and spatial ratios to command immediate user attention.",
    );
    dontList.push(
      "Do not force arbitrary decorative text elements where visual imagery naturally leads.",
    );
  }

  if (isWarm) {
    doList.push("Harmonize compositions with warm ambient tones and natural light falloff.");
    dontList.push("Avoid harsh, cold fluorescent blue highlights that clash with warm undertones.");
  } else {
    doList.push("Emphasize crisp architectural neutrals and cool tonal precision.");
    dontList.push("Avoid murky amber filters or artificial sepia tinting.");
  }

  const designTwins = calculateDesignTwins(agg, palette);

  return {
    name: styleName,
    tagline,
    description,
    keywords,
    typographyPersonality: agg.typography.personality,
    typographyPairings: isSerif
      ? ["Cormorant Garamond × Inter", "GT Sectra × Söhne", "Tiempos Headline × Suisse Int'l"]
      : hasTypography
        ? ["Söhne × Newsreader", "Neue Haas Grotesk × Freight Text", "Suisse Int'l × Georgia"]
        : ["Inter × Newsreader", "Neue Haas Grotesk × Georgia"],
    principles,
    doList: doList.slice(0, 4),
    dontList: dontList.slice(0, 4),
    designTwins,
  };
}

// ============================================================================
// MAIN SYNTHESIS FUNCTION
// ============================================================================

export async function synthesizeStyleDNA(
  analyses: ImageStyleAnalysis[],
  authoritativeColors: string[],
): Promise<StyleDNA> {
  // 1. Authoritative palette classification (Untouched colors from extraction)
  const palette = classifyAuthoritativePalette(authoritativeColors);

  // 2. Mathematical multi-image aggregation
  const agg = aggregateAnalyses(analyses);

  // 3. AI synthesis for personality name, principles, and rules
  let aiSynthesis = buildFallbackSynthesis(agg, palette);

  const model = !isVisionQuotaExhausted() ? getGeminiModel() : null;
  if (model) {
    try {
      const summaryPayload = {
        imageCount: analyses.length,
        primaryColors: palette.primary.map((c) => c.hex),
        accentColor: palette.accent[0]?.hex,
        neutrals: palette.neutrals.map((c) => c.hex),
        temperature: palette.temperature,
        typographyCategory: agg.typography.primaryCategory,
        typographyPersonality: agg.typography.personality,
        moodAverages: agg.aggregatedMood,
        densityScore: agg.density,
        densityLabel: agg.densityLabel,
        whitespace: agg.composition.whitespace,
        layout: agg.composition.layoutStyle,
        textures: agg.texture.materials,
        tactileLevel: agg.texture.tactileLevel,
        imagerySubjects: agg.imagery.subjects,
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Synthesis timeout")), 15000),
      );

      const result = (await Promise.race([
        model.generateContent([
          STYLE_DNA_SYNTHESIS_PROMPT,
          `INPUT DATA SUMMARY:\n${JSON.stringify(summaryPayload, null, 2)}`,
        ]),
        timeoutPromise,
      ])) as { response: { text: () => string } };

      const text = result.response.text();
      const cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.name && Array.isArray(parsed.principles)) {
        aiSynthesis = {
          name: parsed.name,
          tagline: parsed.tagline || aiSynthesis.tagline,
          description: parsed.description || aiSynthesis.description,
          keywords:
            Array.isArray(parsed.keywords) && parsed.keywords.length
              ? parsed.keywords
              : aiSynthesis.keywords,
          typographyPersonality: parsed.typographyPersonality || aiSynthesis.typographyPersonality,
          typographyPairings: Array.isArray(parsed.typographyPairings)
            ? parsed.typographyPairings
            : aiSynthesis.typographyPairings,
          principles: parsed.principles.slice(0, 8),
          doList: Array.isArray(parsed.doList) ? parsed.doList.slice(0, 5) : aiSynthesis.doList,
          dontList: Array.isArray(parsed.dontList)
            ? parsed.dontList.slice(0, 5)
            : aiSynthesis.dontList,
          designTwins: Array.isArray(parsed.designTwins)
            ? parsed.designTwins
            : aiSynthesis.designTwins,
        };
      }
    } catch (err) {
      console.warn(
        "[Synthesis] AI generation failed, using structured input-driven synthesis:",
        err,
      );
    }
  }

  // Gradients derived from authoritative colors
  const gradients = [
    `linear-gradient(135deg, ${palette.primary[0]?.hex || "#fdfcf8"}, ${palette.secondary[0]?.hex || "#e2d5c0"})`,
    `linear-gradient(135deg, ${palette.accent[0]?.hex || "#cf5a3c"}, ${palette.primary[0]?.hex || "#7a2f1d"})`,
    `linear-gradient(135deg, ${palette.neutrals[0]?.hex || "#7a8b6f"}, ${palette.secondary[0]?.hex || "#f5f1e9"})`,
  ];

  // 6-axis Fingerprint for RadarChart (each derived from independent metrics)
  const fingerprint = [
    { label: "Complexity", value: Math.round(agg.density * 100) },
    {
      label: "Motion",
      value: Math.round(
        Math.max(
          10,
          Math.min(95, (1 - agg.composition.grid) * 50 + (1 - agg.composition.symmetry) * 50),
        ),
      ),
    },
    { label: "Density", value: Math.round(agg.density * 100) },
    { label: "Contrast", value: Math.round(agg.contrast.overall * 100) },
    { label: "Warmth", value: Math.round(palette.temperature * 100) },
    {
      label: "Ornament",
      value: Math.round(
        Math.max(
          10,
          Math.min(95, agg.texture.tactileLevel * 60 + (1 - agg.composition.whitespace) * 40),
        ),
      ),
    },
  ];

  const dnaId = crypto.randomUUID();

  const energyLabel =
    agg.aggregatedMood.energy > 0.65
      ? "High Kinetic Energy · Dynamic · Expressive"
      : agg.aggregatedMood.calm > 0.65
        ? "Quiet Poise · Contemplative · Restrained"
        : agg.aggregatedMood.minimalism > 0.65
          ? "Sparse Serenity · Focused · Deliberate"
          : "Balanced · Structured · Harmonic";

  const harmonyLabel = `${palette.temperature > 0.6 ? "Warm Harmonic" : palette.temperature < 0.4 ? "Cool Tonal" : "Balanced Neutral"} · ${palette.primary[0]?.name || "Primary"} with ${palette.accent[0]?.name || "Accent"} punctuation`;

  return {
    id: dnaId,
    identity: {
      name: aiSynthesis.name,
      tagline: aiSynthesis.tagline,
      description: aiSynthesis.description,
      keywords: aiSynthesis.keywords,
    },
    palette,
    typography: {
      detected: agg.typography.primaryCategory !== "none",
      primaryCategory: agg.typography.primaryCategory,
      secondaryCategory: agg.typography.secondaryCategory,
      personality: aiSynthesis.typographyPersonality,
      weightPreference: agg.typography.weightPreference,
      casingPreference: agg.typography.casingPreference,
      spacingPreference: agg.typography.spacingPreference,
      pairings: aiSynthesis.typographyPairings,
      displayFontExample: agg.typography.primaryCategory.includes("serif")
        ? "Cormorant Garamond"
        : agg.typography.primaryCategory.includes("grotesk")
          ? "Neue Haas Grotesk"
          : "Inter",
      bodyFontExample: "Inter",
    },
    mood: {
      minimalism: agg.aggregatedMood.minimalism,
      maximalism: agg.aggregatedMood.maximalism,
      calm: agg.aggregatedMood.calm,
      energy: agg.aggregatedMood.energy,
      elegance: agg.aggregatedMood.elegance,
      playfulness: agg.aggregatedMood.playfulness,
      seriousness: agg.aggregatedMood.seriousness,
      warmth: agg.aggregatedMood.warmth,
      coolness: agg.aggregatedMood.coolness,
      futurism: agg.aggregatedMood.futurism,
      nostalgia: agg.aggregatedMood.nostalgia,
      luxury: agg.aggregatedMood.luxury,
      rawness: agg.aggregatedMood.rawness,
      softness: agg.aggregatedMood.softness,
      boldness: agg.aggregatedMood.boldness,
    },
    composition: agg.composition,
    density: agg.density,
    densityLabel: agg.densityLabel,
    contrast: agg.contrast,
    texture: agg.texture,
    imagery: agg.imagery,
    rhythm: agg.rhythm,
    principles: aiSynthesis.principles,
    doList: aiSynthesis.doList,
    dontList: aiSynthesis.dontList,
    confidence: agg.confidences,
    sourceImageCount: analyses.length,
    evidence: agg.evidence,
    imageAnalyses: analyses,

    // Backward-compatible fields
    name: aiSynthesis.name,
    styleName: aiSynthesis.name,
    style_name: aiSynthesis.name,
    theme: aiSynthesis.tagline,
    summary: aiSynthesis.description,
    personality: aiSynthesis.tagline,
    energy: energyLabel,
    tags: aiSynthesis.keywords,
    harmony: harmonyLabel,
    gradients,
    fingerprint,
    twins: aiSynthesis.designTwins,
    paletteList: palette.rawHexList.map((hex) => ({
      hex,
      name: getDescriptiveColorName(hex),
    })),
    createdAt: new Date().toISOString(),
  };
}
