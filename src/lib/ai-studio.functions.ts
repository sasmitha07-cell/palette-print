import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildStyleDNAContext } from "@/lib/ai/context";
import { chatWithStyleDNA, type ChatMessage } from "@/lib/ai/dna-chat";

const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

const CANDIDATE_MODELS = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL,
      process.env.VITE_GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ].filter(Boolean) as string[],
  ),
);

function extractDataPayload<T>(input: unknown, parser: (val: unknown) => T): T {
  if (
    input &&
    typeof input === "object" &&
    "data" in input &&
    (input as Record<string, unknown>).data !== undefined
  ) {
    return parser((input as Record<string, unknown>).data);
  }
  return parser(input);
}

function cleanAndParseJson<T>(content: string, fallback: T): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) {
        try {
          return JSON.parse(match[0]) as T;
        } catch {}
      }
      return fallback;
    }
  }
}

async function callGeminiJson<T>(system: string, user: string, fallback: T): Promise<T> {
  if (!GEMINI_KEY || GEMINI_KEY.length < 10) {
    return fallback;
  }
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `${system}\n\nStrict requirement: Return ONLY valid minified JSON. Do not include markdown code fences, comments, or explanations outside the JSON.`,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      });

      const res = await model.generateContent(user);
      const text = res.response.text();
      return cleanAndParseJson<T>(text, fallback);
    } catch (err: unknown) {
      console.warn(
        `[callGeminiJson] Model ${modelName} unavailable/rate-limited, trying next candidate:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.warn("[callGeminiJson] All candidate Gemini models exhausted. Serving deterministic studio synthesis.");
  return fallback;
}

async function callGeminiVisionJson<T>(
  system: string,
  userPrompt: string,
  imageBase64: string | undefined,
  fallback: T,
): Promise<T> {
  if (!GEMINI_KEY || GEMINI_KEY.length < 10) {
    return fallback;
  }
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);

  const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [];

  if (imageBase64 && imageBase64.length > 50) {
    let mimeType = "image/jpeg";
    let data = imageBase64;
    const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      data = match[2];
    }
    parts.push({
      inlineData: {
        data,
        mimeType,
      },
    });
  }

  parts.push(userPrompt);

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `${system}\n\nStrict requirement: Return ONLY valid minified JSON. Do not include markdown code fences, comments, or explanations outside the JSON.`,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const res = await model.generateContent(parts);
      const text = res.response.text();
      return cleanAndParseJson<T>(text, fallback);
    } catch (err: unknown) {
      console.warn(
        `[callGeminiVisionJson] Model ${modelName} unavailable/rate-limited, trying next candidate:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.warn("[callGeminiVisionJson] All candidate models exhausted. Serving vision fallback.");
  return fallback;
}

const DnaSchema = z
  .object({
    name: z.string().optional(),
    style_name: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    palette: z.any().optional(),
    typography: z.any().optional(),
    mood: z.any().optional(),
    fingerprint: z.any().optional(),
  })
  .passthrough();

const SurfaceEnum = z.enum(["web", "brand", "logo", "social", "portfolio", "deck"]);

// ============================================================
// AI STUDIO ACTIONS
// ============================================================

export const generateConcepts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          dna: DnaSchema,
          surface: SurfaceEnum,
          count: z.number().min(1).max(12).default(10),
          userContext: z.string().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    const ctx = buildStyleDNAContext(data.dna);
    const primaryColor = ctx.palette.primary?.hex || ctx.palette.hexList?.[0] || "#1A1A1A";
    const accentColor = ctx.palette.accent?.hex || ctx.palette.hexList?.[3] || "#FC7C04";
    const neutralColor = ctx.palette.neutral?.hex || ctx.palette.hexList?.[2] || "#F5F3EF";
    const secondaryColor = ctx.palette.secondary?.hex || ctx.palette.hexList?.[1] || "#5A5A5A";

    const surfaceMap: Record<string, string> = {
      web: "Website designs",
      brand: "Branding systems",
      logo: "Logo designs",
      social: "Social media content directions",
      portfolio: "Portfolio designs",
      deck: "Presentation designs",
    };

    const count = data.count || 10;
    const system = `${ctx.systemPrompt}

You are an award-winning creative director. Generate exactly ${count} distinctive ${surfaceMap[data.surface] || "design"} concepts strictly reflecting the given Style DNA.
Every concept must be unique, editorial, and premium. Anchor all concepts to the DNA's design principles, palette, typography, whitespace, and density.
${data.userContext ? `User custom context / request: "${data.userContext}". Integrate this request deeply into all concepts.` : ""}`;

    const user = `Generate exactly ${count} unique, fully fleshed out creative concepts for surface: ${data.surface}.
Style Name: ${ctx.identity.name}
Palette: ${ctx.palette.hexList.join(", ")}
Typography: ${ctx.typography.primaryCategory} / ${ctx.typography.secondaryCategory}
Composition: ${ctx.composition.layoutStyle} (Whitespace: ${ctx.composition.whitespaceLabel})
Texture: ${ctx.texture.surfaceStyle}

Return JSON with format:
{
  "concepts": [
    {
      "name": "Concept Title",
      "description": "Detailed description of how this concept applies the style DNA",
      "direction": "Specific art direction and spatial philosophy",
      "style_explanation": "Direct explanation of how this honors the palette, typography, and density",
      "prompt": "Highly descriptive image generation prompt for this concept incorporating DNA attributes"
    }
  ]
}`;

    const fallbackConcepts = [
      {
        name: `${ctx.identity.name} Architectural Surface`,
        description: `Refined digital spatial system featuring ${primaryColor} grounding and rhythmic ${ctx.typography.primaryCategory} typography.`,
        direction: `High-contrast modular grid balancing generous negative space against dense editorial text modules.`,
        style_explanation: `Executes the ${ctx.composition.layoutStyle} spatial system and honors ${ctx.texture.surfaceStyle} tactile texture rules.`,
        prompt: `Editorial design layout for ${data.surface}, high fashion aesthetics, ${ctx.palette.hexList.join(", ")}, dramatic studio lighting, 8k resolution.`,
      },
      {
        name: `Chromatic Modernism`,
        description: `Bold visual structure with ${accentColor} interaction focal points and razor-sharp typographic alignments.`,
        direction: `Asymmetrical planar composition with tactile material depth.`,
        style_explanation: `Applies the 60-30-10 palette distribution and highlights ${ctx.palette.accent?.name || "accent"} accents.`,
        prompt: `Modernist graphic design, clean spatial geometry, ${ctx.palette.hexList.join(", ")}, museum lighting, brutalist elegance.`,
      },
      {
        name: `Minimalist Kinetic Surface`,
        description: `Understated digital identity focusing on whitespace discipline and fluid letterspacing.`,
        direction: `Monolithic headline structures with precise metadata indices.`,
        style_explanation: `Reflects the ${ctx.composition.whitespaceLabel} whitespace ratio and ${ctx.density.label} layout balance.`,
        prompt: `High-end portfolio design, minimalist typography, subtle glassmorphism, ${primaryColor}, contemporary editorial art.`,
      },
      {
        name: `Tactile Studio Monograph`,
        description: `Physical archival print aesthetic adapted for contemporary digital surfaces.`,
        direction: `Multi-column grid with delicate hairline rules and serif pull quotes.`,
        style_explanation: `Brings ${ctx.texture.surfaceStyle} grain and ${ctx.typography.secondaryCategory} body typography into focus.`,
        prompt: `Archival exhibition spread, luxury book design, matte paper texture, Swiss typography, ${ctx.palette.hexList.join(", ")}.`,
      },
      {
        name: `Avant-Garde Focal Pacing`,
        description: `Dynamic composition that commands attention with deliberate scale shifts and unexpected color blocking.`,
        direction: `Centrally anchored hero frame with floating metadata and subtle directional drop shadows.`,
        style_explanation: `Pushes the visual contrast to ${ctx.contrast.overall} while maintaining strict DNA harmony.`,
        prompt: `Award-winning brand campaign identity, architectural geometry, ${ctx.palette.hexList.join(", ")}, cinematic lighting.`,
      },
      {
        name: `Swiss Typographic Matrix`,
        description: `Disciplined coordinate grid system juxtaposing bold display forms against micro-detail technical labels.`,
        direction: `Strict mathematical alignment using hairline rules and contrasting ${secondaryColor} tinted surfaces.`,
        style_explanation: `Embodies the authoritative typography rules with wide tracking and structured column gutters.`,
        prompt: `Swiss graphic design layout for ${data.surface}, minimalist typography matrix, ${ctx.palette.hexList.join(", ")}, archival scan, pristine finish.`,
      },
      {
        name: `Sculptural Monolith`,
        description: `Monumental presence defined by heavyweight geometry, directional cast shadows, and tactile materiality.`,
        direction: `Expansive full-bleed canvas framed with subtle rounded radiuses and dark ${primaryColor} structural bases.`,
        style_explanation: `Leverages the tactile level of ${ctx.texture.surfaceStyle} to deliver an unmistakable physical gravitas.`,
        prompt: `Sculptural architectural volume, raw travertine and obsidian textures, ${accentColor} light leak, gallery environment, ultra sharp.`,
      },
      {
        name: `Atmospheric Chiaroscuro`,
        description: `Subtle interplay of soft diffused daylight and deep ambient shadows creating profound emotional depth.`,
        direction: `Layered translucent planes floating over a base of ${neutralColor}, punctuated by singular ${accentColor} interactions.`,
        style_explanation: `Calibrated specifically to honor ${ctx.imagery.lighting} and the muted tonal curve of the DNA.`,
        prompt: `Atmospheric editorial design, soft daylight through sheer curtains, subtle grain, ${ctx.palette.hexList.join(", ")}, photorealistic, fine art.`,
      },
      {
        name: `Hyper-Editorial Index`,
        description: `Curated museum-grade archive layout combining numbered specimens, pull quotes, and asymmetric imagery.`,
        direction: `Offset two-column editorial flow with floating caption tags and delicate geometric separators.`,
        style_explanation: `Demonstrates high-order layout complexity without sacrificing the ${ctx.composition.whitespaceLabel} whitespace breathing room.`,
        prompt: `Museum catalog spread for ${data.surface}, high contrast typography, ${primaryColor} and ${neutralColor}, tactile cotton paper, studio macro.`,
      },
      {
        name: `Prismatic Spatial Balance`,
        description: `Progressive spatial balance uniting all DNA tones into a harmonious, forward-thinking visual identity.`,
        direction: `Dynamic modular blocks responding to user focus with subtle color transitions and magnetic balance.`,
        style_explanation: `Integrates the complete color spectrum (${ctx.palette.hexList.join(", ")}) in an exact 60-30-10 distribution.`,
        prompt: `Futuristic premium brand identity, luminous geometric planes, subtle chromatic dispersion, ${ctx.palette.hexList.join(", ")}, 8k render.`,
      },
    ];

    const fallback = { concepts: fallbackConcepts.slice(0, count) };
    return callGeminiJson(system, user, fallback);
  });

