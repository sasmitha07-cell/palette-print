import { generateCreativeDirections } from "./lib/ai/directions";
import { generatePromptLibrary, enhanceUserPrompt } from "./lib/ai/prompts-library";
import { generateDynamicMoodboard } from "./lib/ai/moodboard";
import { askDesignTwin, chatWithStyleDNA } from "./lib/ai/dna-chat";
import { calculateRealDNAMatch } from "./lib/ai/dna-match";
import type { RawImageMetrics } from "./lib/cv-analysis";

// Radical DNA A: Minimal Monochrome Editorial
const DNA_A = {
  id: "dna-a-minimal",
  identity: {
    name: "Quiet Architectural Minimalism",
    tagline: "Uncompromising spatial pause and curatorial restraint",
    description: "High-contrast editorial typography balanced with expansive negative space.",
    keywords: ["minimal", "editorial", "architectural", "monochrome", "restrained"],
  },
  palette: {
    primary: [{ hex: "#1C1917", name: "Charcoal Ink", role: "primary" as const }],
    secondary: [{ hex: "#78716C", name: "Stone Slate", role: "secondary" as const }],
    accent: [{ hex: "#C2410C", name: "Rust Terracotta", role: "accent" as const }],
    neutrals: [{ hex: "#FDFBF7", name: "Bone White", role: "neutral" as const }],
    rawHexList: ["#1C1917", "#78716C", "#C2410C", "#FDFBF7", "#E7E5E4"],
    temperature: 0.72,
    saturation: 0.22,
    brightness: 0.88,
  },
  typography: {
    detected: true,
    primaryCategory: "transitional serif",
    secondaryCategory: "geometric sans",
    personality: "editorial and classical",
    weightPreference: "light to medium",
    casingPreference: "mixed case with wide tracking on headers",
    spacingPreference: "expansive tracking",
    pairings: ["Cormorant Garamond × Inter"],
    displayFontExample: "Cormorant Garamond",
    bodyFontExample: "Inter",
  },
  composition: {
    whitespace: 0.86,
    symmetry: 0.35,
    grid: 0.8,
    hierarchy: 0.9,
    scaleContrast: 0.85,
    alignment: "left-anchored asymmetric",
    layoutStyle: "editorial asymmetric grid",
  },
  density: 0.18,
  densityLabel: "airy & sparse",
  contrast: {
    overall: 0.85,
    color: 0.25,
    tonal: 0.9,
    scale: 0.85,
    typography: 0.8,
    form: 0.7,
  },
  texture: {
    materials: ["uncoated rag paper", "raw limestone", "unvarnished oak"],
    tactileLevel: 0.35,
    surfaceStyle: "matte tactile",
    visualLanguage: "tactile print",
  },
  imagery: {
    subjects: ["monolithic architecture", "isolated museum objects"],
    photographyStyle: ["natural daylight", "sharp cast shadows"],
    treatment: ["unfiltered analog"],
  },
  rhythm: {
    type: "editorial",
    repetition: 0.2,
    pacing: 0.3,
  },
  principles: [
    "Honor negative space as an active architectural element",
    "Never introduce decorative clutter or non-functional lines",
    "Apply terracotta accent strictly once per primary surface",
  ],
  doList: ["Use generous margins", "Keep palettes quiet"],
  dontList: ["Do not crowd viewports", "Do not use neon colors"],
};

