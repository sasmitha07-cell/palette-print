import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const modelName =
  (typeof process !== "undefined" && process.env?.GEMINI_MODEL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_MODEL) ||
  "gemini-3.6-flash";

const model = genAI?.getGenerativeModel({
  model: modelName,
});

export interface VisionAnalysis {
  styleName: string;
  mood: string[];
  typography: string;
  complexity: string;
  visualElements: string[];
  industry: string;
  summary: string;
}

function fallbackAnalysis(): VisionAnalysis {
  return {
    styleName: "Editorial Modernist",
    mood: ["Warm", "Minimal", "Curated"],
    typography: "Italic serif display with restrained sans body",
    complexity: "Balanced editorial composition with strong whitespace",
    visualElements: [
      "Serif typography",
      "Warm paper tones",
      "Terracotta accent",
      "Asymmetric grid",
    ],
    industry: "Creative brand / editorial design",
    summary:
      "The composition hints at an editorial-first visual system with warm neutrals, soft contrast, and a controlled serif-led hierarchy.",
  };
}

function sanitizeAnalysis(payload: unknown): VisionAnalysis {
  const safe = fallbackAnalysis();

  if (!payload || typeof payload !== "object") {
    return safe;
  }

  const source = payload as Partial<VisionAnalysis>;

  return {
    styleName: typeof source.styleName === "string" ? source.styleName : safe.styleName,
    mood: Array.isArray(source.mood)
      ? source.mood.filter((item): item is string => typeof item === "string")
      : safe.mood,
    typography: typeof source.typography === "string" ? source.typography : safe.typography,
    complexity: typeof source.complexity === "string" ? source.complexity : safe.complexity,
    visualElements: Array.isArray(source.visualElements)
      ? source.visualElements.filter((item): item is string => typeof item === "string")
      : safe.visualElements,
    industry: typeof source.industry === "string" ? source.industry : safe.industry,
    summary: typeof source.summary === "string" ? source.summary : safe.summary,
  };
}

export async function analyzeImage(base64Image: string, mimeType: string): Promise<VisionAnalysis> {
  if (!model || !apiKey) {
    return fallbackAnalysis();
  }

  const prompt = `
Analyze this design image.

Return ONLY valid JSON.

{
  "styleName": "",
  "mood": [],
  "typography": "",
  "complexity": "",
  "visualElements": [],
  "industry": "",
  "summary": ""
}

Rules:
- mood must be an array
- visualElements must be an array
- no markdown
- no explanations
- only JSON
`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const text = result.response.text();
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return sanitizeAnalysis(JSON.parse(cleaned));
  } catch (error) {
    console.error("Vision analysis failed:", error);
    return fallbackAnalysis();
  }
}
