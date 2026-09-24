import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createEditorialArtworkSvg(prompt: string, dna?: any, index?: number): string {
  const paletteList: string[] =
    Array.isArray(dna?.palette?.hexList) && dna.palette.hexList.length > 0
      ? dna.palette.hexList
      : Array.isArray(dna?.palette)
        ? dna.palette
            .map((c: any) => (typeof c === "string" ? c : c?.hex))
            .filter(Boolean)
        : ["#04544c", "#fc7c04", "#a89284", "#1a1a1a", "#eae6df"];

  const seed = (typeof index === "number" ? index : hashString(prompt)) % 8;
  const numIndex =
    typeof index === "number"
      ? String(index + 1).padStart(2, "0")
      : String((seed % 18) + 1).padStart(2, "0");

  const c1 = paletteList[seed % paletteList.length] || "#1A1A1A";
  const c2 = paletteList[(seed + 1) % paletteList.length] || "#2D2B28";
  const c3 = paletteList[(seed + 2) % paletteList.length] || "#04544C";
  const c4 = paletteList[(seed + 3) % paletteList.length] || "#FC7C04";
  const c5 = paletteList[(seed + 4) % paletteList.length] || "#EAE6DF";

  const safeText = prompt.replace(/[<>&"]/g, "").slice(0, 52);
  const words = safeText.split(" ");
  const line1 = words.slice(0, 4).join(" ");
  const line2 = words.slice(4).join(" ");

  switch (seed) {
    case 0:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <linearGradient id="g0" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}"/><stop offset="60%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/>
          </linearGradient>
          <linearGradient id="accent0" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${c4}"/><stop offset="100%" stop-color="${c5}"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#g0)"/>
        <polygon points="120,200 680,120 900,480 340,560" fill="${c2}" opacity="0.45"/>
        <polygon points="200,420 760,340 860,780 300,860" fill="${c3}" opacity="0.35"/>
        <rect x="520" y="240" width="340" height="420" rx="16" fill="${c4}" opacity="0.22"/>
        <line x1="120" y1="120" x2="120" y2="904" stroke="${c5}" stroke-width="1.5" opacity="0.3"/>
        <line x1="120" y1="780" x2="904" y2="780" stroke="${c5}" stroke-width="1.5" opacity="0.3"/>
        <text x="160" y="170" fill="${c5}" font-family="system-ui, sans-serif" font-weight="700" font-size="28" letter-spacing="4" opacity="0.6">NO. ${numIndex} · ARCHITECTURAL</text>
        <text x="160" y="730" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="38">${line1}</text>
        <text x="160" y="770" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="34" opacity="0.85">${line2}</text>
        <text x="160" y="830" fill="${c4}" font-family="monospace" font-size="14" letter-spacing="2">PALETTE: ${c1} / ${c4}</text>
        <circle cx="870" cy="830" r="16" fill="url(#accent0)"/>
      </svg>`;

    case 1:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <radialGradient id="r1" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stop-color="${c4}" stop-opacity="0.9"/>
            <stop offset="35%" stop-color="${c3}" stop-opacity="0.5"/>
            <stop offset="70%" stop-color="${c2}"/>
            <stop offset="100%" stop-color="${c1}"/>
          </radialGradient>
          <radialGradient id="glow1" cx="50%" cy="45%" r="40%">
            <stop offset="0%" stop-color="${c5}" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="${c4}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="${c1}"/>
        <rect width="1024" height="1024" fill="url(#r1)"/>
        <circle cx="512" cy="460" r="280" fill="none" stroke="${c5}" stroke-width="2" opacity="0.25"/>
        <circle cx="512" cy="460" r="220" fill="url(#glow1)"/>
        <circle cx="512" cy="460" r="160" fill="${c1}" opacity="0.85"/>
        <line x1="512" y1="120" x2="512" y2="800" stroke="${c4}" stroke-width="1" stroke-dasharray="8,6" opacity="0.4"/>
        <line x1="160" y1="460" x2="864" y2="460" stroke="${c4}" stroke-width="1" stroke-dasharray="8,6" opacity="0.4"/>
        <text x="512" y="810" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="36">${safeText}</text>
        <text x="512" y="870" text-anchor="middle" fill="${c5}" font-family="system-ui, sans-serif" font-weight="600" font-size="13" letter-spacing="6" opacity="0.7">HARMONIC ECLIPSE · ${numIndex}</text>
      </svg>`;

    case 2:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <rect width="512" height="512" fill="${c1}"/>
        <rect x="512" width="512" height="512" fill="${c2}"/>
        <rect y="512" width="512" height="512" fill="${c3}"/>
        <rect x="512" y="512" width="512" height="512" fill="${c4}"/>
        <circle cx="512" cy="512" r="140" fill="${c5}" opacity="0.95"/>
        <text x="512" y="522" text-anchor="middle" fill="${c1}" font-family="system-ui, sans-serif" font-weight="800" font-size="32">${numIndex}</text>
        <line x1="0" y1="512" x2="1024" y2="512" stroke="${c5}" stroke-width="2" opacity="0.4"/>
        <line x1="512" y1="0" x2="512" y2="1024" stroke="${c5}" stroke-width="2" opacity="0.4"/>
        <text x="80" y="140" fill="${c5}" font-family="monospace" font-size="18" opacity="0.75">[QUADRANT_01]</text>
        <text x="80" y="440" fill="#FFFFFF" font-family="Georgia, serif" font-size="32" font-style="italic">${line1}</text>
        <text x="580" y="940" fill="${c1}" font-family="system-ui, sans-serif" font-weight="700" font-size="20" letter-spacing="3">SWISS GRID SPECIMEN</text>
        <text x="80" y="600" fill="${c5}" font-family="Georgia, serif" font-size="28" opacity="0.9">${line2 || line1}</text>
      </svg>`;

    case 3:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <linearGradient id="grad3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#grad3)"/>
        <polygon points="0,0 1024,400 1024,700 0,300" fill="${c3}" opacity="0.5"/>
        <polygon points="0,400 1024,800 1024,1024 0,624" fill="${c4}" opacity="0.35"/>
        <text x="100" y="240" fill="${c5}" font-family="system-ui, sans-serif" font-weight="900" font-size="140" opacity="0.12">${numIndex}</text>
        <rect x="120" y="680" width="784" height="200" rx="20" fill="${c1}" fill-opacity="0.8" stroke="${c4}" stroke-width="1.5"/>
        <text x="160" y="745" fill="${c4}" font-family="monospace" font-size="14" letter-spacing="3">ATMOSPHERIC MONOLITH</text>
        <text x="160" y="805" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="34">${safeText}</text>
        <circle cx="850" cy="740" r="8" fill="${c4}"/>
      </svg>`;

    case 4:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c3}"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#waveGrad)"/>
        <path d="M-100,500 C200,300 400,700 700,450 C900,280 1000,500 1200,400 L1200,1100 L-100,1100 Z" fill="${c2}" opacity="0.6"/>
        <path d="M-100,650 C250,500 500,800 800,600 C950,480 1050,650 1200,580 L1200,1100 L-100,1100 Z" fill="${c4}" opacity="0.45"/>
        <circle cx="280" cy="320" r="140" fill="${c4}" opacity="0.3"/>
        <circle cx="780" cy="220" r="90" fill="${c5}" opacity="0.2"/>
        <text x="120" y="160" fill="${c5}" font-family="system-ui, sans-serif" font-weight="600" font-size="14" letter-spacing="4">VIBRATIONAL CONTOUR · ${numIndex}</text>
        <text x="120" y="860" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="36">${safeText}</text>
        <line x1="120" y1="910" x2="904" y2="910" stroke="${c5}" stroke-width="1" opacity="0.3"/>
      </svg>`;

    case 5:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <linearGradient id="hTop" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${c2}"/><stop offset="100%" stop-color="${c1}"/>
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="56%" r="50%">
            <stop offset="0%" stop-color="${c4}"/><stop offset="60%" stop-color="${c4}" stop-opacity="0.2"/><stop offset="100%" stop-color="${c1}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="560" fill="url(#hTop)"/>
        <rect y="560" width="1024" height="464" fill="${c1}"/>
        <circle cx="512" cy="560" r="320" fill="url(#sun)"/>
        <line x1="0" y1="560" x2="1024" y2="560" stroke="${c4}" stroke-width="2"/>
        <circle cx="512" cy="560" r="60" fill="${c5}"/>
        <text x="512" y="440" text-anchor="middle" fill="${c5}" font-family="system-ui, sans-serif" font-size="16" letter-spacing="6">HORIZON DIVISION · NO. ${numIndex}</text>
        <text x="512" y="740" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="36">${safeText}</text>
        <text x="512" y="800" text-anchor="middle" fill="${c4}" font-family="monospace" font-size="14" letter-spacing="2">${c1} · ${c2} · ${c3} · ${c4}</text>
      </svg>`;

    case 6:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <rect width="1024" height="1024" fill="${c5}"/>
        <g transform="rotate(-6 512 512)">
          <rect x="180" y="140" width="560" height="660" rx="12" fill="${c1}" opacity="0.8"/>
        </g>
        <g transform="rotate(4 512 512)">
          <rect x="280" y="200" width="540" height="640" rx="12" fill="${c3}" opacity="0.6"/>
        </g>
        <g transform="rotate(-2 512 512)">
          <rect x="240" y="260" width="540" height="540" rx="12" fill="${c4}" opacity="0.45"/>
        </g>
        <rect x="140" y="720" width="744" height="180" rx="16" fill="${c1}" opacity="0.95"/>
        <text x="180" y="780" fill="${c4}" font-family="monospace" font-size="14" letter-spacing="3">RISOGRAPH SPECIMEN · ${numIndex}</text>
        <text x="180" y="840" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="32">${safeText}</text>
      </svg>`;

    case 7:
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <linearGradient id="monoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#monoGrad)"/>
        <text x="440" y="680" fill="${c4}" font-family="Georgia, serif" font-style="italic" font-size="620" opacity="0.14">&amp;</text>
        <rect x="140" y="140" width="744" height="744" fill="none" stroke="${c5}" stroke-width="1.5" opacity="0.25"/>
        <rect x="180" y="580" width="664" height="240" rx="12" fill="${c1}" fill-opacity="0.85" stroke="${c4}" stroke-width="1"/>
        <text x="220" y="640" fill="${c4}" font-family="monospace" font-size="13" letter-spacing="4">DIRECTION NO. ${numIndex}</text>
        <text x="220" y="700" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="34">${line1}</text>
        <text x="220" y="745" fill="#FFFFFF" font-family="Georgia, serif" font-style="italic" font-size="28" opacity="0.8">${line2}</text>
        <circle cx="790" cy="635" r="7" fill="${c4}"/>
        <circle cx="765" cy="635" r="7" fill="${c3}"/>
        <circle cx="740" cy="635" r="7" fill="${c5}"/>
      </svg>`;
  }
}