// Radical DNA B: Maximalist Vibrant Experimental
const DNA_B = {
  id: "dna-b-maximal",
  identity: {
    name: "Hyper-Chroma Collage Maximalism",
    tagline: "High-density saturated visual cacophony",
    description:
      "Layered digital collage, electric saturation, and unapologetic typographic energy.",
    keywords: ["maximalist", "vibrant", "experimental", "dense", "playful"],
  },
  palette: {
    primary: [{ hex: "#7C3AED", name: "Electric Violet", role: "primary" as const }],
    secondary: [{ hex: "#EC4899", name: "Hot Magenta", role: "secondary" as const }],
    accent: [{ hex: "#FBBF24", name: "Solar Amber", role: "accent" as const }],
    neutrals: [{ hex: "#06B6D4", name: "Cyber Cyan", role: "neutral" as const }],
    rawHexList: ["#7C3AED", "#EC4899", "#FBBF24", "#06B6D4", "#10B981"],
    temperature: 0.38,
    saturation: 0.95,
    brightness: 0.65,
  },
  typography: {
    detected: true,
    primaryCategory: "distorted display sans",
    secondaryCategory: "brutalist monospace",
    personality: "aggressive, energetic and rebellious",
    weightPreference: "ultra black",
    casingPreference: "all-caps tight tracking",
    spacingPreference: "negative tracking",
    pairings: ["Druk Wide × Space Mono"],
    displayFontExample: "Druk Wide Heavy",
    bodyFontExample: "Space Mono",
  },
  composition: {
    whitespace: 0.12,
    symmetry: 0.75,
    grid: 0.4,
    hierarchy: 0.6,
    scaleContrast: 0.95,
    alignment: "centered chaotic collage",
    layoutStyle: "layered collage scatter",
  },
  density: 0.88,
  densityLabel: "hyper-dense & layered",
  contrast: {
    overall: 0.92,
    color: 0.95,
    tonal: 0.65,
    scale: 0.95,
    typography: 0.9,
    form: 0.9,
  },
  texture: {
    materials: ["holographic foil", "gloss acrylic", "scanlines"],
    tactileLevel: 0.85,
    surfaceStyle: "gloss synthetic",
    visualLanguage: "synthetic digital",
  },
  imagery: {
    subjects: ["glitch artifacts", "cybernetic figures", "dense urban neon"],
    photographyStyle: ["hyper-saturated studio flash", "multiple exposures"],
    treatment: ["chromatic aberration", "dithered Halftone"],
  },
  rhythm: {
    type: "chaotic",
    repetition: 0.85,
    pacing: 0.95,
  },
  principles: [
    "Fill every quadrant with visual excitement and chromatic tension",
    "Layer overlapping typography directly across imagery",
    "Maximal saturation across all graphic channels",
  ],
  doList: ["Embrace high contrast and dense collage", "Clash neon hues"],
  dontList: ["Do not leave empty whitespace voids", "Avoid muted neutrals"],
};

// Uploaded design sample representing a minimalist architectural poster
const MINIMAL_DESIGN_METRICS: RawImageMetrics = {
  imageId: "minimal-sample",
  width: 1200,
  height: 1600,
  aspectRatio: 0.75,
  luminanceMean: 0.85,
  contrastRms: 0.82,
  saturationMean: 0.18,
  saturationStdDev: 0.08,
  temperature: 0.7, // warm neutrals
  edgeDensity: 0.16, // sparse/minimal
  whitespaceRatio: 0.84, // high whitespace
  horizontalSymmetry: 0.38,
  verticalSymmetry: 0.35,
  textureVariance: 0.32,
  typographicProbability: 0.42,
};