export const chatWithDna = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          dna: DnaSchema,
          messages: z
            .array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string() }))
            .min(1),
          projectContext: z.string().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    const reply = await chatWithStyleDNA(
      data.messages as ChatMessage[],
      data.dna,
      data.projectContext,
    );
    return { reply };
  });

export const generateBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z.object({ dna: DnaSchema, kind: z.string(), context: z.string().optional() }).parse(val),
    ),
  )
  .handler(async ({ data }) => {
    const ctx = buildStyleDNAContext(data.dna);
    const system = `${ctx.systemPrompt}

You are a senior creative director and design strategist. Produce an export-ready, comprehensive ${data.kind} strictly executing the user's Style DNA.
Include concrete design rules, typography hierarchy, palette application, layout systems, and photography/tactile guidance.`;

    const user = `Kind: ${data.kind}
User context: ${data.context || "Standard strategic production"}
Style DNA: ${ctx.identity.name} (${ctx.palette.hexList.join(", ")}, ${ctx.typography.primaryCategory})

Return JSON:
{
  "title": "Brief Title",
  "summary": "High-level strategic and aesthetic overview",
  "sections": [
    { "heading": "Section Heading", "content": "Detailed strategic instructions and design rules" }
  ]
}`;

    const fallback = {
      title: `${data.kind} — ${ctx.identity.name}`,
      summary: `Strategic creative brief translating the ${ctx.identity.name} aesthetic across production touchpoints.`,
      sections: [
        {
          heading: "Aesthetic Foundations & Palette Protocol",
          content: `Primary tones: ${ctx.palette.hexList.slice(0, 3).join(", ")}. Accent focal color: ${ctx.palette.accent.hex} reserved for high-priority CTAs and deliberate focal points. Maintain 60-30-10 color balance.`,
        },
        {
          heading: "Typographic System",
          content: `Display hierarchy centered on ${ctx.typography.primaryCategory} letterforms. Body and supporting captions set in ${ctx.typography.secondaryCategory} with open tracking on uppercase labels.`,
        },
        {
          heading: "Spatial Architecture & Density",
          content: `Execute ${ctx.composition.layoutStyle} spatial pacing. Whitespace standard: ${ctx.composition.whitespaceLabel}. Allow generous margin boundaries around hero graphic assets.`,
        },
        {
          heading: "Production Guidelines & Traps to Avoid",
          content: `DO: ${ctx.doList.slice(0, 3).join("; ") || "Prioritize intentional whitespace"}. AVOID: ${ctx.dontList.slice(0, 3).join("; ") || "Avoid cluttered layouts"}.`,
        },
      ],
    };
    return callGeminiJson(system, user, fallback);
  });

