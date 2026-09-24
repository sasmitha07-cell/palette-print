import type { StyleDNA, DNAPalette } from "./schemas";

export interface StyleDNAContext {
  identity: {
    name: string;
    tagline: string;
    description: string;
    keywords: string[];
  };
  palette: {
    hexList: string[];
    primary: { hex: string; name: string };
    secondary: { hex: string; name: string };
    accent: { hex: string; name: string };
    neutral: { hex: string; name: string };
    dominant: { hex: string; name: string };
    temperature: number; // 0 cold to 1 warm
    saturation: number;
    brightness: number;
    temperatureLabel: string;
  };
  typography: {
    detected: boolean;
    primaryCategory: string;
    secondaryCategory: string;
    personality: string;
    weightPreference: string;
    spacingPreference: string;
    pairings: string[];
    displayFontExample: string;
    bodyFontExample: string;
  };
  composition: {
    layoutStyle: string;
    whitespace: number; // 0 to 1
    whitespaceLabel: string;
    symmetry: number;
    grid: number;
    alignment: string;
  };
  density: {
    score: number; // 0 to 1
    label: string;
  };
  contrast: {
    overall: number; // 0 to 1
    tonal: number;
    color: number;
    scale: number;
  };
  texture: {
    surfaceStyle: string;
    tactileLevel: number;
    materials: string[];
    visualLanguage: string;
  };
  imagery: {
    subjects: string[];
    photographyStyle: string[];
    treatment: string[];
    lighting: string;
  };
  rhythm: {
    type: string;
    repetition: number;
    pacing: number;
  };
  mood: {
    minimalism: number;
    calm: number;
    energy: number;
    elegance: number;
    playfulness: number;
    seriousness: number;
    warmth: number;
    luxury: number;
    rawness: number;
    boldness: number;
  };
  principles: string[];
  doList: string[];
  dontList: string[];
  sourceImageCount: number;

  /** Full formatted LLM system prompt / creative director guide */
  systemPrompt: string;
  /** Terse token-dense creative summary for image generators */
  imagePromptSignature: string;
}

/**
 * Builds a single authoritative creative context from any StyleDNA representation.
 * Consumed by AI Directions, Prompt Library, Moodboard, Design Twin, DNA Match, and DNA Chat.
 */
