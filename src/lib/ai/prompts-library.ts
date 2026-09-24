import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildStyleDNAContext, type StyleDNAContext } from "./context";

export interface StylePrompt {
  id: string;
  title: string;
  category: string;
  engine: string;
  prompt: string;
  purpose: string;
  variables: string[];
  dnaFeaturesUsed: string[];
  createdAt: string;
}

export interface PromptLibraryResult {
  enginePrompts: Record<string, string>;
  categoryPrompts: StylePrompt[];
}

export interface EnhancePromptParams {
  userIdea: string;
  targetEngine?: string;
  category?: string;
  dna: unknown;
}

const GEMINI_KEY =
  process.env.VITE_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
  "";

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_MODEL) ||
  "gemini-3.6-flash";

/**
 * Generates an exhaustive, DNA-tailored prompt library for multiple AI engines
 * and creative categories.
 */
export async function generatePromptLibrary(
  dna: unknown,
  seedOffset: number = 0,
): Promise<PromptLibraryResult> {
  const ctx = buildStyleDNAContext(dna);

  if (GEMINI_KEY && GEMINI_KEY.length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.85,
        },
      });

      const prompt = `${ctx.systemPrompt}

TASK:
Generate a specialized prompt library reflecting this exact Style DNA.
Seed offset: ${seedOffset}.

OUTPUT REQUIRED (JSON format):
{
  "enginePrompts": {
    "Midjourney": "Complete visual prompt syntax with --ar, --style raw, lighting, colors ${ctx.palette.hexList.join(", ")}, texture",
    "Flux": "Photorealistic descriptive scene text with camera specs, 35mm film, lighting, ${ctx.typography.primaryCategory} signage",
    "Stable Diffusion": "Masterpiece quality tag-dense prompt with weights (e.g. (editorial:1.2)), colors, texture",
    "ChatGPT": "Complete system prompt instruction for creative copy & branding aligned to ${ctx.identity.name}",
    "Gemini": "Multimodal creative director brief detailing layout, colors, typography, and atmosphere",
    "Claude": "Comprehensive artifact and design system architectural directive for web & print"
  },
  "categoryPrompts": [
    {
      "id": "p-1",
      "title": "Editorial Website Hero",
      "category": "Website",
      "engine": "Midjourney",
      "prompt": "...",
      "purpose": "Hero section concept",
      "variables": ["Brand Name", "Product Title"],
      "dnaFeaturesUsed": ["${ctx.typography.primaryCategory}", "${ctx.palette.primary.hex}", "${ctx.composition.whitespaceLabel}"]
    },
    ...generate 8 diverse categories: Website, Branding, Logo, Photography, Fashion, Editorial, Architecture, UI
  ]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      if (parsed?.enginePrompts && Array.isArray(parsed?.categoryPrompts)) {
        return {
          enginePrompts: parsed.enginePrompts,
          categoryPrompts: parsed.categoryPrompts.map((p: Partial<StylePrompt>, i: number) => ({
            id: p.id || `prompt-${Date.now()}-${i}`,
            title: p.title || `DNA Prompt ${i + 1}`,
            category: p.category || "General",
            engine: p.engine || "Midjourney",
            prompt: p.prompt || "",
            purpose: p.purpose || "Creative direction",
            variables: p.variables || [],
            dnaFeaturesUsed: p.dnaFeaturesUsed || [
              ctx.typography.primaryCategory,
              ctx.palette.primary.hex,
            ],
            createdAt: new Date().toISOString(),
          })),
        };
      }
    } catch (err) {
      console.warn("[Prompts] Gemini generation fell back to DNA token generation:", err);
    }
  }

  // Resilient Parametric DNA Synthesis Engine
  return synthesizeParametricPrompts(ctx, seedOffset);
}

/**
 * Transforms a user's rough idea into a rich, DNA-aware creative prompt.
 */
export async function enhanceUserPrompt(params: EnhancePromptParams): Promise<{
  enhancedPrompt: string;
  explanation: string;
  dnaTokensInjected: string[];
}> {
  const ctx = buildStyleDNAContext(params.dna);
  const idea = params.userIdea.trim();
  const engine = params.targetEngine || "Midjourney";

  if (GEMINI_KEY && GEMINI_KEY.length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const prompt = `${ctx.systemPrompt}

USER RAW IDEA:
"${idea}"

TARGET ENGINE:
"${engine}"

TASK:
Transform this user's idea into an ultra-high-fidelity, production-ready creative prompt for ${engine}.
Inject the user's specific Style DNA tokens:
- Exact palette: ${ctx.palette.hexList.join(", ")}
- Typography: ${ctx.typography.primaryCategory} and ${ctx.typography.secondaryCategory}
- Whitespace & Layout: ${ctx.composition.whitespaceLabel}, ${ctx.composition.layoutStyle}
- Texture & Finish: ${ctx.texture.surfaceStyle}, ${ctx.texture.materials.join(", ")}
- Atmosphere: ${ctx.imagery.lighting}