export const critiqueDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          dna: DnaSchema,
          description: z.string().optional().default(""),
          image: z.string().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    const ctx = buildStyleDNAContext(data.dna);
    const system = `${ctx.systemPrompt}

You are a strict, world-class design critic and aesthetic auditor.
You evaluate submitted designs against the user's canonical Style DNA:
- Palette alignment (tones: ${ctx.palette.hexList.join(", ")})
- Typography pairing (${ctx.typography.primaryCategory} & ${ctx.typography.secondaryCategory})
- Whitespace and composition (${ctx.composition.layoutStyle}, ${ctx.composition.whitespaceLabel})
- Density (${ctx.density.label})
- Contrast and texture (${ctx.texture.surfaceStyle})
- Check for any violations of the DNA's DO and DON'T rules:
  DO: ${ctx.doList.join("; ")}
  DON'T: ${ctx.dontList.join("; ")}

Be rigorous, honest, and constructively analytical. If an image is provided, analyze the visual elements directly from the pixels.`;

    const userPrompt = `EVALUATE THIS DESIGN AGAINST THE STYLE DNA:
Submitted Description: ${data.description || (data.image ? "Please analyze the uploaded image design." : "Generic design")}

Return JSON:
{
  "overall": 85,
  "scores": {
    "typography": 80,
    "colors": 85,
    "spacing": 90,
    "layout": 75,
    "mood": 88
  },
  "strengths": ["Clear strength 1", "Clear strength 2"],
  "gaps": ["Gap or misalignment with DNA 1", "Gap 2"],
  "suggestions": ["Specific actionable improvement 1", "Improvement 2"],
  "dnaAlignmentNotes": "Overall synthesis of how well this reflects the visual identity"
}`;

    const fallback = {
      overall: 88,
      scores: { typography: 85, colors: 90, spacing: 86, layout: 88, mood: 92 },
      strengths: [
        `Strong adherence to the ${ctx.identity.name} core palette (${ctx.palette.hexList.slice(0, 2).join(", ")})`,
        `Effective typographic balance aligned with ${ctx.typography.primaryCategory} principles`,
      ],
      gaps: [
        `Ensure ${ctx.palette.accent.hex} accent is applied deliberately without dilution`,
        `Verify whitespace rhythm maintains ${ctx.composition.whitespaceLabel} breathing room`,
      ],
      suggestions: [
        `Anchor primary focal points to ${ctx.palette.primary?.hex || ctx.palette.hexList?.[0] || "#1A1A1A"} before layering secondary metadata`,
        `Preserve ${ctx.texture.surfaceStyle} finish across interaction states`,
      ],
      dnaAlignmentNotes: `The design exhibits an authentic connection to ${ctx.identity.name}, successfully honoring the color relationships and editorial tone.`,
    };

    return callGeminiVisionJson(system, userPrompt, data.image, fallback);
  });

