import { z } from "zod";

// ============================================================================
// 1. TYPOGRAPHY ANALYSIS SCHEMA
// ============================================================================

export const TypographyCategorySchema = z.enum([
  "serif",
  "sans-serif",
  "grotesk",
  "geometric sans",
  "humanist sans",
  "neo-grotesk",
  "display",
  "condensed",
  "monospace",
  "handwritten",
  "experimental",
  "decorative",
  "none",
]);

export const TypographyCharacteristicSchema = z.enum([
  "thin",
  "light",
  "regular",
  "medium",
  "bold",
  "black",
  "condensed",
  "wide",
  "high contrast",
  "low contrast",
]);

export const TypographyPersonalitySchema = z.enum([
  "editorial",
  "luxurious",
  "modern",
  "brutalist",
  "playful",
  "technical",
  "nostalgic",
  "futuristic",
  "institutional",
  "artistic",
  "neutral",
]);

export const TypographyAnalysisSchema = z.object({
  detected: z.boolean().default(false),
  category: z.string().default("none"),
  characteristics: z.array(z.string()).default([]),
  casing: z.enum(["uppercase", "lowercase", "mixed", "titlecase"]).default("mixed"),
  tracking: z.enum(["tight", "normal", "wide", "loose"]).default("normal"),
  lineHeight: z.enum(["tight", "normal", "loose"]).default("normal"),
  alignment: z.enum(["left", "center", "right", "justified", "mixed"]).default("left"),
  textDensity: z.enum(["sparse", "moderate", "dense"]).default("sparse"),
  scaleStyle: z.string().default("balanced"),
  personality: z.string().default("modern"),
  confidence: z.number().min(0).max(1).default(0),
  fontCandidate: z.string().optional(),
});

export type TypographyAnalysis = z.infer<typeof TypographyAnalysisSchema>;

// ============================================================================
// 2. MOOD ANALYSIS SCHEMA (15 Normalized Dimensions 0-1)
// ============================================================================

export const MoodAnalysisSchema = z.object({
  minimalism: z.number().min(0).max(1).default(0.5),
  maximalism: z.number().min(0).max(1).default(0.5),
  calm: z.number().min(0).max(1).default(0.5),
  energy: z.number().min(0).max(1).default(0.5),
  elegance: z.number().min(0).max(1).default(0.5),
  playfulness: z.number().min(0).max(1).default(0.5),
  seriousness: z.number().min(0).max(1).default(0.5),
  warmth: z.number().min(0).max(1).default(0.5),
  coolness: z.number().min(0).max(1).default(0.5),
  futurism: z.number().min(0).max(1).default(0.5),
  nostalgia: z.number().min(0).max(1).default(0.5),
  luxury: z.number().min(0).max(1).default(0.5),
  rawness: z.number().min(0).max(1).default(0.5),
  softness: z.number().min(0).max(1).default(0.5),
  boldness: z.number().min(0).max(1).default(0.5),
  confidence: z.number().min(0).max(1).default(0.8),
});

export type MoodAnalysis = z.infer<typeof MoodAnalysisSchema>;

// ============================================================================
// 3. COMPOSITION ANALYSIS SCHEMA
// ============================================================================

export const CompositionAnalysisSchema = z.object({
  layout: z
    .enum(["grid", "freeform", "modular", "editorial", "centered", "asymmetric", "symmetrical"])
    .default("editorial"),
  alignment: z.enum(["left", "center", "right", "mixed"]).default("left"),
  whitespace: z.enum(["minimal", "moderate", "generous"]).default("moderate"),
  focalPoint: z.string().default("centered"),
  primaryElement: z.string().default("imagery"),
  secondaryElements: z.array(z.string()).default([]),
  scale: z
    .enum([
      "oversized elements",
      "balanced scale",
      "small-detail driven",
      "dramatic scale contrast",
    ])
    .default("balanced scale"),
  personality: z.string().default("structured editorial"),
  symmetryScore: z.number().min(0).max(1).default(0.5),
  gridAdherence: z.number().min(0).max(1).default(0.6),
  confidence: z.number().min(0).max(1).default(0.8),
});