Return JSON:
{
  "enhancedPrompt": "...",
  "explanation": "Why this prompt faithfully translates the user's idea through their Style DNA",
  "dnaTokensInjected": ["..."]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      if (parsed?.enhancedPrompt) {
        return {
          enhancedPrompt: parsed.enhancedPrompt,
          explanation: parsed.explanation || "Enhanced using active Style DNA parameters.",
          dnaTokensInjected: parsed.dnaTokensInjected || [
            ctx.identity.name,
            ctx.palette.primary.hex,
          ],
        };
      }
    } catch (err) {
      console.warn("[Prompts] Prompt enhancement fallback:", err);
    }
  }

  // Parametric prompt enhancement fallback
  const tokensInjected = [
    ctx.identity.name,
    `${ctx.palette.primary.hex} & ${ctx.palette.accent.hex}`,
    ctx.typography.primaryCategory,
    ctx.composition.whitespaceLabel,
    ctx.texture.surfaceStyle,
  ];

  let enhanced = "";
  if (engine.toLowerCase().includes("midjourney") || engine.toLowerCase().includes("flux")) {
    enhanced = `${idea}, aesthetic of ${ctx.identity.name}, ${ctx.composition.whitespaceLabel}, palette in ${ctx.palette.hexList.slice(0, 4).join(" ")}, featuring ${ctx.typography.primaryCategory} typography accents, tactile ${ctx.texture.surfaceStyle} on ${ctx.texture.materials[0] || "matte stock"}, ${ctx.imagery.lighting}, editorial composition, studio still-life --ar 16:9 --style raw --v 6.1`;
  } else {
    enhanced = `Design a ${idea} rooted in the '${ctx.identity.name}' Style DNA signature. Ground the visual language in an authoritative palette of ${ctx.palette.hexList.join(", ")}, with ${ctx.palette.primary.hex} as the primary anchor and ${ctx.palette.accent.hex} for solitary focal emphasis. Employ ${ctx.typography.primaryCategory} for primary display hierarchy paired with ${ctx.typography.secondaryCategory} for metadata. Ensure ${ctx.composition.whitespaceLabel} with an asymmetric layout, finished with tactile ${ctx.texture.surfaceStyle} textures.`;
  }

  return {
    enhancedPrompt: enhanced,
    explanation: `Infused your '${ctx.identity.name}' visual DNA: mapped ${ctx.palette.accent.hex} as the focal accent, set typography to ${ctx.typography.primaryCategory}, and enforced ${ctx.composition.whitespaceLabel}.`,
    dnaTokensInjected: tokensInjected,
  };
}