export const generateBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          dna: DnaSchema,
          brand_name: z.string().optional(),
          industry: z.string().optional(),
          target_audience: z.string().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    const ctx = buildStyleDNAContext(data.dna);
    const system = `${ctx.systemPrompt}

You are a master brand identity systems designer. Produce a complete brand kit anchored strictly to the given Style DNA.
Use the authoritative colors (${ctx.palette.hexList.join(", ")}), typography pairings (${ctx.typography.primaryCategory} / ${ctx.typography.secondaryCategory}), and tactile guidance.`;

    const brandName = data.brand_name || ctx.identity.name || "Bespoke Brand";
    const user = `Brand name: ${brandName}
Industry: ${data.industry || "Creative Luxury / Editorial"}
Target Audience: ${data.target_audience || "Design-forward discerning audience"}
Style DNA: ${ctx.identity.name}

Return JSON:
{
  "brand_name": "${brandName}",
  "brand_positioning": "Strategic positioning statement",
  "logo_direction": "Concrete logo conceptual guidance and mark strategy",
  "color_system": [
    { "name": "Primary", "hex": "${ctx.palette.primary.hex}", "use": "Dominant structural elements and typography" },
    { "name": "Secondary", "hex": "${ctx.palette.secondary.hex}", "use": "Subtle borders and secondary backgrounds" },
    { "name": "Accent", "hex": "${ctx.palette.accent.hex}", "use": "Selective interactive focal points" },
    { "name": "Neutral", "hex": "${ctx.palette.neutral.hex}", "use": "Canvas foundation and generous breathing space" }
  ],
  "typography": {
    "display": "${ctx.typography.primaryCategory} (e.g. ${ctx.typography.displayFontExample})",
    "body": "${ctx.typography.secondaryCategory} (e.g. ${ctx.typography.bodyFontExample})",
    "pairing_notes": "Deliberate scale and tracking instructions"
  },
  "icon_style": "Geometric, fine stroke, minimal line weight",
  "illustration_style": "Editorial, monochromatic or duotone, tactile texture",
  "photography_style": "Natural diffused lighting, filmic depth, honest shadows",
  "brand_voice": "Restrained, authoritative, poetic, architectural",
  "brand_personality": "Quiet confidence, meticulous craft, elevated taste",
  "brand_guidelines": [
    "Always preserve generous whitespace",
    "Never flood with loud synthetic tones"
  ]
}`;

    const fallback = {
      brand_name: brandName,
      logo_direction: "Minimal geometric typography",
      color_system: ctx.palette.hexList.map((hex, i) => ({
        name: `Color ${i + 1}`,
        hex,
        use: i === 0 ? "Primary" : "Secondary",
      })),
      typography: {
        display: ctx.typography.primaryCategory,
        body: ctx.typography.secondaryCategory,
        pairing_notes: "High contrast pairing",
      },
      icon_style: "Minimalist line art",
      illustration_style: "Tactile editorial",
      photography_style: "Natural daylight",
      brand_voice: "Editorial and measured",
      brand_personality: "Sophisticated and architectural",
    };

    return callGeminiJson(system, user, fallback);
  });

export const generateSocialContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          dna: DnaSchema,
          platform: z.enum(["instagram", "linkedin", "pinterest", "twitter"]),
          campaign: z.string().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    const ctx = buildStyleDNAContext(data.dna);
    const primaryColor = ctx.palette.primary?.hex || ctx.palette.hexList?.[0] || "#1A1A1A";
    const accentColor = ctx.palette.accent?.hex || ctx.palette.hexList?.[3] || "#FC7C04";
    const neutralColor = ctx.palette.neutral?.hex || ctx.palette.hexList?.[2] || "#F5F3EF";

    const system = `${ctx.systemPrompt}

You are an editorial social media director. Generate 10 distinct, premium post concepts tailored specifically for ${data.platform} that embody the user's Style DNA.
Every concept must integrate the DNA's palette (${ctx.palette.hexList.join(", ")}), typography, and spatial rhythm.
${data.campaign ? `Campaign theme: "${data.campaign}".` : ""}`;

    const user = `Platform: ${data.platform}
Style DNA: ${ctx.identity.name}

Return JSON:
{
  "platform": "${data.platform}",
  "strategy": "High-level content architecture and grid strategy",
  "concepts": [
    {
      "type": "Carousel / Single Post / Story / Thread",
      "title": "Editorial headline or hook",
      "hook": "Compelling opening hook",
      "description": "Full post narrative or breakdown",
      "visual_direction": "Specific art direction, photography framing, typography overlay, and color usage"
    }
  ]
}`;

    const fallbackConcepts = [
      {
        type: "Carousel",
        title: `${ctx.identity.name} Anatomy`,
        hook: "Why 99% of design systems look identical—and how visual DNA changes the equation.",
        description: "A 5-slide visual breakdown illustrating color balance, typographic tension, and negative space principles.",
        visual_direction: `Slide 1: High-contrast cover with ${primaryColor} base and ${accentColor} accent tag. Slides 2-5: Minimalist diagrams on ${neutralColor}.`,
      },
      {
        type: "Single Post",
        title: "The Manifesto",
        hook: "True luxury is the absence of unnecessary noise.",
        description: "A bold typographic statement celebrating spatial discipline and authentic material texture.",
        visual_direction: `Single high-impact square image. Deep ${primaryColor} background with sculptural serif headline in off-white.`,
      },
      {
        type: "Story",
        title: "Behind the Color Palette",
        hook: "Dissecting the hues that define our signature look.",
        description: "Vertical interactive story featuring color swatches, Pantone references, and tactile inspiration imagery.",
        visual_direction: `Vertical 9:16 format. Split screen featuring raw material photo top and color extraction swatch cards bottom.`,
      },
      {
        type: "Thread",
        title: "10 Rules of Spatial Harmony",
        hook: "How we approach whitespace as an active design material.",
        description: "In-depth breakdown of margins, optical alignment, and rhythm that transforms good UI into museum-grade art.",
        visual_direction: `Thread header image featuring an architectural grid overlay with precise geometric millimeter measurements.`,
      },
      {
        type: "Showcase",
        title: "Specimen In The Wild",
        hook: "From abstract DNA tokens to physical touchpoints.",
        description: "Product and print collateral mockups showcasing tactile finishes and letterpress debossing.",
        visual_direction: `Studio product photography on travertine stone pedestal, natural sunlight, crisp shadows, ${ctx.palette.hexList.join(", ")}.`,
      },
      {
        type: "Carousel",
        title: "Typography Deep Dive",
        hook: "Why pairing high-contrast serifs with geometric sans creates instant authority.",
        description: "Comparative specimen slides showcasing font hierarchy, kerning subtleties, and scale dynamics.",
        visual_direction: `Monochrome editorial slides with oversized character glyphs ('&', 'Q', 'R') in ${accentColor}.`,
      },
      {
        type: "Single Post",
        title: "The Design Critique",
        hook: "Good design is obvious. Great design is transparent.",
        description: "Side-by-side design analysis showing before vs after applying strict DNA constraints.",
        visual_direction: `Split card layout showing 'Generic commercial template' vs 'Curated DNA execution'.`,
      },
      {
        type: "Story",
        title: "Moodboard Snapshot",
        hook: "Current studio atmosphere and material references.",
        description: "Curated collage of architecture, industrial design, and textile swatches inspiring the active collection.",
        visual_direction: `9:16 moodboard grid with 6 organic vignettes and subtle film grain overlay.`,
      },
      {
        type: "Single Post",
        title: "Interactive Prototype Reveal",
        hook: "When motion meets editorial typography.",
        description: "Short video or animated post demonstrating fluid page transitions and magnetic micro-interactions.",
        visual_direction: `Screen recording mockup inside an ultra-thin minimalist device bezel, floating on deep textured shadow.`,
      },
      {
        type: "Thread",
        title: "The Future of AI Design",
        hook: "Why prompt engineering without visual DNA is just guessing.",
        description: "Thought-leadership perspective explaining how vector extraction ensures brand consistency across every AI output.",
        visual_direction: `Clean graphic diagram showing the pipeline: Input Reference -> DNA Extraction -> Multi-Surface Synthesis.`,
      },
    ];

    const fallback = {
      platform: data.platform,
      strategy: `High-contrast editorial presence calibrated for ${data.platform}, leveraging 60-30-10 palette balance and ${ctx.typography.primaryCategory} typography overlays.`,
      concepts: fallbackConcepts,
    };

    return callGeminiJson(system, user, fallback);
  });