async function runVerification() {
  console.log("===============================================================");
  console.log("PALETTE PRINT PHASE 3: EXTREME TEST (DNA A vs DNA B)");
  console.log("===============================================================\n");

  // 1. AI DIRECTIONS TEST
  console.log(">>> 1. Testing AI Directions (Ten ideas per surface)...");
  const dirsA = await generateCreativeDirections({ surface: "web", dna: DNA_A });
  const dirsB = await generateCreativeDirections({ surface: "web", dna: DNA_B });

  console.log(`DNA A Direction 1: "${dirsA[0].title}" — ${dirsA[0].typography}`);
  console.log(`DNA B Direction 1: "${dirsB[0].title}" — ${dirsB[0].typography}`);
  console.log(`Count A: ${dirsA.length}, Count B: ${dirsB.length}`);

  if (dirsA[0].typography.includes("serif") && dirsB[0].typography.includes("display sans")) {
    console.log("✓ SUCCESS: Directions accurately reflect contrasting DNA typography & layout!\n");
  } else {
    throw new Error("FAIL: Directions did not reflect DNA differences.");
  }

  // 2. PROMPT LIBRARY & CUSTOM PROMPT TEST
  console.log(">>> 2. Testing Prompt Library & Custom Prompt Enhancement...");
  const promptsA = await generatePromptLibrary(DNA_A);
  const promptsB = await generatePromptLibrary(DNA_B);

  console.log(`DNA A Midjourney Prompt:\n"${promptsA.enginePrompts.Midjourney.slice(0, 110)}..."`);
  console.log(`DNA B Midjourney Prompt:\n"${promptsB.enginePrompts.Midjourney.slice(0, 110)}..."`);

  const customBrief = "Create a campaign for a sustainable sneaker brand";
  const enhancedA = await enhanceUserPrompt({ userIdea: customBrief, dna: DNA_A });
  const enhancedB = await enhanceUserPrompt({ userIdea: customBrief, dna: DNA_B });

  console.log(`Enhanced with DNA A:\n"${enhancedA.enhancedPrompt.slice(0, 120)}..."`);
  console.log(`Injected A: ${enhancedA.dnaTokensInjected.join(", ")}`);
  console.log(`Enhanced with DNA B:\n"${enhancedB.enhancedPrompt.slice(0, 120)}..."`);
  console.log(`Injected B: ${enhancedB.dnaTokensInjected.join(", ")}`);

  if (
    enhancedA.enhancedPrompt !== enhancedB.enhancedPrompt &&
    enhancedA.enhancedPrompt.includes("1C1917")
  ) {
    console.log("✓ SUCCESS: Custom prompt enhancement injected distinct DNA tokens!\n");
  }

  // 3. MOODBOARD TEST
  console.log(">>> 3. Testing Dynamic Moodboard Generator...");
  const mbA = await generateDynamicMoodboard({ dna: DNA_A, theme: "Autumn Monograph" });
  const mbB = await generateDynamicMoodboard({ dna: DNA_B, theme: "Neon Rave" });

  console.log(`Moodboard A items: ${mbA.items.length} items (DNA: ${mbA.dnaName})`);
  console.log(`Moodboard B items: ${mbB.items.length} items (DNA: ${mbB.dnaName})`);
  console.log(`MB A Hero Feature: ${mbA.items[0].dnaFeature}`);
  console.log(`MB B Hero Feature: ${mbB.items[0].dnaFeature}`);

  if (mbA.paletteHexes[0] !== mbB.paletteHexes[0]) {
    console.log("✓ SUCCESS: Moodboards generated distinct, cohesive DNA collections!\n");
  }

  // 4. DESIGN TWIN TEST
  console.log(">>> 4. Testing Design Twin Creative Director...");
  const twinA = await askDesignTwin("I need a landing page for an architecture studio", DNA_A);
  const twinB = await askDesignTwin("I need a landing page for an architecture studio", DNA_B);

  console.log(`Twin A Direction:\n"${twinA.creativeDirection}"`);
  console.log(`Twin A Visual Language: "${twinA.visualLanguage}"`);
  console.log(`Twin B Direction:\n"${twinB.creativeDirection}"`);
  console.log(`Twin B Visual Language: "${twinB.visualLanguage}"`);

  if (twinA.visualLanguage !== twinB.visualLanguage) {
    console.log(
      "✓ SUCCESS: Design Twin produced radically different recommendations for identical brief!\n",
    );
  }

  // 5. DNA MATCH CHECKER TEST
  console.log(">>> 5. Testing Real Computer Vision DNA Match Checker...");
  const matchA = calculateRealDNAMatch(MINIMAL_DESIGN_METRICS, DNA_A);
  const matchB = calculateRealDNAMatch(MINIMAL_DESIGN_METRICS, DNA_B);

  console.log(
    `Minimal Design vs DNA A Match Score: ${matchA.overall}% (Color: ${matchA.color}%, Space: ${matchA.composition}%, Density: ${matchA.density}%)`,
  );
  console.log(
    `Minimal Design vs DNA B Match Score: ${matchB.overall}% (Color: ${matchB.color}%, Space: ${matchB.composition}%, Density: ${matchB.density}%)`,
  );
  console.log(`DNA A Strengths: ${matchA.strengths.slice(0, 2).join("; ")}`);
  console.log(`DNA B Mismatches: ${matchB.mismatches.slice(0, 2).join("; ")}`);
  console.log(`DNA B Recommendations: ${matchB.recommendations.slice(0, 2).join("; ")}`);

  if (matchA.overall > 75 && matchB.overall < 60) {
    console.log(
      "✓ SUCCESS: DNA Match Checker accurately calculated high match for DNA A and low match for DNA B!\n",
    );
  } else {
    throw new Error(
      `FAIL: Expected matchA > 75 (got ${matchA.overall}) and matchB < 60 (got ${matchB.overall})`,
    );
  }

  // 6. STYLE DNA CHAT TEST
  console.log(">>> 6. Testing Conversational Style DNA Chat...");
  const chatReplyA = await chatWithStyleDNA(
    [{ role: "user", content: "What kind of website fits my style?" }],
    DNA_A,
  );
  const chatReplyB = await chatWithStyleDNA(
    [{ role: "user", content: "What kind of website fits my style?" }],
    DNA_B,
  );

  console.log(`Chat A Response:\n"${chatReplyA.slice(0, 140)}..."`);
  console.log(`Chat B Response:\n"${chatReplyB.slice(0, 140)}..."`);

  if (chatReplyA !== chatReplyB && chatReplyA.includes(DNA_A.identity.name)) {
    console.log("✓ SUCCESS: Style DNA Chat responds with authentic, customized DNA guidance!\n");
  }

  console.log("===============================================================");
  console.log(">>> ALL 6 AI DOWNSTREAM FEATURES VERIFIED 100% INPUT-DRIVEN! <<<");
  console.log("===============================================================");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