export const Route = createFileRoute("/api/ai-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt, dna, index } = (await request.json()) as {
          prompt?: string;
          dna?: any;
          index?: number;
        };
        if (!prompt || typeof prompt !== "string") {
          return new Response("Prompt required", { status: 400 });
        }

        const gatewayKey = process.env.PALETTE_PRINT_AI_API_KEY;
        const gateway = process.env.PALETTE_PRINT_AI_IMAGE_GATEWAY_URL;

        if (gatewayKey && gateway) {
          try {
            const upstream = await fetch(gateway, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${gatewayKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3.1-flash-image",
                messages: [{ role: "user", content: prompt }],
                modalities: ["image", "text"],
                stream: true,
              }),
            });
            if (upstream.ok && upstream.body) {
              return new Response(upstream.body, {
                headers: {
                  "Content-Type": "text/event-stream",
                  "Cache-Control": "no-cache",
                },
              });
            }
          } catch (e) {
            console.warn("[ai-image] Upstream gateway error:", e);
          }
        }

        // Direct Google Generative AI Generator with fallback model sequence
        let svgText = "";

        if (GEMINI_KEY && GEMINI_KEY.length > 10) {
          const genAI = new GoogleGenerativeAI(GEMINI_KEY);

          for (const modelName of CANDIDATE_MODELS) {
            try {
              const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: `You are an elite creative design technologist and visual artist.
Your task is to synthesize an evocative, high-resolution, editorial visual graphic in SVG format (viewBox="0 0 1024 1024", width="1024", height="1024") representing the prompt.
Design guidelines:
- Sophisticated, museum-grade aesthetic.
- Rich gradients, atmospheric lighting, architectural shadows, geometric and organic contours.
- Reflect active Style DNA colors if provided${dna?.palette ? ` (${JSON.stringify(dna.palette)})` : ""}.
- Return ONLY the valid raw SVG XML markup. No explanation, no markdown backticks.`,
              });

              const res = await model.generateContent(
                `Generate an editorial artwork SVG representing: "${prompt}".`,
              );

              const raw = res.response.text().trim();
              const cleaned = raw
                .replace(/^```(?:xml|svg)?\s*/i, "")
                .replace(/```\s*$/i, "")
                .trim();

              if (cleaned.includes("<svg") && cleaned.includes("</svg>")) {
                const match = cleaned.match(/<svg[\s\S]*<\/svg>/i);
                if (match) {
                  svgText = match[0];
                  break;
                }
              }
            } catch (err) {
              console.warn(`[ai-image] Model ${modelName} failed, trying next candidate:`, err instanceof Error ? err.message : err);
            }
          }
        }

        // Guaranteed fallback SVG synthesis if remote models are unavailable or rate-limited
        if (!svgText) {
          svgText = createEditorialArtworkSvg(prompt, dna, index);
        }

        const base64Data = Buffer.from(svgText, "utf-8").toString("base64");
        const dataUrl = `data:image/svg+xml;base64,${base64Data}`;

        const sseContent = `event: image_generation.completed\ndata: ${JSON.stringify({
          dataUrl,
          b64_json: base64Data,
          mime_type: "image/svg+xml",
        })}\n\n`;

        return new Response(sseContent, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