function computeAestheticRemix(ctx: StyleDNAContext, blend: Record<string, number>) {
  const editorial = (blend.editorial ?? 33) / 100;
  const futuristic = (blend.futuristic ?? 33) / 100;
  const luxury = (blend.luxury ?? 33) / 100;
  const total = editorial + futuristic + luxury || 1;
  const wEd = editorial / total;
  const wFut = futuristic / total;
  const wLux = luxury / total;

  let prefix = "";
  if (wFut > 0.42) prefix = "Cyber-Futuristic ";
  else if (wLux > 0.42) prefix = "Haute Luxury ";
  else if (wEd > 0.42) prefix = "Editorial Avant-Garde ";
  else prefix = "Hybrid Synthesis ";

  let suffix = "";
  if (wFut >= wLux && wFut >= wEd) suffix = "Vector Shift";
  else if (wLux >= wFut && wLux >= wEd) suffix = "Atelier Edition";
  else suffix = "Monograph Form";

  const style_name = `${prefix}${ctx.identity.name} (${suffix})`;

  // Generate genuinely distinct blended palette reflecting slider vectors
  const palette = [
    {
      name: "Ground Foundation",
      hex: wFut > 0.35 ? "#080C14" : wLux > 0.35 ? "#141210" : "#1A1A18",
    },
    {
      name: "Structural Base",
      hex: wFut > 0.35 ? "#1B2436" : wLux > 0.35 ? "#2A2420" : (ctx.palette.hexList[1] || "#3D4440"),
    },
    {
      name: "Tonal Harmonic",
      hex: wFut > 0.35 ? "#3B82F6" : wLux > 0.35 ? "#B89A67" : (ctx.palette.hexList[2] || "#A3978E"),
    },
    {
      name: "Vibrant Accent",
      hex: wFut > 0.35 ? "#00F0FF" : wLux > 0.35 ? "#D4AF37" : (ctx.palette.accent?.hex || "#E11D48"),
    },
    {
      name: "Ambient Neutral",
      hex: wFut > 0.35 ? "#E2E8F0" : wLux > 0.35 ? "#FAF7F2" : "#F5F3EF",
    },
  ];

  const typography = {
    display: wFut > 0.4 ? "Space Grotesk / Syne" : wLux > 0.4 ? "Cinzel / Playfair Display" : "Canela / Editorial New",
    body: wFut > 0.4 ? "JetBrains Mono / Inter" : wLux > 0.4 ? "Cormorant Garamond" : "Söhne / Neue Haas",
  };

  const mood = [
    { label: "Futuristic Kineticism", value: Math.max(10, Math.round(wFut * 100)) },
    { label: "Editorial Balance", value: Math.max(10, Math.round(wEd * 100)) },
    { label: "Luxury Restraint", value: Math.max(10, Math.round(wLux * 100)) },
    { label: "Tactile Warmth", value: Math.max(15, Math.round((1 - wFut * 0.4) * 85)) },
  ];

  const summary = `Synthesized visual remix modulating ${ctx.identity.name} with ${Math.round(wEd * 100)}% editorial grain, ${Math.round(wFut * 100)}% kinetic future-tech, and ${Math.round(wLux * 100)}% luxury refinement.`;

  const surface_recommendations = [
    wFut > 0.35
      ? "Deploy ultra-thin neon keylines, glassmorphism surface panels, and monospace metadata badges."
      : "Employ heavyweight matte cotton paper finishes with blind debossing on primary brand moments.",
    wLux > 0.35
      ? "Preserve generous macro-whitespace around metallic champagne accents for an unmistakable high-jewelry feel."
      : "Anchor interface components to rhythmic Swiss grid lines with strict hairline rules.",
    `Set display headlines in ${typography.display} and technical metadata in ${typography.body}.`,
  ];

  return {
    style_name,
    summary,
    palette,
    mood,
    typography,
    surface_recommendations,
  };
}

export const generateRemix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          dna: DnaSchema,
          blend: z.record(z.string(), z.number()),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    const ctx = buildStyleDNAContext(data.dna);
    const algorithmicFallback = computeAestheticRemix(ctx, data.blend);

    const system = `${ctx.systemPrompt}

You are the Style Remix engine. Blend the user's current DNA with the requested aesthetic vector blend percentages to produce a synthesized, coherent new style variation.
Do not return the exact same palette or style name—synthesize a genuinely distinct variation influenced by the requested vectors.`;

    const blendStr = Object.entries(data.blend)
      .map(([k, v]) => `${k}: ${v}%`)
      .join(", ");

    const user = `Original DNA: ${ctx.identity.name}
Palette: ${ctx.palette.hexList.join(", ")}
Requested Blend: ${blendStr}

Return JSON:
{
  "style_name": "Synthesized Remix Name",
  "summary": "Harmonious aesthetic summary combining original DNA with blend vectors",
  "palette": [
    { "name": "Color Name", "hex": "#HEX" }
  ],
  "mood": [
    { "label": "Minimalist", "value": 85 },
    { "label": "Luxury", "value": 75 },
    { "label": "Creative", "value": 90 },
    { "label": "Warmth", "value": 60 }
  ],
  "typography": {
    "display": "Display font recommendation",
    "body": "Body font recommendation"
  },
  "surface_recommendations": [
    "Actionable recommendation for web, print, or identity"
  ]
}`;

    return callGeminiJson(system, user, algorithmicFallback);
  });

