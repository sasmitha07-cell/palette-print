// src/lib/color-extraction.ts

import { Vibrant } from "node-vibrant/browser";
export interface PaletteColor {
  hex: string;
  population: number;
}

export interface PaletteResult {
  dominant: string[];
  colors: PaletteColor[];
}

function rgbToHex(rgb: number[]): string {
  return (
    "#" +
    rgb
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
      .toUpperCase()
  );
}

export async function extractPaletteFromImage(image: File): Promise<PaletteResult> {
  const imageUrl = URL.createObjectURL(image);

  try {
    //const palette = await Vibrant.from(imageUrl).getPalette();

    const palette = await Vibrant.from(imageUrl).getPalette();
    const colors: PaletteColor[] = Object.values(palette)
      .filter(Boolean)
      .map((swatch) => ({
        hex: swatch!.hex,
        population: swatch!.population,
      }))
      .sort((a, b) => b.population - a.population);

    return {
      dominant: colors.slice(0, 5).map((c) => c.hex),
      colors,
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export async function extractPalette(images: File[]): Promise<string[]> {
  const colorFrequency = new Map<string, number>();

  for (const image of images) {
    const result = await extractPaletteFromImage(image);

    result.colors.forEach((color) => {
      const current = colorFrequency.get(color.hex) || 0;

      colorFrequency.set(color.hex, current + color.population);
    });
  }

  return [...colorFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hex]) => hex);
}
