import { extractPalette } from "./color-extraction";

export interface StyleDNA {
  name: string;
  confidence: number;
  theme: string;
  personality: string;
  energy: string;
  tags: string[];
  palette: {
    hex: string;
    name: string;
  }[];
  harmony: string;
  gradients: string[];
  typography: {
    display: {
      name: string;
      style: string;
    };
    body: {
      name: string;
      style: string;
    };
    pairings: string[];
  };
  mood: { label: string; value: number }[];
  fingerprint: { label: string; value: number }[];
  twins: { name: string; match: number; note: string }[];
}

function getColorName(hex: string) {
  const color = hex.toLowerCase();

  if (color.includes("ff")) return "Bright";
  if (color.includes("00")) return "Dark";

  return "Neutral";
}

export async function generateStyleDNA(files: File[]): Promise<StyleDNA> {
  const palette = await extractPalette(files);

  const colors = palette.map((hex) => ({
    hex,
    name: getColorName(hex),
  }));

  const first = palette[0]?.toLowerCase() || "";

  let style = "Modern Minimalist";
  let theme = "Contemporary Design";

  if (first.includes("00")) {
    style = "Luxury Noir";
    theme = "Elegant Dark Design";
  }

  if (first.includes("ff")) {
    style = "Vibrant Creative";
    theme = "Color Rich Expression";
  }

  return {
    name: style,
    confidence: 85,
    theme,
    personality: "Generated from uploaded inspirations",
    energy: "Balanced",
    tags: ["AI Generated", "Image Based"],
    palette: colors,
    harmony: "Generated Harmony",

    gradients: [],

    typography: {
      display: {
        name: "Generated Display",
        style: "Generated",
      },
      body: {
        name: "Generated Body",
        style: "Generated",
      },
      pairings: [],
    },

    mood: [],

    fingerprint: [],

    twins: [],
  };
}