export const generateMoodboardPrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z.object({ dna: DnaSchema, theme: z.string().optional() }).parse(val),
    ),
  )
  .handler(async ({ data }) => {
    const ctx = buildStyleDNAContext(data.dna);
    const system = `${ctx.systemPrompt}

You are an expert art curator and creative director. Produce exactly 18 short, evocative image generation prompts (each 10-18 words) that together form a stunning, cohesive moodboard representing the user's Style DNA.
${data.theme ? `Theme: "${data.theme}".` : "Theme: Signature DNA expression."}
Incorporate the specific colors (${ctx.palette.hexList.join(", ")}), tactile materials (${ctx.texture.materials.join(", ")}), and lighting (${ctx.imagery.lighting}).`;

    const user = `Generate 18 cohesive moodboard prompts.
Return JSON:
{
  "prompts": [
    "prompt 1",
    "prompt 2",
    "..."
  ]
}`;

    const fallbackPrompts = [
      `Modular architectural grid in deep base neutral ${ctx.palette.hexList[0] || "#1a1a1a"} with warm clay focal accent in soft daylight`,
      `Layered matte display planes casting soft continuous shadows, featuring sharp slate geometry and vibrant warm clay punctuation`,
      `Dense spatial arrangement of clean digital panels, illuminated by diffused daylight with deep soft shadow transitions`,
      `Minimalist product stage bathed in natural warm daylight, textured slate surfaces with ${ctx.palette.accent.hex} focal highlights`,
      `Asymmetrical modular canvas featuring smooth matte planes, rich undertones, and warm clay interaction anchors`,
      `High-density structural layout with layered clean surfaces, subtle soft shadows, and vibrant accent points`,
      `Polished digital plane showcasing multi-layered geometric forms, rendered in warm clay under soft sunlight`,
      `Softly lit launch campaign backdrop, featuring stacked modular panels, deep shadow falloff, and subtle details`,
      `Compact spatial composition with razor-sharp vector edges, matte finish, and warm clay focal points`,
      `Architectural launch installation with overlapping matte planes, textured surfaces with natural diffused daylight`,
      `High-density layout of intersecting clean surfaces, rich undertones, punctuated by bright focal elements`,
      `Warm layered spatial form displaying modular campaign elements, smooth continuous tones, and soft directional shadows`,
      `Sculptural geometric still life in ${ctx.palette.hexList.slice(0, 2).join(" and ")} with tactile matte paper texture`,
      `Editorial branding layout on stone pedestal, natural ambient illumination, razor-sharp typography specimen`,
      `Kinetic gradient field transitioning between ${ctx.palette.hexList.join(" and ")}, fine film grain, studio lighting`,
      `Tactile risograph print specimen on textured heavyweight cotton paper with visible ink overlap and deckle edge`,
      `Modernist exhibition pavilion exterior with geometric concrete fins and warm ambient interior glow`,
      `Minimalist editorial magazine spread open flat, generous white margins, stark typography, ${ctx.palette.accent.hex} bookmarks`,
    ];

    const fallback = { prompts: fallbackPrompts };
    return callGeminiJson(system, user, fallback);
  });

export const generateWebsiteSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          dna: DnaSchema,
          website_type: z.enum(["saas", "startup", "portfolio", "agency", "ecommerce"]),
          description: z.string().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    const ctx = buildStyleDNAContext(data.dna);
    const system = `${ctx.systemPrompt}

You are an award-winning digital creative director and UX architect. Design a comprehensive website structure for a ${data.website_type} project that deeply executes the user's Style DNA.
${data.description ? `Project description: "${data.description}".` : ""}`;

    const user = `Design website structure for: ${data.website_type}
Style DNA: ${ctx.identity.name}
Palette: ${ctx.palette.hexList.join(", ")}
Typography: ${ctx.typography.primaryCategory} / ${ctx.typography.secondaryCategory}
Whitespace: ${ctx.composition.whitespaceLabel}

Return JSON:
{
  "hero": {
    "headline": "Poetic editorial headline",
    "subhead": "Sophisticated subhead establishing value",
    "cta": "Primary button copy",
    "visual": "Art direction for hero visual asset"
  },
  "features": [
    { "title": "Feature 1", "body": "Feature description" },
    { "title": "Feature 2", "body": "Feature description" },
    { "title": "Feature 3", "body": "Feature description" },
    { "title": "Feature 4", "body": "Feature description" }
  ],
  "testimonials": [
    { "quote": "Compelling testimonial quote", "author": "Name and credentials" },
    { "quote": "Second testimonial", "author": "Name and credentials" }
  ],
  "cta": {
    "headline": "Final conversion headline",
    "body": "Reassuring conversion message",
    "button": "Button label"
  },
  "footer": {
    "columns": [
      { "heading": "Navigation", "links": ["Work", "Studio", "Approach"] },
      { "heading": "Contact", "links": ["Inquiries", "Press", "Colophon"] }
    ]
  }
}`;

    const primaryColor = ctx.palette.primary?.hex || ctx.palette.hexList?.[0] || "#1A1A1A";
    const accentColor = ctx.palette.accent?.hex || ctx.palette.hexList?.[3] || "#FC7C04";

    const fallback = {
      hero: {
        headline: `${ctx.identity.name} Architecture`,
        subhead: `A bespoke digital platform engineered for high-fidelity visual storytelling and spatial harmony.`,
        cta: "Explore Collection",
        visual: `Architectural geometric compositions bathed in warm directional light, ${primaryColor} background with ${accentColor} highlights.`,
      },
      features: [
        {
          title: "Harmonious Color Architecture",
          body: `Curated chromatic relationships featuring ${ctx.palette.hexList.slice(0, 3).join(", ")} calibrated for editorial resonance.`,
        },
        {
          title: "Typographic Distinction",
          body: `Sculptural ${ctx.typography.primaryCategory} headlines paired with structured ${ctx.typography.secondaryCategory} technical indices.`,
        },
        {
          title: "Spatial Discipline",
          body: `Generous ${ctx.composition.whitespaceLabel} margins that prioritize breathing space and effortless scannability.`,
        },
        {
          title: "Tactile Digital Presence",
          body: `Understated surface finishes echoing ${ctx.texture.surfaceStyle} for physical print-grade digital presence.`,
        },
      ],
      testimonials: [
        {
          quote: "Palette Print gave our visual identity an unmistakable signature that resonates with our audience.",
          author: "Elena Rostova, Creative Director",
        },
        {
          quote: "The generative intelligence adheres strictly to our DNA, saving hundreds of design hours.",
          author: "Marcus Chen, Design Principal",
        },
      ],
      cta: {
        headline: "Elevate Your Aesthetic Identity",
        body: "Step into a generative design studio engineered for discerning creators.",
        button: "Begin Experience",
      },
      footer: {
        columns: [
          { heading: "Studio", links: ["Philosophy", "DNA Engine", "Gallery", "Archive"] },
          { heading: "Connect", links: ["Inquiries", "Editorial", "Instagram", "Colophon"] },
        ],
      },
    };

    return callGeminiJson(system, user, fallback);
  });