export function buildStyleDNAContext(rawDna: unknown): StyleDNAContext {
  const dna = (rawDna || {}) as Partial<StyleDNA> & Record<string, unknown>;

  // Identity
  const name =
    dna.identity?.name || dna.name || dna.style_name || dna.styleName || "Synthesized Visual DNA";
  const tagline =
    dna.identity?.tagline || dna.theme || dna.summary || "A bespoke aesthetic signature";
  const description =
    dna.identity?.description ||
    dna.summary ||
    "Custom visual identity synthesized from analyzed reference imagery.";
  const keywords = dna.identity?.keywords || dna.tags || ["editorial", "curated", "refined"];

  // Palette Extraction
  const rawPalette = dna.palette as Partial<DNAPalette> | undefined;
  const hexList: string[] =
    Array.isArray(rawPalette?.rawHexList) && rawPalette.rawHexList.length > 0
      ? rawPalette.rawHexList
      : Array.isArray(dna.palette)
        ? (dna.palette as Array<{ hex?: string }>).map((c) => c.hex || "#333333")
        : ["#1F2421", "#4A524D", "#D8D4D0", "#C87D55", "#EBE8E1"];

  const primaryHex = rawPalette?.primary?.[0]?.hex || hexList[0] || "#1A1A1A";
  const primaryName = rawPalette?.primary?.[0]?.name || "Primary Tone";

  const secondaryHex = rawPalette?.secondary?.[0]?.hex || hexList[1] || "#5A5A5A";
  const secondaryName = rawPalette?.secondary?.[0]?.name || "Secondary Tone";

  const accentHex =
    rawPalette?.accent?.[0]?.hex || hexList[3] || hexList[hexList.length - 1] || "#C87D55";
  const accentName = rawPalette?.accent?.[0]?.name || "Accent Point";

  const neutralHex = rawPalette?.neutrals?.[0]?.hex || hexList[2] || "#F5F3EF";
  const neutralName = rawPalette?.neutrals?.[0]?.name || "Base Neutral";

  const temperature = typeof rawPalette?.temperature === "number" ? rawPalette.temperature : 0.55;
  const saturation = typeof rawPalette?.saturation === "number" ? rawPalette.saturation : 0.45;
  const brightness = typeof rawPalette?.brightness === "number" ? rawPalette.brightness : 0.6;
  const temperatureLabel =
    temperature > 0.65
      ? "warm solar/earth"
      : temperature < 0.35
        ? "cool mineral/slate"
        : "neutral balanced";

  // Typography
  const typeObj = dna.typography || ({} as Record<string, unknown>);
  const typography = {
    detected: Boolean(typeObj.detected ?? true),
    primaryCategory: String(typeObj.primaryCategory || "editorial serif"),
    secondaryCategory: String(typeObj.secondaryCategory || "geometric sans"),
    personality: String(typeObj.personality || "editorial & authoritative"),
    weightPreference: String(typeObj.weightPreference || "medium display / regular body"),
    spacingPreference: String(typeObj.spacingPreference || "wide tracking on headers"),
    pairings:
      Array.isArray(typeObj.pairings) && typeObj.pairings.length > 0
        ? (typeObj.pairings as string[])
        : ["High-contrast editorial serif paired with restrained monospace/sans-serif"],
    displayFontExample: String(typeObj.displayFontExample || "Cormorant Garamond"),
    bodyFontExample: String(typeObj.bodyFontExample || "Inter / Neue Haas"),
  };

  // Composition
  const compObj = dna.composition || ({} as Record<string, unknown>);
  const whitespaceVal = typeof compObj.whitespace === "number" ? compObj.whitespace : 0.6;
  const composition = {
    layoutStyle: String(compObj.layoutStyle || "editorial asymmetrical grid"),
    whitespace: whitespaceVal,
    whitespaceLabel:
      whitespaceVal > 0.7
        ? "expansive negative space"
        : whitespaceVal < 0.3
          ? "compact dense framing"
          : "balanced breathing room",
    symmetry: typeof compObj.symmetry === "number" ? compObj.symmetry : 0.45,
    grid: typeof compObj.grid === "number" ? compObj.grid : 0.75,
    alignment: String(compObj.alignment || "left-anchored asymmetric"),
  };

  // Density
  const densityScore = typeof dna.density === "number" ? dna.density : 0.4;
  const density = {
    score: densityScore,
    label: String(
      dna.densityLabel ||
        (densityScore > 0.65
          ? "dense & layered"
          : densityScore < 0.35
            ? "airy & sparse"
            : "balanced"),
    ),
  };

  // Contrast
  const contrastObj = dna.contrast || ({} as Record<string, unknown>);
  const contrast = {
    overall: typeof contrastObj.overall === "number" ? contrastObj.overall : 0.65,
    tonal: typeof contrastObj.tonal === "number" ? contrastObj.tonal : 0.7,
    color: typeof contrastObj.color === "number" ? contrastObj.color : 0.5,
    scale: typeof contrastObj.scale === "number" ? contrastObj.scale : 0.65,
  };

  // Texture
  const texObj = dna.texture || ({} as Record<string, unknown>);
  const texture = {
    surfaceStyle: String(texObj.surfaceStyle || "matte tactile"),
    tactileLevel: typeof texObj.tactileLevel === "number" ? texObj.tactileLevel : 0.45,
    materials:
      Array.isArray(texObj.materials) && texObj.materials.length > 0
        ? (texObj.materials as string[])
        : ["uncoated paper", "stone", "fine-grain linen"],
    visualLanguage: String(texObj.visualLanguage || "tactile print"),
  };

  // Imagery
  const imgObj = dna.imagery || ({} as Record<string, unknown>);
  const imagery = {
    subjects:
      Array.isArray(imgObj.subjects) && imgObj.subjects.length > 0
        ? (imgObj.subjects as string[])
        : ["architectural fragments", "tactile still-life", "human presence"],
    photographyStyle:
      Array.isArray(imgObj.photographyStyle) && imgObj.photographyStyle.length > 0
        ? (imgObj.photographyStyle as string[])
        : ["natural light", "subtle grain", "editorial portraiture"],
    treatment:
      Array.isArray(imgObj.treatment) && imgObj.treatment.length > 0
        ? (imgObj.treatment as string[])
        : ["matte shadows", "unfiltered optics"],
    lighting: "natural diffused daylight with deep soft shadows",
  };

  // Rhythm
  const rhythmObj = dna.rhythm || ({} as Record<string, unknown>);
  const rhythm = {
    type: String(rhythmObj.type || "editorial fluid"),
    repetition: typeof rhythmObj.repetition === "number" ? rhythmObj.repetition : 0.4,
    pacing: typeof rhythmObj.pacing === "number" ? rhythmObj.pacing : 0.5,
  };

  // Mood
  const moodObj = dna.mood || ({} as Record<string, unknown>);
  const mood = {
    minimalism: typeof moodObj.minimalism === "number" ? moodObj.minimalism : 0.6,
    calm: typeof moodObj.calm === "number" ? moodObj.calm : 0.6,
    energy: typeof moodObj.energy === "number" ? moodObj.energy : 0.4,
    elegance: typeof moodObj.elegance === "number" ? moodObj.elegance : 0.7,
    playfulness: typeof moodObj.playfulness === "number" ? moodObj.playfulness : 0.3,
    seriousness: typeof moodObj.seriousness === "number" ? moodObj.seriousness : 0.65,
    warmth: typeof moodObj.warmth === "number" ? moodObj.warmth : temperature,
    luxury: typeof moodObj.luxury === "number" ? moodObj.luxury : 0.6,
    rawness: typeof moodObj.rawness === "number" ? moodObj.rawness : 0.4,
    boldness: typeof moodObj.boldness === "number" ? moodObj.boldness : 0.55,
  };

  // Principles & Rules
  const principles =
    Array.isArray(dna.principles) && dna.principles.length > 0
      ? (dna.principles as string[])
      : [
          `Anchor visual hierarchy around ${typography.primaryCategory} display moments`,
          `Preserve ${composition.whitespaceLabel} across all layout viewports`,
          `Apply ${accentHex} strictly for singular accent emphasis, never as flood fills`,
          `Maintain tactile ${texture.surfaceStyle} materials over glossy synthetic elements`,
          `Use ${composition.layoutStyle} to prevent rigid commercial homogeneity`,
        ];

  const doList =
    Array.isArray(dna.doList) && dna.doList.length > 0
      ? (dna.doList as string[])
      : [
          `Let whitespace breathe around key visual anchors`,
          `Use ${primaryHex} and ${neutralHex} as the primary canvas foundation`,
          `Introduce ${accentHex} sparingly on singular interactive or focal points`,
          `Honor ${typography.primaryCategory} typography with deliberate leading and tracking`,
        ];

  const dontList =
    Array.isArray(dna.dontList) && dna.dontList.length > 0
      ? (dna.dontList as string[])
      : [
          `Do not crowd margins or eliminate negative space`,
          `Do not introduce neon or synthetic gradients that clash with ${temperatureLabel} colors`,
          `Do not use generic rounded commercial buttons or hyper-dense card grids`,
          `Avoid generic stock photography lacking ${texture.surfaceStyle} quality`,
        ];

  const sourceImageCount = typeof dna.sourceImageCount === "number" ? dna.sourceImageCount : 5;

  // Build unified LLM System Prompt
  const systemPrompt = `You are the user's bespoke AI Creative Director. You are trained exclusively on their synthesized Style DNA.
Every response, concept, prompt, and critique you generate must strictly reflect this visual signature:

STYLE DNA IDENTITY:
- Archetype: "${name}"
- Tagline: "${tagline}"
- Keywords: ${keywords.join(", ")}

AUTHORITATIVE COLOR PALETTE:
- Primary Tone: ${primaryName} (${primaryHex})
- Secondary Tone: ${secondaryName} (${secondaryHex})
- Accent Point: ${accentName} (${accentHex})
- Base Neutral: ${neutralName} (${neutralHex})
- Full Hex Set: ${hexList.join(", ")}
- Temperature: ${(temperature * 100).toFixed(0)}% (${temperatureLabel})
- Saturation: ${(saturation * 100).toFixed(0)}%

TYPOGRAPHY & HIERARCHY:
- Display Category: ${typography.primaryCategory} (e.g. ${typography.displayFontExample})
- Body Category: ${typography.secondaryCategory} (e.g. ${typography.bodyFontExample})
- Typography Personality: ${typography.personality}
- Spacing & Weight: ${typography.weightPreference}, ${typography.spacingPreference}

COMPOSITION & SPATIAL DYNAMICS:
- Layout Style: ${composition.layoutStyle}
- Whitespace / Negative Space: ${(composition.whitespace * 100).toFixed(0)}% (${composition.whitespaceLabel})
- Alignment: ${composition.alignment}
- Density: ${(density.score * 100).toFixed(0)}% (${density.label})
- Overall Contrast: ${(contrast.overall * 100).toFixed(0)}% (Tonal: ${(contrast.tonal * 100).toFixed(0)}%, Color: ${(contrast.color * 100).toFixed(0)}%)

TEXTURE & ATMOSPHERE:
- Surface Style: ${texture.surfaceStyle}
- Tactile Finish: ${texture.materials.join(", ")} (${(texture.tactileLevel * 100).toFixed(0)}% tactile depth)
- Visual Language: ${texture.visualLanguage}
- Lighting: ${imagery.lighting}

CREATIVE PRINCIPLES:
${principles.map((p, i) => `${i + 1}. ${p}`).join("\n")}

STRICT DOs:
${doList.map((d) => `• DO: ${d}`).join("\n")}

STRICT DON'Ts:
${dontList.map((d) => `• DON'T: ${d}`).join("\n")}

When asked to generate directions, prompts, layouts, or critiques, embody these exact attributes. Never revert to generic commercial tech or corporate aesthetics unless explicitly instructed.`;

  const imagePromptSignature = `${name}, ${keywords.slice(0, 3).join(" ")}, ${hexList.slice(0, 4).join(" ")}, ${composition.whitespaceLabel}, ${typography.primaryCategory} aesthetic, ${texture.surfaceStyle}, ${imagery.lighting}`;

  return {
    identity: { name, tagline, description, keywords },
    palette: {
      hexList,
      primary: { hex: primaryHex, name: primaryName },
      secondary: { hex: secondaryHex, name: secondaryName },
      accent: { hex: accentHex, name: accentName },
      neutral: { hex: neutralHex, name: neutralName },
      dominant: { hex: primaryHex, name: primaryName },
      temperature,
      saturation,
      brightness,
      temperatureLabel,
    },
    typography,
    composition,
    density,
    contrast,
    texture,
    imagery,
    rhythm,
    mood,
    principles,
    doList,
    dontList,
    sourceImageCount,
    systemPrompt,
    imagePromptSignature,
  };
}