function synthesizeParametricPrompts(
  ctx: StyleDNAContext,
  seedOffset: number,
): PromptLibraryResult {
  const p = ctx.palette;
  const t = ctx.typography;
  const c = ctx.composition;
  const tex = ctx.texture;
  const name = ctx.identity.name;

  const hexString = p.hexList.slice(0, 4).join(" ");
  const accentToken = `${p.accent.name} (${p.accent.hex})`;

  const enginePrompts: Record<string, string> = {
    Midjourney: `editorial ${name.toLowerCase()} spread, ${p.temperatureLabel} palette featuring ${hexString}, ${accentToken} focal point, ${t.primaryCategory} display hierarchy, ${tex.surfaceStyle} texture, ${c.whitespaceLabel}, asymmetric layout, natural daylight, soft cinematic shadows, museum archival framing --ar 3:4 --style raw --v 6.1`,
    Flux: `a bespoke ${name.toLowerCase()} visual composition, color tones: ${hexString}, crisp ${t.primaryCategory} type specimen, ${tex.materials.join(" and ")}, ${c.whitespaceLabel}, ${tex.surfaceStyle} finish, 35mm film still, soft directional morning light, Hasselblad 80mm lens perspective, high dynamic tonal range`,
    "Stable Diffusion": `(masterpiece:1.2), (editorial ${name.toLowerCase()}:1.3), ${p.temperatureLabel} palette (${hexString}), ${t.primaryCategory} typography, asymmetric grid, ${tex.surfaceStyle}, ${c.whitespaceLabel}, cinematic soft lighting, 8k resolution, tactile fine-art print`,
    ChatGPT: `Act as a master creative director. Working strictly within the '${name}' Style DNA (Palette: ${p.hexList.join(", ")}; Display: ${t.primaryCategory}; Body: ${t.secondaryCategory}; Composition: ${c.layoutStyle} with ${c.whitespaceLabel}; Texture: ${tex.surfaceStyle}), develop a comprehensive creative strategy and tone-of-voice guide with zero commercial clichés.`,
    Gemini: `Analyze and design an editorial design system rooted in the '${name}' aesthetic. Anchor the canvas on ${p.neutral.hex}, balance structural hierarchy in ${p.primary.hex}, and apply ${p.accent.hex} exclusively for high-priority interactive moments. Honor ${c.whitespaceLabel} and ${t.primaryCategory} typography throughout.`,
    Claude: `You are an expert design systems architect. Generate the full visual tokens and layout rules for '${name}'. Include CSS color variables for [${p.hexList.join(", ")}], font pairing rules for ${t.primaryCategory} and ${t.secondaryCategory}, and spatial constraints for ${c.whitespaceLabel}.`,
  };

  const categories = [
    {
      cat: "Website",
      title: "Hero Viewport Composition",
      purpose: "Full-bleed digital flagship landing page",
      prompt: `editorial website hero for ${name.toLowerCase()}, asymmetric left-anchored layout, ${c.whitespaceLabel}, oversized ${t.primaryCategory} typography headline, ${p.neutral.hex} background, single ${p.accent.hex} interaction beacon, tactile ${tex.surfaceStyle} product showcase, natural diffuse lighting`,
    },
    {
      cat: "Branding",
      title: "Tactile Collateral Suite",
      purpose: "Stationery, business cards, and brand identity suite",
      prompt: `prestigious brand identity suite on ${tex.materials[0] || "uncoated paper stock"}, blind debossed ${name.toLowerCase()} emblem, ${p.primary.hex} ink stamping, ${accentToken} wax seal, tactile grain, flat-lay studio lighting`,
    },
    {
      cat: "Logo",
      title: "Architectural Wordmark Mark",
      purpose: "Vector identity and typographic seal",
      prompt: `bespoke wordmark logo featuring ${t.primaryCategory} with custom ligatures, subtle optical kerning, ${p.primary.hex} silhouette on ${p.neutral.hex} canvas, architectural clarity, vector masterwork`,
    },
    {
      cat: "Photography",
      title: "Still-Life Editorial Vignette",
      purpose: "Atmospheric imagery for campaign hero banners",
      prompt: `curated still-life photography, ${tex.materials.join(" and ")}, gentle morning shadows, color palette matching ${hexString}, 35mm analog grain, editorial art direction, quiet spatial pause`,
    },
    {
      cat: "Editorial",
      title: "Magazine Multi-Column Spread",
      purpose: "Long-form editorial publication layout",
      prompt: `two-page editorial publication spread, asymmetric typographic columns, ${t.primaryCategory} drop caps, ${c.whitespaceLabel}, archival footnotes, ${p.primary.hex} typography on warm bone paper`,
    },
    {
      cat: "Architecture",
      title: "Spatial Monolith Interior",
      purpose: "Environmental and spatial brand manifestation",
      prompt: `contemporary architectural interior, monolithic stone and natural wood, warm ambient daylight filtering through clerestory windows, palette reflecting ${hexString}, serene minimalism, high-end gallery atmosphere`,
    },
    {
      cat: "UI",
      title: "Tactile Dashboard Component",
      purpose: "Product interface with bespoke design tokens",
      prompt: `minimalist web app interface, hairline border dividers in ${p.secondary.hex}, high-contrast typography in ${t.secondaryCategory}, ${p.accent.hex} active states, generous negative space padding, dark/light balanced`,
    },
    {
      cat: "Social Media",
      title: "Curated Story Carousel Card",
      purpose: "High-impact social media post layout",
      prompt: `editorial social media slide card, 4:5 vertical aspect ratio, bold italic ${t.primaryCategory} title, ${p.neutral.hex} backdrop with subtle tactile grain, restrained ${p.accent.hex} chapter tag, museum-grade layout`,
    },
  ];

  const rotated = [
    ...categories.slice(seedOffset % categories.length),
    ...categories.slice(0, seedOffset % categories.length),
  ];

  const categoryPrompts: StylePrompt[] = rotated.map((item, idx) => ({
    id: `prompt-cat-${seedOffset}-${idx + 1}`,
    title: item.title,
    category: item.cat,
    engine: idx % 2 === 0 ? "Midjourney" : "Flux",
    prompt: item.prompt,
    purpose: item.purpose,
    variables: ["Project Name", "Hero Subject", "Release Date"],
    dnaFeaturesUsed: [name, t.primaryCategory, p.primary.hex, p.accent.hex, c.whitespaceLabel],
    createdAt: new Date().toISOString(),
  }));

  return {
    enginePrompts,
    categoryPrompts,
  };
}