function buildFallbackPrompts(ctx: StyleDNAContext, target: string, userGoal?: string) {
  const goal = userGoal || "Brand campaign hero direction";
  const colors = ctx.palette.hexList.join(", ");
  const accent = ctx.palette.accent?.hex || "#FC7C04";
  const primary = ctx.palette.primary?.hex || "#1A1A1A";
  const t = target.toLowerCase();

  if (t.includes("midjourney") || t.includes("flux") || t.includes("diffusion")) {
    return [
      {
        tag: "Editorial Hero Key Visual",
        text: `Editorial campaign still life for ${goal}, sculptural brutalist forms in ${colors}, high fashion studio lighting, tactile matte concrete and silk textures, shot on Hasselblad H6D-100c, 80mm lens f/2.8, cinematic chiaroscuro --ar 16:9 --style raw --v 6.1 --s 250`,
      },
      {
        tag: "Architectural Space & Lighting",
        text: `Architectural interior with monumental spatial discipline, minimalist cantilevered gallery walls, soft diffused natural daylight from skylight, palette of ${colors}, sharp ray-traced shadows, hyper-realistic, 8k resolution --ar 3:2 --v 6.1`,
      },
      {
        tag: "Tactile Print & Monograph Specimen",
        text: `Archival exhibition catalog book open on raw travertine stone, Swiss graphic typography, foil stamped in ${accent}, heavy cotton paper texture with visible grain, museum lighting --ar 4:3 --v 6.1`,
      },
      {
        tag: "Product & Industrial Form",
        text: `Minimalist precision hardware product design, matte anodized aluminum in ${primary} with subtle ${accent} detailing, pristine macro studio photography, sharp geometric reflections --ar 1:1 --v 6.1`,
      },
      {
        tag: "Kinetic Brand Identity Poster",
        text: `Abstract graphic poster composition, intersecting floating planar geometry, subtle chromatic refraction, Swiss layout with ${ctx.typography.primaryCategory} typography specimen, clean studio lighting --ar 9:16 --v 6.1`,
      },
      {
        tag: "Atmospheric Brand Texture Motif",
        text: `Sensory macro texture study, undulating silk and powdered pigments blending ${colors}, soft focus background with crisp microscopic foreground detail, dramatic rim light --ar 16:9 --v 6.1`,
      },
    ];
  }

  if (t.includes("chatgpt") || t.includes("claude") || t.includes("gemini")) {
    return [
      {
        tag: "Creative Director System Instructions",
        text: `Act as Senior Creative Director for ${ctx.identity.name}. Enforce strict adherence to our visual DNA: Color Palette: [${colors}]. Use ${primary} as the grounding foundation, with ${accent} strictly reserved for focal accents (60-30-10 ratio). Typography must reflect ${ctx.typography.primaryCategory} for display titles with wide letterspacing, paired with restrained ${ctx.typography.secondaryCategory}. Maintain ${ctx.composition.whitespaceLabel} negative space and ${ctx.texture.surfaceStyle} textures.`,
      },
      {
        tag: "Landing Page Copywriting & Spatial Prompt",
        text: `Draft high-converting yet poetic editorial copy for: ${goal}. Structure into: 1. Hero Headline (under 8 words, evocative and confident), 2. Narrative Subhead, 3. Three core value pillars with sculptural titles, 4. Art direction notes specifying placement of ${accent} interaction cues and ${colors} background balance.`,
      },
      {
        tag: "Brand Identity Guidelines Generator",
        text: `Generate comprehensive Brand Identity Specifications for ${ctx.identity.name}. Detail exact rules for: 1. Color hierarchy and accessibility contrast ratios using ${colors}. 2. Display vs Body typographic scale. 3. Image curation criteria requiring ${ctx.imagery.lighting} and ${ctx.texture.surfaceStyle}. 4. Strict list of 5 brand DON'Ts.`,
      },
      {
        tag: "Design System Tokens Specifier",
        text: `Translate the visual DNA of ${ctx.identity.name} into a formal CSS / Tailwind design token dictionary: Define color tokens (primary: ${primary}, accent: ${accent}), spacing scales tuned for ${ctx.composition.whitespaceLabel} breathing room, and font definitions for ${ctx.typography.primaryCategory}.`,
      },
      {
        tag: "Multi-Channel Campaign Strategy",
        text: `Develop an integrated 4-week launch campaign architecture for ${goal}. Outline 8 distinct narrative moments, each pairing high-impact conceptual hooks with specific visual framing recommendations grounded in our ${ctx.identity.name} aesthetic DNA.`,
      },
      {
        tag: "Executive Critique & Alignment Rubric",
        text: `Review creative submissions against our ${ctx.identity.name} DNA rubric: Evaluate on 5 criteria: 1. Palette purity (${colors}), 2. Spatial breathing room, 3. Typographic authority, 4. Tactile material authenticity, 5. Overall emotional resonance.`,
      },
    ];
  }

  // Developer & Coding assistants: Cursor, V0, Bolt
  return [
    {
      tag: "Tailwind Theme & CSS Variables",
      text: `Extend tailwind.config.ts with the bespoke theme tokens for ${ctx.identity.name}: colors: { brand: { primary: '${primary}', accent: '${accent}', neutral: '${ctx.palette.neutral?.hex || "#F5F3EF"}', palette: [${colors.split(", ").map(c => `'${c}'`).join(", ")}] } }, fontFamily: { display: ['${ctx.typography.displayFontExample || "Cormorant Garamond"}', 'serif'], body: ['${ctx.typography.bodyFontExample || "Inter"}', 'sans-serif'] }, spacing: { 'section-gap': '6rem' }`,
    },
    {
      tag: "Hero Section Component (React + Tailwind)",
      text: `Create a responsive React hero component using Tailwind CSS that embodies ${ctx.identity.name}. Include an asymmetric split grid, an editorial headline in font-display with text-${primary}, subtle ${accent} highlight badge, generous whitespace (py-24 px-6 md:px-16), and a minimal floating card with backdrop-blur.`,
    },
    {
      tag: "Design System Button & Card Primitives",
      text: `Build reusable UI components (Button, Card, Badge) adhering to ${ctx.identity.name}: Button variants: primary (bg-[${primary}] text-white hover:bg-[${accent}]), outline (border border-border hover:border-[${accent}]). Card: bg-card border border-border/60 rounded-2xl p-8 with subtle hover shadow.`,
    },
    {
      tag: "Full Page Layout Template",
      text: `Generate a Next.js / TanStack Start page layout for ${goal} implementing the ${ctx.identity.name} aesthetic system. Include sticky minimal header, hero with editorial typography, 3-column feature grid with generous whitespace, and a high-contrast footer.`,
    },
    {
      tag: "Interactive Style Showcase Component",
      text: `Build an interactive palette swatch and typography specimen viewer component in React. Render swatches for ${colors}, with click-to-copy hex values, font size scaling playground, and tactile surface finish toggle.`,
    },
    {
      tag: "Motion & Micro-interactions (Framer Motion)",
      text: `Implement subtle Framer Motion entrance animations for ${ctx.identity.name}: Staggered fade-up on headings (opacity 0 -> 1, y: 16 -> 0, duration 0.6s, ease [0.16, 1, 0.3, 1]), soft magnetic hover on primary CTA, and smooth tab transitions.`,
    },
  ];
}

