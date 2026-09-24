import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildStyleDNAContext, type StyleDNAContext } from "./context";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface DesignTwinRecommendation {
  creativeDirection: string;
  visualLanguage: string;
  typography: string;
  color: string;
  composition: string;
  imagery: string;
  whatToAvoid: string[];
  reasoning: string;
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
 * Handles conversational queries with full Style DNA system prompt context and multi-turn history.
 */
export async function chatWithStyleDNA(
  messages: ChatMessage[],
  dna: unknown,
  projectContext?: string,
): Promise<string> {
  const ctx = buildStyleDNAContext(dna);
  const latestMessage = messages[messages.length - 1]?.content || "";

  if (GEMINI_KEY && GEMINI_KEY.length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: `${ctx.systemPrompt}

You are the user's personal AI Creative Director.
Maintain an authoritative, editorial, and constructive tone.
Answer all creative questions, design requests, and refinement commands using this specific Style DNA.
Preserve context across the conversation.`,
      });

      // Gemini history requirement:
      // 1. Must start with role: 'user'
      // 2. Roles must alternate
      const priorMessages = messages
        .slice(0, -1)
        .filter((m) => m.content && m.content.trim().length > 0);
      const firstUserIdx = priorMessages.findIndex((m) => m.role === "user");
      const validPrior = firstUserIdx >= 0 ? priorMessages.slice(firstUserIdx) : [];

      const history: { role: "user" | "model"; parts: { text: string }[] }[] = [];
      for (const m of validPrior) {
        const role = m.role === "assistant" ? "model" : "user";
        if (history.length > 0 && history[history.length - 1].role === role) {
          history[history.length - 1].parts[0].text += `\n\n${m.content}`;
        } else {
          history.push({
            role,
            parts: [{ text: m.content }],
          });
        }
      }

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(latestMessage);
      const reply = result.response.text();
      if (reply && reply.trim().length > 0) {
        return reply.trim();
      }
    } catch (err) {
      console.warn("[Chat] Gemini chat fell back to DNA conversational director:", err);
    }
  }

  // Resilient Parametric Conversational Director
  return synthesizeConversationalReply(messages, ctx, projectContext);
}

/**
 * Design Twin: Solves a specific creative problem or brief from the perspective
 * of the user's aesthetic taste.
 */
export async function askDesignTwin(
  request: string,
  dna: unknown,
  projectContext?: string,
): Promise<DesignTwinRecommendation> {
  const ctx = buildStyleDNAContext(dna);

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

USER CREATIVE BRIEF / REQUEST:
"${request}"
Project Context: ${projectContext || "High-end design showcase"}

TASK:
As the user's Design Twin AI Creative Director, provide a comprehensive, DNA-aligned creative recommendation.
Return ONLY valid JSON matching this schema:
{
  "creativeDirection": "What should be created and its core conceptual angle",
  "visualLanguage": "How it looks, materials, atmosphere, and surface finish",
  "typography": "Explicit type choices, pairings, and scale contrast",
  "color": "How the user's actual palette (${ctx.palette.hexList.join(", ")}) is applied",
  "composition": "Layout structure, whitespace, and visual hierarchy",
  "imagery": "Photography, subjects, lighting, and textures",
  "whatToAvoid": ["3 specific things to avoid according to DNA rules"],
  "reasoning": "Concise 1-2 sentence explanation of why this aligns with the user's Style DNA"
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      if (parsed?.creativeDirection && parsed?.visualLanguage) {
        return {
          creativeDirection: parsed.creativeDirection,
          visualLanguage: parsed.visualLanguage,
          typography: parsed.typography,
          color: parsed.color,
          composition: parsed.composition,
          imagery: parsed.imagery,
          whatToAvoid: Array.isArray(parsed.whatToAvoid)
            ? parsed.whatToAvoid
            : ctx.dontList.slice(0, 3),
          reasoning: parsed.reasoning || `Rooted in your ${ctx.identity.name} aesthetic balance.`,
        };
      }
    } catch (err) {
      console.warn("[Design Twin] Gemini fallback to parametric director:", err);
    }
  }

  // Parametric Design Twin Synthesis
  const p = ctx.palette;
  const t = ctx.typography;
  const c = ctx.composition;
  const tex = ctx.texture;
  const name = ctx.identity.name;

  return {
    creativeDirection: `Develop an authoritative ${request} grounded in your ${name} visual signature. Lead with a quiet, conceptual posture rather than commercial hyperbole.`,
    visualLanguage: `${tex.surfaceStyle} tactile finish with ${p.temperatureLabel} tonality and disciplined hairline dividers.`,
    typography: `Command the viewport with ${t.primaryCategory} display headlines paired with ${t.secondaryCategory} body text. Maintain ${t.spacingPreference}.`,
    color: `Base the entire structure on ${p.neutral.hex}, balance with ${p.primary.hex} for typography and structure, reserving ${p.accent.hex} strictly for high-impact interactive anchors.`,
    composition: `${c.layoutStyle} featuring ${c.whitespaceLabel} (${(c.whitespace * 100).toFixed(0)}% negative space) and ${c.alignment} alignment.`,
    imagery: `Curated still-life and architectural forms with ${tex.surfaceStyle} finish, bathed in ${ctx.imagery.lighting}.`,
    whatToAvoid: ctx.dontList.slice(0, 3),
    reasoning: `Directly aligns with your ${name} signature: leverages your ${t.primaryCategory} typography hierarchy, honors your ${c.whitespaceLabel}, and enforces your strict 4-color palette discipline.`,
  };
}

