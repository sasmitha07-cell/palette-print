import type { VisionAnalysis } from "./vision-analysis";

export function buildFingerprint(analyses: VisionAnalysis[]) {
  const moods = analyses.flatMap((a) => a.mood || []);

  return {
    minimalism: moods.includes("minimal") ? 90 : 50,

    luxury: moods.includes("premium") ? 90 : 40,

    modernity: moods.includes("modern") ? 95 : 60,

    boldness: moods.includes("bold") ? 85 : 40,

    creativity: moods.includes("creative") ? 90 : 60,

    editorial: analyses.some((a) => a.styleName?.toLowerCase().includes("editorial")) ? 95 : 50,
  };
}