export type CompositionAnalysis = z.infer<typeof CompositionAnalysisSchema>;

// ============================================================================
// 4. VISUAL DENSITY SCHEMA
// ============================================================================

export const DensityAnalysisSchema = z.object({
  score: z.number().min(0).max(1).default(0.5),
  elementCountApprox: z.number().default(5),
  whitespaceRatio: z.number().min(0).max(1).default(0.5),
  layering: z.enum(["flat", "subtle", "multi-layered", "complex"]).default("subtle"),
  visualClutter: z.enum(["none", "low", "moderate", "high"]).default("low"),
  levelLabel: z
    .enum(["extremely sparse", "sparse", "balanced", "dense", "extremely dense"])
    .default("balanced"),
  confidence: z.number().min(0).max(1).default(0.8),
});

export type DensityAnalysis = z.infer<typeof DensityAnalysisSchema>;

// ============================================================================
// 5. CONTRAST ANALYSIS SCHEMA
// ============================================================================

export const ContrastAnalysisSchema = z.object({
  overall: z.number().min(0).max(1).default(0.5),
  color: z.number().min(0).max(1).default(0.5),
  tonal: z.number().min(0).max(1).default(0.5),
  scale: z.number().min(0).max(1).default(0.5),
  typography: z.number().min(0).max(1).default(0.5),
  form: z.number().min(0).max(1).default(0.5),
  confidence: z.number().min(0).max(1).default(0.8),
});

export type ContrastAnalysis = z.infer<typeof ContrastAnalysisSchema>;

// ============================================================================
// 6. TEXTURE & MATERIAL ANALYSIS SCHEMA
// ============================================================================

export const TextureAnalysisSchema = z.object({
  materials: z.array(z.string()).default([]),
  surfaceStyle: z.string().default("matte"),
  tactileLevel: z.number().min(0).max(1).default(0.4),
  visualLanguage: z
    .enum(["tactile", "digital", "physical", "polished", "raw", "organic", "synthetic"])
    .default("polished"),
  confidence: z.number().min(0).max(1).default(0.7),
});

export type TextureAnalysis = z.infer<typeof TextureAnalysisSchema>;

// ============================================================================
// 7. IMAGERY STYLE SCHEMA
// ============================================================================

export const ImageryAnalysisSchema = z.object({
  subjects: z.array(z.string()).default([]),
  photographyStyle: z.array(z.string()).default([]),
  treatment: z.array(z.string()).default([]),
  lighting: z.string().default("natural light"),
  moodTone: z.string().default("editorial"),
  confidence: z.number().min(0).max(1).default(0.8),
});

export type ImageryAnalysis = z.infer<typeof ImageryAnalysisSchema>;

// ============================================================================
// 8. VISUAL RHYTHM SCHEMA
// ============================================================================

export const RhythmAnalysisSchema = z.object({
  type: z
    .enum([
      "repetitive",
      "modular",
      "editorial",
      "fluid",
      "organic",
      "chaotic",
      "structured",
      "cinematic",
      "minimal",
      "layered",
    ])
    .default("editorial"),
  repetition: z.number().min(0).max(1).default(0.5),
  pacing: z.number().min(0).max(1).default(0.5),
  confidence: z.number().min(0).max(1).default(0.75),
});

export type RhythmAnalysis = z.infer<typeof RhythmAnalysisSchema>;

// ============================================================================
// 9. COMPLETE PER-IMAGE ANALYSIS SCHEMA
// ============================================================================

export const ImageStyleAnalysisSchema = z.object({
  imageId: z.string(),
  dominantColors: z.array(z.string()).default([]),
  typography: TypographyAnalysisSchema,
  mood: MoodAnalysisSchema,
  composition: CompositionAnalysisSchema,
  density: DensityAnalysisSchema,
  contrast: ContrastAnalysisSchema,
  texture: TextureAnalysisSchema,
  imagery: ImageryAnalysisSchema,
  rhythm: RhythmAnalysisSchema,
  visualCharacteristics: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.8),
  cvMetrics: z.any().optional(),
});

