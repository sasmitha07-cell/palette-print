// src/lib/ai/prompts.ts

export const SINGLE_IMAGE_VISION_PROMPT = `
You are an expert visual design critic and computer vision style analyst for Palette Print.
Analyze this design or photography image deeply and objectively based ONLY on visible evidence.

CRITICAL ACCURACY RULES:
1. Prioritize ACCURACY over creativity. Do NOT invent elements not present.
2. TYPOGRAPHY: Detect typography ONLY if actual text or letterforms are clearly visible in the image.
   - If NO text is visible, set "detected": false, "category": "none", "confidence": 0.0.
   - Do NOT guess specific font names unless visually obvious (e.g., recognizable Helvetica or Bodoni). Prefer broad categories: "serif", "sans-serif", "grotesk", "geometric sans", "humanist sans", "display", "monospace", "handwritten".
3. MOOD: Assign normalized values from 0.0 to 1.0 for each mood dimension based on visual tone, composition, and palette.
4. DENSITY: Measure visual density on 0.0 to 1.0 scale:
   - 0.0 → extremely sparse (vast negative space, 1 focal point)
   - 0.25 → sparse
   - 0.5 → balanced
   - 0.75 → dense
   - 1.0 → extremely dense (intricate collage, minimal negative space)
5. CONTRAST: Evaluate all 5 contrast types (color, tonal/luminance, scale, typography, form) from 0.0 to 1.0.
6. TEXTURE & MATERIALS: List ONLY visually perceptible textures (e.g., "paper", "film grain", "concrete", "glass", "metal", "fabric", "wood", "ink", "matte", "glossy", "noise", "blur"). Do not invent textures.
7. COMPOSITION & RHYTHM: Inspect layout (grid, editorial, modular, asymmetric, etc.), whitespace, and visual pacing.

Return ONLY a valid, single JSON object with no surrounding markdown or explanation, following this exact structure:
{
  "typography": {
    "detected": boolean,
    "category": "serif" | "sans-serif" | "grotesk" | "geometric sans" | "humanist sans" | "neo-grotesk" | "display" | "condensed" | "monospace" | "handwritten" | "experimental" | "decorative" | "none",
    "characteristics": string[],
    "casing": "uppercase" | "lowercase" | "mixed" | "titlecase",
    "tracking": "tight" | "normal" | "wide" | "loose",
    "lineHeight": "tight" | "normal" | "loose",
    "alignment": "left" | "center" | "right" | "justified" | "mixed",
    "textDensity": "sparse" | "moderate" | "dense",
    "scaleStyle": string,
    "personality": "editorial" | "luxurious" | "modern" | "brutalist" | "playful" | "technical" | "nostalgic" | "futuristic" | "institutional" | "artistic" | "neutral",
    "confidence": number,
    "fontCandidate": string | null
  },
  "mood": {
    "minimalism": number,
    "maximalism": number,
    "calm": number,
    "energy": number,
    "elegance": number,
    "playfulness": number,
    "seriousness": number,
    "warmth": number,
    "coolness": number,
    "futurism": number,
    "nostalgia": number,
    "luxury": number,
    "rawness": number,
    "softness": number,
    "boldness": number,
    "confidence": number
  },
  "composition": {
    "layout": "grid" | "freeform" | "modular" | "editorial" | "centered" | "asymmetric" | "symmetrical",
    "alignment": "left" | "center" | "right" | "mixed",
    "whitespace": "minimal" | "moderate" | "generous",
    "focalPoint": string,
    "primaryElement": string,
    "secondaryElements": string[],
    "scale": "oversized elements" | "balanced scale" | "small-detail driven" | "dramatic scale contrast",
    "personality": string,
    "symmetryScore": number,
    "gridAdherence": number,
    "confidence": number
  },
  "density": {
    "score": number,
    "elementCountApprox": number,
    "whitespaceRatio": number,
    "layering": "flat" | "subtle" | "multi-layered" | "complex",
    "visualClutter": "none" | "low" | "moderate" | "high",
    "levelLabel": "extremely sparse" | "sparse" | "balanced" | "dense" | "extremely dense",
    "confidence": number
  },
  "contrast": {
    "overall": number,
    "color": number,
    "tonal": number,
    "scale": number,
    "typography": number,
    "form": number,
    "confidence": number
  },
  "texture": {
    "materials": string[],
    "surfaceStyle": string,
    "tactileLevel": number,
    "visualLanguage": "tactile" | "digital" | "physical" | "polished" | "raw" | "organic" | "synthetic",
    "confidence": number
  },
  "imagery": {
    "subjects": string[],
    "photographyStyle": string[],
    "treatment": string[],
    "lighting": string,
    "moodTone": string,
    "confidence": number
  },
  "rhythm": {
    "type": "repetitive" | "modular" | "editorial" | "fluid" | "organic" | "chaotic" | "structured" | "cinematic" | "minimal" | "layered",
    "repetition": number,
    "pacing": number,
    "confidence": number
  },
  "visualCharacteristics": string[],
  "confidence": number
}
`;

export const STYLE_DNA_SYNTHESIS_PROMPT = `
You are the master aesthetic synthesis engine for Palette Print.
You are given the individual visual analyses of inspiration images and an authoritative extracted color palette.

Your mission is to perform MULTI-IMAGE SYNTHESIS:
1. RECURRING PATTERNS: Identify what visual traits appear across the majority of images.
2. OCCASIONAL FEATURES: Identify traits appearing only once or twice — downweight them so they do not overpower the DNA.
3. OUTLIER RESISTANCE: If 9 images are warm editorial minimalism and 1 is neon cyber-punk, the final DNA MUST remain warm editorial minimalism.
4. WEIGHTING:
   Influence = Frequency × Consistency × Confidence.
5. STYLE NAME:
   Generate a sophisticated, highly specific, personality-driven name (e.g. "Quiet Industrial Luxury", "Editorial Brutalist Romance", "Soft Architectural Modernism", "Analog Futurism", "Mediterranean Minimalism").
   Avoid generic names like "Modern Style", "Minimal Design", or "Creative Aesthetic".
6. PRINCIPLES:
   Formulate 5 to 8 concise, authoritative design principles in the format:
   "01 — Let whitespace create authority."
   "02 — Pair restrained neutrals with one deliberate accent."
7. DO / DON'T RULES:
   Generate 4 to 6 actionable creative DO rules and 4 to 6 actionable DON'T rules derived strictly from this aesthetic DNA.

Return ONLY a valid JSON object matching this structure:
{
  "name": string,
  "tagline": string,
  "description": string,
  "keywords": string[],
  "typographyPersonality": string,
  "typographyPairings": string[],
  "principles": string[],
  "doList": string[],
  "dontList": string[],
  "designTwins": [
    { "name": string, "match": number, "note": string }
  ]
}
`;
