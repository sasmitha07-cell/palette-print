import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildStyleDNAContext, type StyleDNAContext } from "./context";

export interface MoodboardItem {
  id: string;
  type: "image" | "color-swatch" | "typography" | "texture" | "note" | "material";
  role: "hero" | "secondary" | "texture" | "type" | "swatch" | "quote" | "material";
  title: string;
  subtitle?: string;
  prompt?: string;
  imageUrl?: string;
  colors?: { hex: string; name: string; role: string }[];
  content?: string;
  aspectRatio: string; // e.g. "3/4", "16/9", "1/1", "4/5"
  dnaFeature: string;
  h?: number;
}

export interface MoodboardCollection {
  id: string;
  theme: string;
  goal: string;
  dnaName: string;
  paletteHexes: string[];
  items: MoodboardItem[];
  designNotes: string[];
  keywords: string[];
  createdAt: string;
}

export interface GenerateMoodboardParams {
  dna: unknown;
  theme?: string;
  goal?: string;
  description?: string;
  seed?: number;
}

const GEMINI_KEY =
  process.env.VITE_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
  "";

/**
 * Generates a unified, DNA-consistent moodboard collection comprising hero images,
 * typography specimens, color swatches, tactile textures, and curatorial notes.
 */
export async function generateDynamicMoodboard(
  params: GenerateMoodboardParams,
): Promise<MoodboardCollection> {
  const ctx = buildStyleDNAContext(params.dna);
  const theme = params.theme || "Signature Aesthetic";
  const goal = params.goal || "Brand Evolution & Campaign Atmosphere";
  const seed = params.seed ?? 0;

  // Build items deterministically bound to the active DNA
  const items = synthesizeMoodboardItems(ctx, theme, goal, seed);

  return {
    id: `mb-${Date.now()}`,
    theme,
    goal,
    dnaName: ctx.identity.name,
    paletteHexes: ctx.palette.hexList,
    items,
    designNotes: [
      `Grounded in ${ctx.palette.temperatureLabel} tonality (${ctx.palette.hexList.slice(0, 3).join(", ")})`,
      `Spatial pacing prioritizes ${ctx.composition.whitespaceLabel}`,
      `Typographic anchor: ${ctx.typography.primaryCategory} with bespoke letter-spacing`,
      `Tactile finish: ${ctx.texture.surfaceStyle} on ${ctx.texture.materials.join(", ")}`,
    ],
    keywords: [...ctx.identity.keywords, theme.toLowerCase(), "cohesive mood"],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Regenerates an individual moodboard element while maintaining strict aesthetic cohesion.
 */
export async function regenerateMoodboardElement(
  item: MoodboardItem,
  dna: unknown,
  theme: string,
  variantIndex: number = 1,
): Promise<MoodboardItem> {
  const ctx = buildStyleDNAContext(dna);
  const p = ctx.palette;
  const t = ctx.typography;
  const tex = ctx.texture;

  if (item.type === "image") {
    const newPrompt = `editorial still-life for ${ctx.identity.name} (${theme}), variation ${variantIndex}, ${item.role} composition, ${p.temperatureLabel} lighting, ${p.accent.hex} accent touch, ${tex.surfaceStyle} tactile texture, 35mm film still, museum archival`;
    return {
      ...item,
      id: `mb-item-${Date.now()}`,
      title: `${item.title} (Var ${variantIndex})`,
      prompt: newPrompt,
      imageUrl: createStylizedSvgCard({
        title: item.title,
        subtitle: `${theme} · Var ${variantIndex}`,
        type: item.role === "hero" ? "hero" : "imagery",
        ctx,
        variantIndex,
      }),
    };
  }

  if (item.type === "typography") {
    return {
      ...item,
      id: `mb-item-${Date.now()}`,
      content:
        variantIndex % 2 === 0
          ? `“Form follows atmosphere, where ${ctx.composition.whitespaceLabel.toLowerCase()} commands authority.”`
          : `“A quiet aesthetic signature defined by ${t.primaryCategory} rhythm.”`,
      subtitle: `${t.primaryCategory} · ${t.personality}`,
    };
  }

  if (item.type === "texture") {
    const mat = tex.materials[variantIndex % tex.materials.length] || "tactile linen";
    return {
      ...item,
      id: `mb-item-${Date.now()}`,
      title: `Tactile Study: ${mat}`,
      content: `${tex.surfaceStyle} surface treatment with ${(tex.tactileLevel * 100).toFixed(0)}% micro-grain depth.`,
      imageUrl: createStylizedSvgCard({
        title: mat,
        subtitle: tex.surfaceStyle,
        type: "texture",
        ctx,
        variantIndex,
      }),
    };
  }

  return { ...item, id: `mb-item-${Date.now()}` };
}

function synthesizeMoodboardItems(
  ctx: StyleDNAContext,
  theme: string,
  goal: string,
  seed: number,
): MoodboardItem[] {
  const p = ctx.palette;
  const t = ctx.typography;
  const c = ctx.composition;
  const tex = ctx.texture;
  const name = ctx.identity.name;

  return [
    // 1. Hero Imagery Tile
    {
      id: `mb-${seed}-1`,
      type: "image",
      role: "hero",
      title: `${name} Monograph`,
      subtitle: `Hero Composition · ${theme}`,
      prompt: `editorial hero composition for ${name}, ${p.temperatureLabel} lighting, ${p.primary.hex} and ${p.accent.hex} tones, ${c.whitespaceLabel}, 35mm grain --ar 4:5`,
      imageUrl: createStylizedSvgCard({
        title: name,
        subtitle: "Hero Direction",
        type: "hero",
        ctx,
        variantIndex: seed,
      }),
      aspectRatio: "4/5",
      dnaFeature: `${c.whitespaceLabel} with ${p.primary.hex}`,
      h: 340,
    },

    // 2. Color Swatches Palette Tile
    {
      id: `mb-${seed}-2`,
      type: "color-swatch",
      role: "swatch",
      title: "Authoritative Palette",
      subtitle: `${p.temperatureLabel} (${(p.temperature * 100).toFixed(0)}% warm)`,
      colors: [
        { hex: p.primary.hex, name: p.primary.name, role: "Primary Canvas" },
        { hex: p.secondary.hex, name: p.secondary.name, role: "Secondary Form" },
        { hex: p.accent.hex, name: p.accent.name, role: "Focal Accent" },
        { hex: p.neutral.hex, name: p.neutral.name, role: "Base Neutral" },
      ],
      aspectRatio: "1/1",
      dnaFeature: `4-tier tonal hierarchy in ${p.temperatureLabel}`,
      h: 220,
    },

    // 3. Typographic Specimen Tile
    {
      id: `mb-${seed}-3`,
      type: "typography",
      role: "type",
      title: "Typographic Specimen",
      subtitle: `${t.primaryCategory} · ${t.personality}`,
      content: `“Space is not empty; it is the silent architecture through which meaning breathes.”`,
      aspectRatio: "3/4",
      dnaFeature: `${t.primaryCategory} display hierarchy`,
      h: 260,
    },

    // 4. Material & Texture Tile
    {
      id: `mb-${seed}-4`,
      type: "texture",
      role: "texture",
      title: `Tactile Finish: ${tex.materials[0] || "Fine Grain Stock"}`,
      subtitle: `${tex.surfaceStyle} · ${(tex.tactileLevel * 100).toFixed(0)}% tactile depth`,
      content: `Micro-grain surface with natural diffuse shadow absorption. Zero synthetic gloss.`,
      imageUrl: createStylizedSvgCard({
        title: tex.materials[0] || "Tactile Linen",
        subtitle: tex.surfaceStyle,
        type: "texture",
        ctx,
        variantIndex: seed + 1,
      }),
      aspectRatio: "1/1",
      dnaFeature: `${tex.surfaceStyle} material quality`,
      h: 240,
    },

    // 5. Secondary Architectural Reference Tile
    {
      id: `mb-${seed}-5`,
      type: "image",
      role: "secondary",
      title: "Spatial Asymmetry",
      subtitle: `${c.layoutStyle}`,
      prompt: `architectural detail, pure geometric shadows, natural sunlight, tones of ${p.hexList.slice(0, 3).join(", ")}, minimalist monolith --ar 3:4`,
      imageUrl: createStylizedSvgCard({
        title: "Spatial Monolith",
        subtitle: c.layoutStyle,
        type: "imagery",
        ctx,
        variantIndex: seed + 2,
      }),
      aspectRatio: "3/4",
      dnaFeature: c.layoutStyle,
      h: 300,
    },

    // 6. Curatorial Note / Principle Tile
    {
      id: `mb-${seed}-6`,
      type: "note",
      role: "quote",
      title: "Core Principle",
      subtitle: "Synthesized DNA Directive",
      content:
        ctx.principles[0] ||
        `Honor ${t.primaryCategory} hierarchy while preserving ${c.whitespaceLabel}.`,
      aspectRatio: "4/5",
      dnaFeature: "Primary Design Rule",
      h: 200,
    },

    // 7. Third Editorial Vignette Tile
    {
      id: `mb-${seed}-7`,
      type: "image",
      role: "secondary",
      title: "Atmospheric Shadow",
      subtitle: `Natural Diffused Illumination`,
      prompt: `editorial tactile still life on ${tex.materials[0] || "linen"}, gentle diagonal sunlight, palette ${p.accent.hex} and ${p.neutral.hex} --ar 1:1`,
      imageUrl: createStylizedSvgCard({
        title: "Natural Light",
        subtitle: "Diffuse Shadows",
        type: "imagery",
        ctx,
        variantIndex: seed + 3,
      }),
      aspectRatio: "1/1",
      dnaFeature: `${p.accent.hex} solitary accent`,
      h: 280,
    },

    // 8. Visual Keywords & Token Tags Tile
    {
      id: `mb-${seed}-8`,
      type: "material",
      role: "material",
      title: "Aesthetic Vocabulary",
      subtitle: "Visual Identifiers",
      content: ctx.identity.keywords.join(" · "),
      aspectRatio: "16/9",
      dnaFeature: "Synthesized Keywords",
      h: 180,
    },
  ];
}

/**
 * Creates high-fidelity, DNA-driven SVG card visualizations.
 * Uses exact DNA hex colors, geometry, typography classes, and tactile noise layers.
 */
function createStylizedSvgCard({
  title,
  subtitle,
  type,
  ctx,
  variantIndex = 0,
}: {
  title: string;
  subtitle: string;
  type: "hero" | "imagery" | "texture";
  ctx: StyleDNAContext;
  variantIndex?: number;
}): string {
  const p = ctx.palette;
  const bg = type === "hero" ? p.primary.hex : type === "texture" ? p.neutral.hex : p.secondary.hex;
  const fg = type === "hero" ? p.neutral.hex : type === "texture" ? p.primary.hex : p.neutral.hex;
  const accent = p.accent.hex;

  const fontFam = ctx.typography.primaryCategory.includes("serif")
    ? "Georgia, serif"
    : "system-ui, sans-serif";
  const rot = (variantIndex * 17) % 360;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
  <defs>
    <linearGradient id="grad-${variantIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}" stop-opacity="1" />
      <stop offset="100%" stop-color="${p.primary.hex}" stop-opacity="0.9" />
    </linearGradient>
    <filter id="noise-${variantIndex}">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.08 0"/>
      <feComposite in2="SourceGraphic" in="gl" operator="in" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="400" height="500" fill="url(#grad-${variantIndex})" />
  <rect width="400" height="500" fill="#ffffff" opacity="0.04" filter="url(#noise-${variantIndex})" />

  <!-- Geometric DNA Composition -->
  <g transform="translate(200, 220) rotate(${rot})">
    <circle r="110" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.45" stroke-dasharray="4 4" />
    <circle r="70" fill="none" stroke="${fg}" stroke-width="0.75" opacity="0.25" />
    <rect x="-40" y="-40" width="80" height="80" fill="${accent}" opacity="0.18" />
  </g>

  <!-- Accent indicator mark -->
  <circle cx="350" cy="50" r="8" fill="${accent}" />

  <!-- Typography Content -->
  <text x="36" y="380" font-family="${fontFam}" font-size="28" font-style="italic" fill="${fg}" font-weight="600" letter-spacing="-0.5">
    ${escapeXml(title)}
  </text>
  <text x="36" y="415" font-family="system-ui, sans-serif" font-size="12" fill="${fg}" opacity="0.75" text-transform="uppercase" letter-spacing="2">
    ${escapeXml(subtitle)}
  </text>

  <!-- DNA Signature Coordinates -->
  <line x1="36" y1="445" x2="364" y2="445" stroke="${fg}" stroke-width="0.5" opacity="0.25" />
  <text x="36" y="470" font-family="monospace" font-size="9" fill="${fg}" opacity="0.5" letter-spacing="1">
    DNA REF · ${p.primary.hex} · ${accent}
  </text>
  <text x="364" y="470" text-anchor="end" font-family="monospace" font-size="9" fill="${fg}" opacity="0.5">
    ${(ctx.composition.whitespace * 100).toFixed(0)}% NEG-SPACE
  </text>
</svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