/**
 * Synthesizes a contextual, intelligent conversational reply derived from the user's
 * exact DNA parameters, the history of the conversation, and creative intent detection.
 */
function synthesizeConversationalReply(
  messages: ChatMessage[],
  ctx: StyleDNAContext,
  projectContext?: string,
): string {
  const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || "";
  const prevMsg = messages.length > 2 ? messages[messages.length - 3]?.content.toLowerCase() : "";

  const name = ctx.identity.name;
  const p = ctx.palette;
  const t = ctx.typography;
  const c = ctx.composition;
  const tex = ctx.texture;

  // Command 1: "Make it more minimal / clean"
  if (lastMsg.includes("minimal") || lastMsg.includes("clean") || lastMsg.includes("less")) {
    return `To strip this back to your most essential ${name} core:
1. **Negative Space**: Expand whitespace to ${Math.min(92, Math.round(c.whitespace * 100 + 15))}% of the viewport. Let the margins act as physical frames.
2. **Color Discipline**: Remove all mid-tones. Restrict the canvas solely to ${p.neutral.hex} and ${p.primary.hex}, reserving ${p.accent.hex} for a single focal micro-detail.
3. **Typography**: Rely strictly on a single scale of ${t.primaryCategory} with generous leading. No decorative ornaments or secondary badges.`;
  }

  // Command 2: "Make it more experimental / radical"
  if (lastMsg.includes("experimental") || lastMsg.includes("bold") || lastMsg.includes("radical")) {
    return `Pushing the boundaries of your ${name} signature while respecting its DNA:
1. **Asymmetric Ruptures**: Break the ${c.layoutStyle} by overlapping large-scale ${t.primaryCategory} glyphs across margin boundaries.
2. **Inverted Tonal Tension**: Flip the primary plane to a deep ${p.primary.hex} background, illuminating key focal text with high-contrast ${p.accent.hex}.
3. **Tactile Distortion**: Introduce raw, oversized ${tex.materials[0] || "tactile"} textures with intentional crop tension.`;
  }

  // Command 3: "Alternatives / Options"
  if (
    lastMsg.includes("alternative") ||
    lastMsg.includes("options") ||
    lastMsg.includes("variant")
  ) {
    return `Here are 3 distinct directions derived from your ${name} DNA:

• **Direction A (The Monograph)**: Single-column editorial spine, ${(c.whitespace * 100).toFixed(0)}% whitespace, anchored by ${t.primaryCategory} quotes.
• **Direction B (The Curator Grid)**: Staggered asymmetric cells with hairline borders in ${p.secondary.hex} and subtle tactile grain.
• **Direction C (The Tonal Monolith)**: High-contrast inverted canvas in ${p.primary.hex} with sharp ${p.accent.hex} typographic points.`;
  }

  // Command 4: "Critique / Review"
  if (lastMsg.includes("critique") || lastMsg.includes("review") || lastMsg.includes("grade")) {
    return `Critiquing through the lens of your ${name} Style DNA:
• **Strengths to Enforce**: Your signature thrives on ${c.whitespaceLabel} and ${p.temperatureLabel} warmth. Ensure you never compress vertical gutters.
• **Vulnerabilities to Watch**: Avoid generic rounded buttons or standard UI card dropshadows—your aesthetic demands ${tex.surfaceStyle} sharpness and deliberate ${t.primaryCategory} hierarchy.
• **Focal Polish**: Ensure ${p.accent.hex} is used only once per primary view.`;
  }

  // Command 5: "Website / Landing page"
  if (lastMsg.includes("website") || lastMsg.includes("landing") || lastMsg.includes("page")) {
    return `For a website tuned to your ${name} DNA:
- **Hero Viewport**: Left-anchored asymmetric headline set in ${t.primaryCategory}, breathing within ${c.whitespaceLabel}.
- **Palette Balance**: ${p.neutral.hex} base canvas, ${p.primary.hex} ink for text, and ${p.accent.hex} for the primary action button.
- **Micro-Interaction**: Soft, physical momentum scrolling with subtle fade reveals reflecting your ${ctx.rhythm.type} rhythm.`;
  }

  // Command 6: "Brand / Identity"
  if (lastMsg.includes("brand") || lastMsg.includes("identity") || lastMsg.includes("logo")) {
    return `For your brand identity system:
- **Primary Mark**: High-contrast wordmark in ${t.primaryCategory} with bespoke letter-spacing.
- **Physical Materials**: Specify ${tex.materials.join(" and ")} with ${tex.surfaceStyle} tactile debossing.
- **Voice & Tone**: Speaks with ${ctx.typography.personality} clarity—restrained, declarative, and curatorial.`;
  }

  // Contextual Follow-up (modifying previous creative direction)
  if (prevMsg) {
    return `Building upon your previous direction with your ${name} aesthetic:
By prioritizing ${c.whitespaceLabel} and anchoring with ${t.primaryCategory}, we ensure that "${lastMsg}" maintains authentic harmony with your ${p.temperatureLabel} palette (${p.primary.hex} & ${p.accent.hex}).`;
  }

  // General Creative Director Consultation
  return `Working directly from your ${name} visual signature:
Your visual DNA is defined by ${p.temperatureLabel} tonality (${p.hexList.slice(0, 3).join(", ")}), ${c.whitespaceLabel}, and ${t.primaryCategory} typographic authority.

How would you like to apply this? I can generate a website layout, draft an image prompt, architect brand guidelines, or critique an upcoming project.`;
}