export type ImageStyleAnalysis = z.infer<typeof ImageStyleAnalysisSchema>;

// ============================================================================
// 10. COLOR PALETTE STRUCTURE (CONSUMED FROM COLOR EXTRACTION)
// ============================================================================

export interface DNAColor {
  hex: string;
  name: string;
  role: "primary" | "secondary" | "accent" | "neutral";
  percentage?: number;
  population?: number;
}

export interface DNAPalette {
  primary: DNAColor[];
  secondary: DNAColor[];
  accent: DNAColor[];
  neutrals: DNAColor[];
  temperature: number; // 0 (cold/blue) to 1 (warm/red/earth)
  saturation: number; // 0 (desaturated) to 1 (vibrant)
  brightness: number; // 0 (dark) to 1 (light)
  rawHexList: string[]; // Authoritative extracted colors
}

// ============================================================================
// 11. SOURCE TRACEABILITY EVIDENCE
// ============================================================================

export interface DNAEvidence {
  trait: string;
  category: "composition" | "color" | "typography" | "mood" | "texture" | "density";
  observedCount: number;
  totalImages: number;
  frequency: number; // 0 - 1
  strength: "dominant pattern" | "strong recurring" | "moderate" | "occasional";
  summary: string;
}

// ============================================================================
// 12. FINAL SYNTHESIZED STYLE DNA
// ============================================================================

export interface StyleDNAConfidence {
  palette: number;
  typography: number;
  mood: number;
  composition: number;
  texture: number;
  density: number;
  overall: number;
}

export interface StyleDNA {
  id: string;

  identity: {
    name: string;
    tagline: string;
    description: string;
    keywords: string[];
  };

  palette: DNAPalette;

  typography: {
    detected?: boolean;
    primaryCategory: string;
    secondaryCategory: string;
    personality: string;
    weightPreference: string;
    casingPreference: string;
    spacingPreference: string;
    pairings: string[];
    displayFontExample: string;
    bodyFontExample: string;
  };

  mood: {
    minimalism: number;
    maximalism: number;
    calm: number;
    energy: number;
    elegance: number;
    playfulness: number;
    seriousness: number;
    warmth: number;
    coolness: number;
    futurism: number;
    nostalgia: number;
    luxury: number;
    rawness: number;
    softness: number;
    boldness: number;
  };

  composition: {
    symmetry: number;
    whitespace: number;
    grid: number;
    hierarchy: number;
    scaleContrast: number;
    alignment: string;
    layoutStyle: string;
  };

  density: number; // 0 to 1
  densityLabel: string;

  contrast: {
    overall: number;
    color: number;
    tonal: number;
    scale: number;
    typography: number;
    form: number;
  };

  texture: {
    materials: string[];
    tactileLevel: number;
    surfaceStyle: string;
    visualLanguage: string;
  };

  imagery: {
    subjects: string[];
    photographyStyle: string[];
    treatment: string[];
  };

  rhythm: {
    type: string;
    repetition: number;
    pacing: number;
  };

  principles: string[]; // 5–8 concise design principles
  doList: string[]; // 4-6 practical DO rules
  dontList: string[]; // 4-6 practical DON'T rules

  confidence: StyleDNAConfidence;
  sourceImageCount: number;
  evidence: DNAEvidence[];
  imageAnalyses?: ImageStyleAnalysis[];

  // Backward-compatible fields for existing UI, RadarChart & AI Studio
  name: string;
  styleName: string;
  style_name: string;
  theme: string;
  summary: string;
  personality: string;
  energy: string;
  tags: string[];
  harmony: string;
  gradients: string[];
  fingerprint: { label: string; value: number }[];
  twins: { name: string; match: number; note: string }[];
  paletteList?: { hex: string; name: string }[];
  createdAt?: string;
}