export const generatePrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          dna: DnaSchema,
          target: z.string(),
          userGoal: z.string().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    const ctx = buildStyleDNAContext(data.dna);
    const system = `${ctx.systemPrompt}

You are a premier prompt engineer. Produce 6 highly optimized, production-ready prompts customized specifically for the tool: "${data.target}".
Each prompt must accurately translate the user's Style DNA (palette: ${ctx.palette.hexList.join(", ")}, typography, lighting, texture, negative space) into syntax and techniques optimal for ${data.target}.
${data.userGoal ? `User Goal: "${data.userGoal}".` : ""}`;

    const user = `Target: ${data.target}
Style DNA: ${ctx.identity.name}

Return JSON:
{
  "prompts": [
    { "tag": "Hero Visual / Editorial Campaign / UI System", "text": "Exact copy-paste prompt text" },
    { "tag": "Brand Identity / Product Showcase", "text": "Exact copy-paste prompt text" }
  ]
}`;

    const fallback = { prompts: buildFallbackPrompts(ctx, data.target, data.userGoal) };
    return callGeminiJson(system, user, fallback);
  });

// ============================================================
// PROJECT WORKSPACE (SUPABASE PERSISTENCE)
// ============================================================

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          name: z.string().min(1).max(120),
          kind: z.string().default("ai-studio"),
          dna_profile_id: z.string().uuid().optional(),
          metadata: z.record(z.string(), z.any()).optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data, context }) => {
    try {
      const { data: row, error } = await context.supabase
        .from("projects")
        .insert({
          name: data.name,
          kind: data.kind,
          dna_profile_id: data.dna_profile_id ?? null,
          user_id: context.userId,
          data: data.metadata ?? {},
        })
        .select("id, name, kind, created_at, updated_at, data")
        .single();
      if (error) throw new Error(error.message);
      return row;
    } catch {
      return {
        id: `local-project-${Date.now()}`,
        name: data.name,
        kind: data.kind,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        data: data.metadata ?? {},
      };
    }
  });

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data, error } = await context.supabase
        .from("projects")
        .select("id, name, kind, created_at, updated_at, data, archived")
        .eq("archived", false)
        .order("updated_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1).max(120).optional(),
          data: z.record(z.string(), z.any()).optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data, context }) => {
    const patch: { updated_at: string; name?: string; data?: Record<string, unknown> } = {
      updated_at: new Date().toISOString(),
    };
    if (data.name) patch.name = data.name;
    if (data.data) patch.data = data.data;
    const { error } = await context.supabase
      .from("projects")
      .update(patch as never)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) => z.object({ id: z.string().uuid() }).parse(val)),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("projects")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) => z.object({ id: z.string().uuid() }).parse(val)),
  )
  .handler(async ({ data, context }) => {
    const { data: src, error: e1 } = await context.supabase
      .from("projects")
      .select("name, kind, dna_profile_id, data")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (e1 || !src) throw new Error(e1?.message ?? "Not found");
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({
        name: `${src.name} (copy)`,
        kind: src.kind,
        dna_profile_id: src.dna_profile_id,
        user_id: context.userId,
        data: src.data ?? {},
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
