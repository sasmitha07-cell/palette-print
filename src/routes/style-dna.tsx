import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { extractPalette } from "@/lib/color-extraction";
import { fileToBase64 } from "@/lib/file-to-base64";
import { analyzeImagePixels } from "@/lib/cv-analysis";
import {
  analyzeStyleDnaFn,
  saveDnaProfile,
  generateAiDirectionsFn,
  refineAiDirectionFn,
  generatePromptLibraryFn,
  enhanceUserPromptFn,
  generateMoodboardFn,
  regenerateMoodboardItemFn,
  checkDnaMatchFn,
  askDesignTwinFn,
} from "@/lib/dna.functions";
import type { StyleDNA, ImageStyleAnalysis } from "@/lib/ai/schemas";
import type { CreativeDirection } from "@/lib/ai/directions";
import type { StylePrompt, PromptLibraryResult } from "@/lib/ai/prompts-library";
import type { MoodboardItem, MoodboardCollection } from "@/lib/ai/moodboard";
import type { DNAMatchScoreBreakdown } from "@/lib/ai/dna-match";
import type { DesignTwinRecommendation } from "@/lib/ai/dna-chat";
import {
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  Copy,
  Download,
  GripVertical,
  Layers,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { toast } from "sonner";
import { EyebrowLabel } from "@/components/site/section-heading";
import img1 from "@/assets/inspiration-1.jpg";
import img2 from "@/assets/inspiration-2.jpg";
import img3 from "@/assets/inspiration-3.jpg";
import img4 from "@/assets/inspiration-4.jpg";
import img5 from "@/assets/inspiration-5.jpg";
import img6 from "@/assets/inspiration-6.jpg";

export const Route = createFileRoute("/style-dna")({
  head: () => ({
    meta: [
      { title: "Style DNA Studio — Palette Print" },
      {
        name: "description",
        content:
          "Upload 10 inspiration images, extract your Style DNA and generate palettes, typography, moodboards, prompts and design directions.",
      },
      { property: "og:title", content: "Extract Your Style DNA" },
      {
        property: "og:description",
        content:
          "Ten images. Eight analysis stages. One aesthetic signature that generates everything.",
      },
    ],
  }),
  component: StyleDnaStudio,
});

const SEEDS = [img1, img2, img3, img4, img5, img6, img1, img2, img4, img5];

const STAGES = [
  "Reading your references",
  "Understanding visual language",
  "Mapping typography",
  "Studying composition",
  "Measuring density",
  "Reading visual mood",
  "Detecting recurring patterns",
  "Synthesizing your Style DNA",
];

const SURFACES = [
  { key: "web", title: "Website Design", eyebrow: "Surface 01" },
  { key: "brand", title: "Branding", eyebrow: "Surface 02" },
  { key: "logo", title: "Logo Style", eyebrow: "Surface 03" },
  { key: "social", title: "Social Media", eyebrow: "Surface 04" },
  { key: "portfolio", title: "Portfolio", eyebrow: "Surface 05" },
  { key: "deck", title: "Presentations", eyebrow: "Surface 06" },
] as const;

type SurfaceKey = (typeof SURFACES)[number]["key"];

// Convert image URL to a File object for browser color extraction
async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

// ---------- Radar helpers ----------
function radarPoints(values: number[], radius: number) {
  const n = values.length;
  return values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (v / 100) * radius;
    return [Math.cos(angle) * r, Math.sin(angle) * r] as const;
  });
}

function normalizeStyleDna(raw: unknown): StyleDNA | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown> & Partial<StyleDNA>;

  const name =
    data.identity?.name || data.name || data.style_name || data.styleName || "Custom Style DNA";

  // If there is no recognizable name or identity, reject
  if (!data.identity?.name && !data.name && !data.styleName && !data.style_name) {
    return null;
  }

  // Safe palette extraction
  let palette = data.palette;
  if (!palette || typeof palette !== "object") {
    palette = {
      primary: [{ hex: "#fdfcf8", name: "Bone", role: "primary" }],
      secondary: [{ hex: "#e2d5c0", name: "Clay", role: "secondary" }],
      accent: [{ hex: "#cf5a3c", name: "Terracotta", role: "accent" }],
      neutrals: [{ hex: "#1a1918", name: "Ink", role: "neutral" }],
      rawHexList: ["#fdfcf8", "#f5f1e9", "#e2d5c0", "#cf5a3c", "#7a8b6f", "#1a1918"],
      temperature: 0.62,
      saturation: 0.45,
      brightness: 0.65,
    };
  }

  // Safe fingerprint for RadarChart
  let fingerprint = data.fingerprint;
  if (Array.isArray(fingerprint)) {
    fingerprint = fingerprint
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        label: String(item.label || "Axis"),
        value: typeof item.value === "number" ? Math.max(0, Math.min(100, item.value)) : 50,
      }));
  } else if (fingerprint && typeof fingerprint === "object") {
    fingerprint = Object.entries(fingerprint).map(([key, val]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof val === "number" ? Math.max(0, Math.min(100, val)) : 50,
    }));
  }
  if (!Array.isArray(fingerprint) || fingerprint.length === 0) {
    fingerprint = [
      { label: "Complexity", value: 45 },
      { label: "Motion", value: 30 },
      { label: "Density", value: 50 },
      { label: "Contrast", value: 75 },
      { label: "Warmth", value: 65 },
      { label: "Ornament", value: 35 },
    ];
  }

  // Safe typography: truthful detection without hallucination
  const hasType =
    data.typography?.detected !== undefined
      ? Boolean(data.typography.detected)
      : Boolean(data.typography?.primaryCategory && data.typography.primaryCategory !== "none");

  const typography = {
    detected: hasType,
    primaryCategory: hasType
      ? data.typography?.primaryCategory || data.typography?.primary || "geometric sans"
      : "none",
    secondaryCategory: hasType
      ? data.typography?.secondaryCategory || data.typography?.secondary || "sans-serif"
      : "none",
    personality: hasType ? data.typography?.personality || "modern" : "none",
    weightPreference: hasType ? data.typography?.weightPreference || "Medium-forward" : "none",
    casingPreference: hasType ? data.typography?.casingPreference || "mixed casing" : "none",
    spacingPreference: hasType ? data.typography?.spacingPreference || "balanced tracking" : "none",
    pairings:
      Array.isArray(data.typography?.pairings) && data.typography.pairings.length > 0
        ? data.typography.pairings
        : hasType
          ? ["Cormorant Garamond × Inter", "GT Sectra × Söhne", "Tiempos Headline × Suisse Int'l"]
          : ["Inter × System UI"],
    displayFontExample:
      data.typography?.displayFontExample || (hasType ? "Neue Haas Grotesk" : "Inter"),
    bodyFontExample: data.typography?.bodyFontExample || "Inter",
  };

  // Safe composition
  const composition = {
    symmetry: typeof data.composition?.symmetry === "number" ? data.composition.symmetry : 0.4,
    whitespace:
      typeof data.composition?.whitespace === "number" ? data.composition.whitespace : 0.7,
    grid: typeof data.composition?.grid === "number" ? data.composition.grid : 0.8,
    hierarchy: typeof data.composition?.hierarchy === "number" ? data.composition.hierarchy : 0.85,
    scaleContrast:
      typeof data.composition?.scaleContrast === "number" ? data.composition.scaleContrast : 0.7,
    alignment: data.composition?.alignment || "asymmetric left",
    layoutStyle: data.composition?.layoutStyle || "Structured Editorial",
  };

  // Safe mood
  const mood =
    data.mood && typeof data.mood === "object"
      ? data.mood
      : {
          minimalism: 0.8,
          maximalism: 0.2,
          calm: 0.75,
          energy: 0.4,
          elegance: 0.85,
          playfulness: 0.3,
          seriousness: 0.7,
          warmth: 0.65,
          coolness: 0.35,
          futurism: 0.25,
          nostalgia: 0.6,
          luxury: 0.7,
          rawness: 0.45,
          softness: 0.6,
          boldness: 0.65,
        };

  // Safe identity
  const identity = {
    name,
    tagline:
      data.identity?.tagline || data.theme || "Warm editorial minimalism with tactile sensibility",
    description:
      data.identity?.description ||
      data.summary ||
      "Balanced aesthetic system synthesized from references.",
    keywords:
      Array.isArray(data.identity?.keywords) && data.identity.keywords.length > 0
        ? data.identity.keywords
        : Array.isArray(data.tags) && data.tags.length > 0
          ? data.tags
          : ["Editorial", "Tactile", "Curated", "Asymmetric", "Print DNA"],
  };

  return {
    id: data.id || "active_dna",
    identity,
    palette,
    typography,
    mood,
    composition,
    density: typeof data.density === "number" ? data.density : 0.42,
    densityLabel: data.densityLabel || "Sparse to Balanced",
    contrast:
      data.contrast && typeof data.contrast === "object"
        ? data.contrast
        : {
            overall: 0.7,
            color: 0.6,
            tonal: 0.8,
            scale: 0.7,
            typography: 0.65,
            form: 0.5,
          },
    texture:
      data.texture && typeof data.texture === "object"
        ? data.texture
        : {
            materials: ["paper", "fine grain", "matte ceramic"],
            tactileLevel: 0.65,
            surfaceStyle: "matte",
            visualLanguage: "Tactile",
          },
    imagery:
      data.imagery && typeof data.imagery === "object"
        ? data.imagery
        : {
            subjects: ["editorial still life", "architectural spatial study"],
            photographyStyle: ["natural directional light", "studio documentation"],
            treatment: ["clean", "muted tonal curve"],
          },
    rhythm:
      data.rhythm && typeof data.rhythm === "object"
        ? data.rhythm
        : {
            type: "asymmetric cadence",
            repetition: 0.5,
            pacing: 0.6,
          },
    principles:
      Array.isArray(data.principles) && data.principles.length > 0
        ? data.principles
        : [
            "01 — Let whitespace create authority.",
            "02 — Pair restrained neutrals with one deliberate accent.",
            "03 — Use typography as architecture rather than decoration.",
            "04 — Favor controlled asymmetry over rigid symmetry.",
            "05 — Keep imagery tactile, authentic, and human-scaled.",
          ],
    doList:
      Array.isArray(data.doList) && data.doList.length > 0
        ? data.doList
        : [
            "Use generous editorial margins and intentional negative space.",
            "Anchor headlines in high-contrast type with disciplined hierarchy.",
            "Reserve accent colors for singular moments of emphasis.",
          ],
    dontList:
      Array.isArray(data.dontList) && data.dontList.length > 0
        ? data.dontList
        : [
            "Do not overcrowd layouts or compress line height.",
            "Avoid combining multiple competing display typefaces.",
            "Avoid synthetic digital drop shadows without physical light logic.",
          ],
    confidence: data.confidence || {
      overall: 0.88,
      color: 0.92,
      typography: 0.84,
      composition: 0.86,
      mood: 0.85,
    },
    sourceImageCount: typeof data.sourceImageCount === "number" ? data.sourceImageCount : 10,
    evidence:
      Array.isArray(data.evidence) && data.evidence.length > 0
        ? data.evidence
        : [
            {
              trait: "Generous Whitespace",
              strength: "dominant pattern",
              summary: "Observed in majority of references",
            },
            {
              trait: "High Tonal Contrast",
              strength: "strong recurring",
              summary: "Observed across reference hierarchy",
            },
          ],
    imageAnalyses: Array.isArray(data.imageAnalyses) ? data.imageAnalyses : [],
    name,
    styleName: name,
    style_name: name,
    theme: identity.tagline,
    summary: identity.description,
    personality: "editorial",
    energy: "Calm · Considered · Confident",
    tags: identity.keywords,
    harmony: data.harmony || "Analogous Neutral with Complementary Accent",
    gradients: Array.isArray(data.gradients)
      ? data.gradients
      : ["linear-gradient(135deg, #fdfcf8, #e2d5c0)", "linear-gradient(135deg, #cf5a3c, #7a2f1d)"],
    fingerprint,
    twins: Array.isArray(data.twins)
      ? data.twins
      : [
          {
            name: "Kinfolk",
            match: 91,
            note: "Shares high-contrast serif headlines, tactile stock, and generous white margins.",
          },
          {
            name: "Cereal Magazine",
            match: 86,
            note: "Identical restrained neutral palette and calm tonal photography.",
          },
          {
            name: "Studio Nicholson",
            match: 82,
            note: "Aligned on utilitarian typography with asymmetric layout discipline.",
          },
        ],
    paletteList: Array.isArray(data.paletteList) ? data.paletteList : [],
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

function StyleDnaStudio() {
  const [dna, setDna] = useState<StyleDNA | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done">("idle");
  const [stageIdx, setStageIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [selectedImageAnalysis, setSelectedImageAnalysis] = useState<ImageStyleAnalysis | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const dnaRef = useRef<HTMLDivElement | null>(null);

  const serverAnalyze = useServerFn(analyzeStyleDnaFn);
  const serverSave = useServerFn(saveDnaProfile);

  // Restore saved active DNA if present with safe fallback validation
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pp:active-dna");
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = normalizeStyleDna(parsed);
        if (normalized) {
          setDna(normalized);
          setStatus("done");
        } else {
          localStorage.removeItem("pp:active-dna");
        }
      }
    } catch {
      try {
        localStorage.removeItem("pp:active-dna");
      } catch {
        // noop
      }
    }
  }, []);

  const addFromFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;

    setImageFiles((prev) => {
      const room = 10 - prev.length;
      return [...prev, ...arr.slice(0, room)];
    });

    setImages((prev) => {
      const room = 10 - prev.length;
      const next = arr.slice(0, room).map((f) => URL.createObjectURL(f));
      return [...prev, ...next];
    });
  }, []);

  const addSample = useCallback(async () => {
    if (images.length >= 10) return;
    const seedUrl = SEEDS[images.length];
    try {
      const file = await urlToFile(seedUrl, `sample-${images.length + 1}.jpg`);
      setImageFiles((prev) => [...prev, file]);
      setImages((prev) => [...prev, seedUrl]);
    } catch {
      setImages((prev) => [...prev, seedUrl]);
    }
  }, [images.length]);

  const fillAll = useCallback(async () => {
    toast.info("Loading reference sample set…");
    const sampleUrls = SEEDS.slice(0, 10);
    setImages(sampleUrls);

    try {
      const files = await Promise.all(
        sampleUrls.map((url, i) => urlToFile(url, `sample-${i + 1}.jpg`)),
      );
      setImageFiles(files);
      toast.success("10 references ready for extraction");
    } catch (err) {
      console.warn("Could not convert sample URLs to files:", err);
    }
  }, []);

  const remove = useCallback((i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) addFromFiles(e.dataTransfer.files);
    },
    [addFromFiles],
  );

  const onFilePick = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFromFiles(e.target.files);
      e.target.value = "";
    },
    [addFromFiles],
  );

  const reorder = useCallback((from: number, to: number) => {
    setImages((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length)
        return prev;
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
    setImageFiles((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length)
        return prev;
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  }, []);

  // MAIN ANALYSIS PIPELINE
  const analyze = useCallback(async () => {
    if (images.length !== 10) return;

    let stageTimer: ReturnType<typeof setInterval> | null = null;
    try {
      setStatus("analyzing");
      setStageIdx(0); // 01: Reading your references

      // Ensure we have File objects for all images
      let filesToProcess = [...imageFiles];
      if (filesToProcess.length < 10) {
        filesToProcess = await Promise.all(
          images.map((src, i) => urlToFile(src, `reference-${i + 1}.jpg`)),
        );
        setImageFiles(filesToProcess);
      }

      setStageIdx(1); // 02: Understanding visual language
      // CRITICAL: Consuming output of existing color extraction without modifying it
      const authoritativePalette = await extractPalette(filesToProcess);

      setStageIdx(2); // 03: Mapping typography
      const imagePayloads = await Promise.all(
        filesToProcess.map(async (file, idx) => {
          const imageId = `ref_${idx + 1}`;
          const [base64, cvMetrics] = await Promise.all([
            fileToBase64(file),
            analyzeImagePixels(file, imageId).catch((err) => {
              console.warn("CV pixel analysis fallback for image:", err);
              return undefined;
            }),
          ]);
          return {
            id: imageId,
            base64,
            mimeType: file.type || "image/jpeg",
            cvMetrics,
          };
        }),
      );

      setStageIdx(3); // 04: Studying composition

      // Advance through stages 4 -> 5 -> 6 while server runs
      let currentStage = 3;
      stageTimer = setInterval(() => {
        if (currentStage < 6) {
          currentStage++;
          setStageIdx(currentStage);
        }
      }, 700);

      // Call server-side pipeline passing { data: { images, authoritativePalette } }
      const generatedDna = await serverAnalyze({
        data: {
          images: imagePayloads,
          authoritativePalette,
        },
      });

      if (stageTimer) clearInterval(stageTimer);
      setStageIdx(7); // 08: Synthesizing your Style DNA
      await new Promise((r) => setTimeout(r, 400));

      setDna(generatedDna);

      // Cache locally so AI Studio and page reloads have active DNA
      try {
        localStorage.setItem("pp:active-dna", JSON.stringify(generatedDna));
      } catch {
        // ignore storage error
      }

      toast.success(`Style DNA locked: ${generatedDna.identity?.name || generatedDna.name}`);
      setStatus("done");
    } catch (error: unknown) {
      if (stageTimer) clearInterval(stageTimer);
      console.error("[Style DNA] Extraction failed:", error);
      const errMsg =
        error instanceof Error
          ? error.message
          : "Style analysis couldn't be completed. Please try again.";
      toast.error(errMsg);
      setStatus("idle");
    }
  }, [imageFiles, images, serverAnalyze]);

  const overallConfidence = useMemo(() => {
    if (!dna) return 85;
    if (typeof dna.confidence === "object" && dna.confidence !== null) {
      return Math.round((dna.confidence.overall || 0.85) * 100);
    }
    if (typeof dna.confidence === "number") {
      return dna.confidence;
    }
    return 85;
  }, [dna]);

  const primaryAndSecondaryColors = useMemo(() => {
    if (!dna?.palette) return [];
    if (Array.isArray(dna.palette)) {
      return (dna.palette as Array<{ hex?: string; name?: string } | string>).map((c) => ({
        hex: typeof c === "string" ? c : c.hex || "#333333",
        name: typeof c === "object" ? c.name || "Tone" : "Tone",
        role: "primary",
      }));
    }
    const prim = Array.isArray(dna.palette.primary) ? dna.palette.primary : [];
    const sec = Array.isArray(dna.palette.secondary) ? dna.palette.secondary : [];
    return [...prim, ...sec];
  }, [dna?.palette]);

  const accentAndNeutralColors = useMemo(() => {
    if (!dna?.palette || Array.isArray(dna.palette)) return [];
    const acc = Array.isArray(dna.palette.accent) ? dna.palette.accent : [];
    const neu = Array.isArray(dna.palette.neutrals) ? dna.palette.neutrals : [];
    return [...acc, ...neu];
  }, [dna?.palette]);

  const rawHexOverview = useMemo(() => {
    if (!dna?.palette) return [];
    if (Array.isArray(dna.palette)) {
      return (dna.palette as Array<{ hex?: string } | string>).map((c) =>
        typeof c === "string" ? c : c.hex || "#333333",
      );
    }
    if (Array.isArray(dna.palette.rawHexList)) {
      return dna.palette.rawHexList;
    }
    return [];
  }, [dna?.palette]);

  const moodBreakdown = useMemo(() => {
    if (!dna?.mood) return [];
    if (Array.isArray(dna.mood)) {
      return (dna.mood as Array<{ label?: string; value?: number } | string>).map((m, idx) => ({
        key:
          typeof m === "object" && m?.label
            ? m.label
            : typeof m === "string"
              ? m
              : `Dimension ${idx + 1}`,
        pct: Math.round(
          typeof m === "object" && typeof m?.value === "number"
            ? m.value <= 1
              ? m.value * 100
              : m.value
            : 50,
        ),
      }));
    }
    if (typeof dna.mood === "object") {
      return Object.entries(dna.mood)
        .filter(([_, val]) => typeof val === "number")
        .map(([key, val]) => ({
          key,
          pct: Math.round((val as number) <= 1 ? (val as number) * 100 : (val as number)),
        }));
    }
    return [];
  }, [dna?.mood]);

  const handleSaveToProfile = useCallback(async () => {
    if (!dna || isSaving) return;
    setIsSaving(true);
    try {
      await serverSave({
        data: {
          name: dna.identity?.name || dna.name || "Style DNA",
          style_name: dna.identity?.name || dna.name || "Style DNA",
          confidence: overallConfidence,
          summary: dna.identity?.description || dna.summary || "",
          tags: dna.identity?.keywords || dna.tags || [],
          palette: dna.palette,
          typography: dna.typography,
          mood: dna.mood,
          fingerprint: {
            radar: dna.fingerprint,
            fullDNA: dna,
          },
        },
      });
      setIsSaved(true);
      toast.success("Style DNA saved to your profile!");
    } catch (err: unknown) {
      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes("Unauthorized") || errStr.includes("auth")) {
        toast.info("DNA is active in your browser session. Sign in to sync it to cloud profiles.");
      } else {
        toast.error(errStr || "Could not save DNA profile.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [dna, isSaving, overallConfidence, serverSave]);

  const reset = useCallback(() => {
    setImages([]);
    setImageFiles([]);
    setDna(null);
    setStatus("idle");
    setStageIdx(0);
    setIsSaved(false);
    setSelectedImageAnalysis(null);
    try {
      localStorage.removeItem("pp:active-dna");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (status === "done" && dnaRef.current) {
      dnaRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  const canAnalyze = images.length === 10 && status !== "analyzing";

  return (
    <div className="overflow-hidden">
      {/* HERO / UPLOAD */}
      <section className="px-6 pb-16 pt-20">
        <div className="mx-auto max-w-6xl">
          <EyebrowLabel>Style DNA Studio</EyebrowLabel>
          <div className="mt-6 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <h1 className="max-w-3xl font-display text-6xl italic leading-[1.05]">
              Drop <em className="text-accent">ten inspirations</em> and watch your DNA emerge
            </h1>
            <div className="flex gap-2">
              <button
                onClick={fillAll}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-bone"
              >
                Load Sample Set
              </button>
              <button
                onClick={reset}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Upload grid */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-3xl border bg-card p-6 transition-colors ${
              dragOver ? "border-accent bg-accent/5" : "border-border"
            }`}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Inspiration Grid
              </span>
              <span className="font-mono text-sm">
                <span className={images.length === 10 ? "text-accent" : ""}>{images.length}</span>
                <span className="text-muted-foreground"> / 10</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => {
                const src = images[i];
                return (
                  <motion.div
                    key={i}
                    layout
                    draggable={!!src}
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.stopPropagation();
                      if (dragIdx !== null) reorder(dragIdx, i);
                      setDragIdx(null);
                    }}
                    className={`group relative aspect-square overflow-hidden rounded-2xl border ${
                      src ? "border-border" : "border-dashed border-border/70"
                    } ${dragIdx === i ? "opacity-40" : ""}`}
                  >
                    {src ? (
                      <>
                        <img
                          src={src}
                          alt={`Reference ${i + 1}`}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="grid size-6 place-items-center rounded-full bg-background/85 backdrop-blur">
                            <GripVertical className="size-3" />
                          </span>
                          <button
                            onClick={() => remove(i)}
                            className="grid size-6 place-items-center rounded-full bg-background/85 backdrop-blur"
                            aria-label="Remove image"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                        <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest backdrop-blur">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </>
                    ) : (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="grid size-full place-items-center bg-bone/40 transition-colors hover:bg-bone"
                      >
                        <Upload className="size-4 text-muted-foreground" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={onFilePick}
            />

            <div className="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">
                Drop images anywhere on this card, click a tile to upload, or use{" "}
                <button className="underline" onClick={addSample}>
                  add sample
                </button>
                .
              </p>
              <button
                onClick={analyze}
                disabled={!canAnalyze}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-glow transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "analyzing" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {status === "analyzing"
                  ? "Analyzing Pipeline…"
                  : images.length < 10
                    ? `Need ${10 - images.length} more`
                    : "Extract Style DNA"}
              </button>
            </div>
          </div>

          {/* Analysis panel */}
          <div className="rounded-3xl border border-border bg-ink p-8 text-background">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-soft">
              Analysis Pipeline
            </span>
            <h3 className="mt-3 font-display text-3xl italic">
              {status === "idle" && "Awaiting inspirations"}
              {status === "analyzing" && "Synthesizing DNA"}
              {status === "done" && "DNA locked & ready"}
            </h3>

            <ul className="mt-8 space-y-3">
              {STAGES.map((s, i) => {
                const active = status === "analyzing" && i === stageIdx;
                const complete = status === "done" || (status === "analyzing" && i < stageIdx);
                return (
                  <li
                    key={s}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                      active
                        ? "border-accent bg-accent/10"
                        : complete
                          ? "border-background/10 bg-background/5"
                          : "border-background/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-background/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm">{s}</span>
                    </div>
                    {complete && !active ? (
                      <Check className="size-4 text-accent" />
                    ) : active ? (
                      <Loader2 className="size-4 animate-spin text-accent" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-background/20" />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* DNA DASHBOARD */}
      <AnimatePresence>
        {status === "done" && dna ? (
          <motion.div
            ref={dnaRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* 1. SIGNATURE CARD */}
            <section className="px-6 pb-16">
              <div className="mx-auto max-w-6xl rounded-[32px] border border-border bg-bone/50 p-10">
                <div className="grid gap-10 md:grid-cols-[1.3fr_1.1fr]">
                  <div>
                    <div className="flex items-center justify-between">
                      <EyebrowLabel>Your Style DNA</EyebrowLabel>
                      <button
                        onClick={handleSaveToProfile}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium transition-colors hover:bg-bone"
                      >
                        {isSaving ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : isSaved ? (
                          <Check className="size-3.5 text-accent" />
                        ) : (
                          <Bookmark className="size-3.5" />
                        )}
                        {isSaved ? "Saved to Profile" : "Save DNA"}
                      </button>
                    </div>
                    <h2 className="mt-3 font-display text-5xl italic leading-none">
                      {dna.identity?.name || dna.name || "Editorial Modernist"}
                    </h2>
                    <p className="mt-3 text-base text-muted-foreground">
                      {dna.identity?.tagline || dna.theme || "Curated aesthetic signature"}
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${overallConfidence}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="h-full bg-accent"
                          />
                        </div>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {overallConfidence}% confidence
                      </span>
                    </div>

                    <p className="mt-5 text-sm leading-relaxed text-foreground/90">
                      {dna.identity?.description ||
                        dna.summary ||
                        "Balanced visual system derived from uploaded references."}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {(
                        dna.identity?.keywords ||
                        dna.tags || ["Editorial", "Tactile", "Curated"]
                      ).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Palette Preview */}
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      Extracted Palette Overview
                    </span>
                    <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {rawHexOverview.slice(0, 8).map((hex, i) => (
                        <motion.div
                          key={hex + i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.04 }}
                          className="overflow-hidden rounded-2xl border border-border bg-background p-2.5"
                        >
                          <div
                            className="aspect-square w-full rounded-xl border border-border/40"
                            style={{ backgroundColor: hex }}
                          />
                          <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground">
                            {hex}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. AUTHORITATIVE COLOR INTELLIGENCE */}
            <section className="px-6 pb-16">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
                <Card eyebrow="Color DNA" title="Authoritative Extracted Palette">
                  <p className="text-sm text-muted-foreground">
                    Harmonized from your uploads into functional brand roles.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Primary & Secondary
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {primaryAndSecondaryColors.map((c, idx) => (
                          <div
                            key={c.hex + idx}
                            className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
                          >
                            <span
                              className="size-4 rounded-full border border-border/40"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-xs font-medium">{c.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {c.hex}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {accentAndNeutralColors.length > 0 && (
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Accent & Neutrals
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {accentAndNeutralColors.map((c, idx) => (
                            <div
                              key={c.hex + idx}
                              className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
                            >
                              <span
                                className="size-4 rounded-full border border-border/40"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="text-xs font-medium">{c.name}</span>
                              <span className="rounded bg-bone px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                                {c.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Temperature
                      </span>
                      <p className="mt-1 font-display text-xl italic">
                        {(dna.palette?.temperature ?? 0.6) > 0.55
                          ? "Warm Tones"
                          : (dna.palette?.temperature ?? 0.6) < 0.45
                            ? "Cool Slate"
                            : "Balanced"}
                      </p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full bg-accent"
                          style={{
                            width: `${Math.round((dna.palette?.temperature ?? 0.6) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Saturation
                      </span>
                      <p className="mt-1 font-display text-xl italic">
                        {(dna.palette?.saturation ?? 0.4) > 0.5 ? "Vibrant" : "Muted"}
                      </p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full bg-ink"
                          style={{
                            width: `${Math.round((dna.palette?.saturation ?? 0.4) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Brightness
                      </span>
                      <p className="mt-1 font-display text-xl italic">
                        {Math.round((dna.palette?.brightness ?? 0.55) * 100)}%
                      </p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full bg-ink"
                          style={{
                            width: `${Math.round((dna.palette?.brightness ?? 0.55) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Typography DNA */}
                {dna.typography?.detected === false ||
                dna.typography?.primaryCategory === "none" ? (
                  <Card eyebrow="Typography DNA" title="Image-Centric Hierarchy">
                    <div className="rounded-2xl border border-dashed border-border bg-background/60 p-6 text-center">
                      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                        Evidence Limited
                      </p>
                      <h4 className="mt-2 text-base font-medium">
                        No prominent typography detected
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        Visual hierarchy across your references is established through image
                        composition, cropping, and negative space rather than heavy typographic
                        blocks.
                      </p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-border bg-background p-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Recommended Neutral Pairing
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        If applying text to this visual identity, clean neutral grotesque pairing is
                        recommended:
                      </p>
                      <ul className="mt-3 space-y-1.5 text-sm">
                        {(dna.typography?.pairings || ["Inter × System UI"]).map((p) => (
                          <li key={p} className="flex items-center gap-2">
                            <span className="size-1 rounded-full bg-accent" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                ) : (
                  <Card
                    eyebrow="Typography DNA"
                    title={`${dna.typography?.primaryCategory || "Display"} meets ${dna.typography?.secondaryCategory || "Body Sans"}`}
                  >
                    <div className="rounded-2xl border border-border bg-background p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                          Display · {dna.typography?.primaryCategory}
                        </p>
                        <span className="rounded-full bg-bone px-2 py-0.5 font-mono text-[10px] text-accent">
                          {dna.typography?.personality}
                        </span>
                      </div>
                      <p className="mt-3 font-display text-4xl italic leading-none">
                        Discover the blueprint.
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Preference: {dna.typography?.weightPreference} ·{" "}
                        {dna.typography?.spacingPreference}
                      </p>
                    </div>

                    <div className="mt-3 rounded-2xl border border-border bg-background p-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Body · {dna.typography?.secondaryCategory}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">
                        Calibrated for editorial flow: {dna.typography?.casingPreference}. Quiet
                        enough to let visual assets lead, structured enough to anchor the grid.
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Recommended Pairings
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        {(dna.typography?.pairings || []).map((p) => (
                          <li key={p} className="flex items-center gap-2">
                            <span className="size-1 rounded-full bg-accent" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                )}
              </div>
            </section>

            {/* 3. MOOD (15-AXIS) & RADAR FINGERPRINT */}
            <section className="px-6 pb-16">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
                <Card eyebrow="Mood Analysis" title="15-Axis Aesthetic Tone">
                  <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
                    {moodBreakdown.map(({ key, pct }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize">{key}</span>
                          <span className="font-mono text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            className="h-full bg-ink"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card eyebrow="Design Fingerprint" title="Six-Axis Structural Radar">
                  <RadarChart data={dna.fingerprint || []} />
                </Card>
              </div>
            </section>

            {/* 4. COMPOSITION, DENSITY & CONTRAST */}
            <section className="px-6 pb-16">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
                {/* Composition */}
                <Card eyebrow="Composition" title="Spatial Architecture">
                  <div className="space-y-3 text-sm">
                    <MetaRow
                      k="Layout Style"
                      v={dna.composition?.layoutStyle || "Structured Editorial"}
                    />
                    <MetaRow k="Alignment" v={dna.composition?.alignment || "Asymmetrical Left"} />
                    <MetaRow
                      k="Whitespace"
                      v={`${Math.round((dna.composition?.whitespace ?? 0.7) * 100)}% Generous`}
                    />
                    <MetaRow
                      k="Grid Adherence"
                      v={`${Math.round((dna.composition?.grid ?? 0.8) * 100)}% Strict`}
                    />
                    <MetaRow
                      k="Symmetry Score"
                      v={`${Math.round((dna.composition?.symmetry ?? 0.4) * 100)}% Controlled`}
                    />
                  </div>
                </Card>

                {/* Density Gauge */}
                <Card eyebrow="Visual Density" title="Spatial Ratio">
                  <div className="mt-2 text-center">
                    <div className="font-display text-5xl italic text-accent">
                      {Math.round((dna.density ?? 0.4) * 100)}%
                    </div>
                    <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {dna.densityLabel || "Sparse to Balanced"}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between text-[10px] font-mono uppercase text-muted-foreground">
                      <span>Sparse</span>
                      <span>Balanced</span>
                      <span>Dense</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${Math.round((dna.density ?? 0.4) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
                    Measured from object layering, information density, and negative space ratios
                    across your inspirations.
                  </p>
                </Card>

                {/* Contrast Dimensions */}
                <Card eyebrow="Contrast Matrix" title="Multi-Axis Contrast">
                  <div className="space-y-3">
                    <Bar
                      label="Color Contrast"
                      value={Math.round((dna.contrast?.color ?? 0.6) * 100)}
                    />
                    <Bar
                      label="Tonal / Luminance"
                      value={Math.round((dna.contrast?.tonal ?? 0.8) * 100)}
                    />
                    <Bar
                      label="Scale Contrast"
                      value={Math.round((dna.contrast?.scale ?? 0.7) * 100)}
                    />
                    <Bar
                      label="Typographic Hierarchy"
                      value={Math.round((dna.contrast?.typography ?? 0.6) * 100)}
                    />
                    <Bar
                      label="Form & Geometry"
                      value={Math.round((dna.contrast?.form ?? 0.5) * 100)}
                    />
                  </div>
                </Card>
              </div>
            </section>

            {/* 5. TEXTURE & IMAGERY STYLE */}
            <section className="px-6 pb-16">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
                <Card eyebrow="Texture & Materiality" title="Physical Tactile Language">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Tactile Index
                    </span>
                    <span className="font-mono text-sm font-medium">
                      {Math.round((dna.texture?.tactileLevel ?? 0.5) * 100)}%{" "}
                      {dna.texture?.visualLanguage || "Tactile"}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${Math.round((dna.texture?.tactileLevel ?? 0.5) * 100)}%` }}
                    />
                  </div>

                  <div className="mt-6">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Detected Material Surfaces
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(dna.texture?.materials || ["paper", "fine grain", "matte surface"]).map(
                        (m) => (
                          <span
                            key={m}
                            className="rounded-full border border-border bg-background px-3 py-1 text-xs capitalize"
                          >
                            {m}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </Card>

                <Card eyebrow="Imagery Language" title="Photography & Treatment">
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Subjects & Composition
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(
                          dna.imagery?.subjects || [
                            "editorial still life",
                            "architectural spatial study",
                          ]
                        ).map((s) => (
                          <span
                            key={s}
                            className="rounded-lg bg-bone px-2.5 py-1 text-xs text-foreground"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Photography Style
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(
                          dna.imagery?.photographyStyle || [
                            "natural directional light",
                            "studio documentation",
                          ]
                        ).map((p) => (
                          <span
                            key={p}
                            className="rounded-lg bg-bone px-2.5 py-1 text-xs text-foreground"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Image Treatment
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(dna.imagery?.treatment || ["clean", "muted tonal curve"]).map((t) => (
                          <span
                            key={t}
                            className="rounded-lg bg-bone px-2.5 py-1 text-xs text-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* 6. DESIGN PRINCIPLES & DO / DON'T */}
            <section className="px-6 pb-16">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
                {/* Design Principles */}
                <Card eyebrow="Core Directives" title="Synthesized Design Principles">
                  <div className="space-y-3">
                    {(
                      dna.principles || [
                        "01 — Let whitespace create authority.",
                        "02 — Pair restrained neutrals with one deliberate accent.",
                        "03 — Use typography as architecture rather than decoration.",
                        "04 — Favor controlled asymmetry over rigid symmetry.",
                        "05 — Keep imagery tactile, authentic, and human-scaled.",
                      ]
                    ).map((p, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-border bg-background p-4 text-sm font-medium"
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* DO and DON'T Rules */}
                <Card eyebrow="Creative Rules" title="Actionable Guidelines">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent">
                        <CheckCircle2 className="size-4 text-accent" /> DO
                      </div>
                      <ul className="mt-2 space-y-2 text-xs">
                        {(
                          dna.doList || [
                            "Use generous editorial margins and intentional negative space.",
                            "Anchor headlines in high-contrast type with disciplined hierarchy.",
                            "Reserve accent colors for singular moments of emphasis.",
                          ]
                        ).map((d, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 rounded-xl bg-accent/5 p-2.5 text-foreground"
                          >
                            <span className="mt-0.5 text-accent">✓</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        <XCircle className="size-4 text-muted-foreground" /> DON'T
                      </div>
                      <ul className="mt-2 space-y-2 text-xs">
                        {(
                          dna.dontList || [
                            "Do not overcrowd layouts or compress line height.",
                            "Avoid combining multiple competing display typefaces.",
                            "Avoid synthetic digital drop shadows without physical light logic.",
                          ]
                        ).map((d, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 rounded-xl bg-bone p-2.5 text-muted-foreground"
                          >
                            <span className="mt-0.5 text-accent">✕</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* 7. SOURCE TRACEABILITY & PER-IMAGE INSPECTOR */}
            <section className="px-6 pb-16">
              <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <EyebrowLabel>Traceability & Evidence</EyebrowLabel>
                    <h3 className="mt-2 font-display text-4xl italic">
                      Why this DNA was synthesized
                    </h3>
                  </div>
                  <p className="max-w-md text-xs text-muted-foreground">
                    Confidence is rooted in cross-reference frequency and pattern consistency, not
                    isolated guess-work.
                  </p>
                </div>

                {/* Evidence badges */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {(
                    dna.evidence || [
                      {
                        trait: "Generous Whitespace",
                        strength: "dominant pattern",
                        summary: "Observed in majority of references",
                      },
                      {
                        trait: "High Tonal Contrast",
                        strength: "strong recurring",
                        summary: "Observed across reference hierarchy",
                      },
                    ]
                  ).map((ev, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-background p-4">
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent">
                        {ev.strength}
                      </span>
                      <h4 className="mt-2 text-sm font-semibold">{ev.trait}</h4>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{ev.summary}</p>
                    </div>
                  ))}
                </div>

                {/* Clickable Image Reference Inspector */}
                {images.length > 0 && (
                  <div className="mt-8 border-t border-border pt-6">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        Inspect Individual Reference Analysis (
                        {dna.sourceImageCount || images.length} References)
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Tap any image to inspect
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
                      {images.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const analysis = dna.imageAnalyses?.[i] || null;
                            setSelectedImageAnalysis(analysis);
                          }}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-border transition-transform hover:scale-105"
                        >
                          <img src={src} alt="Reference" className="size-full object-cover" />
                          <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1 font-mono text-[8px]">
                            {i + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* MODAL: INDIVIDUAL IMAGE ANALYSIS INSPECTOR */}
            <AnimatePresence>
              {selectedImageAnalysis ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
                  onClick={() => setSelectedImageAnalysis(null)}
                >
                  <motion.div
                    initial={{ y: 20, scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 20, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-background p-8 shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <EyebrowLabel>Reference Inspector</EyebrowLabel>
                        <h3 className="font-display text-3xl italic">
                          {selectedImageAnalysis.imageId}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedImageAnalysis(null)}
                        className="grid size-8 place-items-center rounded-full border border-border hover:bg-bone"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="mt-6 space-y-4 text-sm">
                      <div className="rounded-2xl bg-bone p-4">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Detected Typography
                        </span>
                        <p className="mt-1 font-semibold capitalize">
                          {selectedImageAnalysis.typography?.category} (
                          {selectedImageAnalysis.typography?.personality})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Confidence:{" "}
                          {Math.round((selectedImageAnalysis.typography?.confidence || 0) * 100)}%
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-border p-4">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            Composition
                          </span>
                          <p className="mt-1 font-medium capitalize">
                            {selectedImageAnalysis.composition?.layout} layout
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            Whitespace: {selectedImageAnalysis.composition?.whitespace}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border p-4">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            Visual Density
                          </span>
                          <p className="mt-1 font-medium capitalize">
                            {selectedImageAnalysis.density?.levelLabel} (
                            {Math.round((selectedImageAnalysis.density?.score || 0) * 100)}%)
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            Clutter: {selectedImageAnalysis.density?.visualClutter}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border p-4">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Observed Textures
                        </span>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {selectedImageAnalysis.texture?.materials?.map((m) => (
                            <span
                              key={m}
                              className="rounded-md bg-bone px-2 py-0.5 text-xs capitalize"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* AI Directions */}
            <AiDirections dna={dna} />

            {/* Prompt Library */}
            <PromptLibrary dna={dna} />

            {/* Moodboard + Design Twin */}
            <section className="px-6 pb-16">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.4fr_1fr]">
                <MoodboardGenerator dna={dna} />
                <DesignTwins dna={dna} />
              </div>
            </section>

            {/* DNA Match Checker */}
            <section className="px-6 pb-24">
              <div className="mx-auto max-w-6xl">
                <DnaMatchChecker dna={dna} />
              </div>
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ---------- Small building blocks ----------
function MetaRow({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border/60 pb-2">
      <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {k}
      </dt>
      <dd className="max-w-xs text-right capitalize">{v ?? "—"}</dd>
    </div>
  );
}

function Card({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <EyebrowLabel>{eyebrow}</EyebrowLabel>
      <h3 className="mt-2 font-display text-3xl italic leading-tight">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  if (!Array.isArray(data) || !data.length) return null;
  const validData = data
    .filter((d) => d && typeof d === "object")
    .map((d) => ({
      label: String(d.label || "Axis"),
      value: typeof d.value === "number" && !isNaN(d.value) ? d.value : 50,
    }));
  if (!validData.length) return null;

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;
  const rings = [0.25, 0.5, 0.75, 1];

  const points = radarPoints(
    validData.map((d) => d.value),
    radius,
  );
  const path = points.map(([x, y]) => `${cx + x},${cy + y}`).join(" ");

  return (
    <div className="grid place-items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full max-w-[320px]">
        {rings.map((r) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={radius * r}
            fill="none"
            stroke="currentColor"
            className="text-ink/10"
          />
        ))}
        {validData.map((_, i) => {
          const angle = (Math.PI * 2 * i) / validData.length - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(angle) * radius}
              y2={cy + Math.sin(angle) * radius}
              stroke="currentColor"
              className="text-ink/10"
            />
          );
        })}
        <motion.polygon
          points={path}
          fill="var(--accent)"
          fillOpacity={0.15}
          stroke="var(--accent)"
          strokeWidth={1.5}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        {validData.map((d, i) => {
          const angle = (Math.PI * 2 * i) / validData.length - Math.PI / 2;
          const x = cx + Math.cos(angle) * (radius + 18);
          const y = cy + Math.sin(angle) * (radius + 18);
          return (
            <text
              key={`${d.label}-${i}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current text-[10px] uppercase tracking-widest"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ---------- AI Directions ----------
function AiDirections({ dna }: { dna: StyleDNA | null }) {
  const [open, setOpen] = useState<SurfaceKey | null>(null);
  const [seedOffset, setSeedOffset] = useState(0);
  const [directions, setDirections] = useState<CreativeDirection[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRefineId, setActiveRefineId] = useState<string | null>(null);
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);

  const fetchDirections = useServerFn(generateAiDirectionsFn);
  const refineDirection = useServerFn(refineAiDirectionFn);

  const loadDirections = useCallback(
    async (surfaceKey: SurfaceKey, offset: number) => {
      if (!dna) return;
      setLoading(true);
      try {
        const surfaceObj = SURFACES.find((s) => s.key === surfaceKey);
        const res = await fetchDirections({
          data: {
            surface: surfaceKey,
            surfaceTitle: surfaceObj?.title || surfaceKey,
            dna,
            seedOffset: offset,
          },
        });
        if (Array.isArray(res)) {
          setDirections(res);
        }
      } catch (err) {
        console.error("Failed to generate directions:", err);
        toast.error("Failed to generate directions. Please retry.");
      } finally {
        setLoading(false);
      }
    },
    [dna, fetchDirections],
  );

  useEffect(() => {
    if (open && dna) {
      loadDirections(open, seedOffset);
    }
  }, [open, dna, seedOffset, loadDirections]);

  const handleRefine = async (dir: CreativeDirection) => {
    if (!refineText.trim() || !dna) return;
    setRefining(true);
    try {
      const updated = await refineDirection({
        data: {
          direction: dir,
          refinementPrompt: refineText.trim(),
          dna,
        },
      });
      if (updated && updated.id) {
        setDirections((prev) => prev.map((d) => (d.id === dir.id ? updated : d)));
        setActiveRefineId(null);
        setRefineText("");
        toast.success("Direction refined with your Style DNA");
      }
    } catch {
      toast.error("Refinement failed. Please retry.");
    } finally {
      setRefining(false);
    }
  };

  return (
    <section className="px-6 pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <EyebrowLabel>AI Directions</EyebrowLabel>
            <h2 className="mt-2 font-display text-4xl italic md:text-5xl">Ten ideas per surface</h2>
          </div>
          <p className="hidden max-w-sm text-sm text-muted-foreground md:block">
            Tap a surface to generate 10 distinct direction concepts derived directly from your
            Style DNA.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setOpen(s.key);
                setSeedOffset(0);
              }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-left transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <EyebrowLabel>{s.eyebrow}</EyebrowLabel>
              <h3 className="mt-3 font-display text-3xl italic">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate 10 bespoke concepts tuned to your DNA.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-accent">
                Generate{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-end bg-ink/40 backdrop-blur-sm sm:place-items-center"
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-t-3xl border border-border bg-background sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-border p-6">
                <div>
                  <EyebrowLabel>
                    {SURFACES.find((s) => s.key === open)?.eyebrow} · 10 Dynamic Directions
                  </EyebrowLabel>
                  <h3 className="mt-1 font-display text-3xl italic">
                    {SURFACES.find((s) => s.key === open)?.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSeedOffset((prev) => prev + 1)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-bone disabled:opacity-50"
                  >
                    <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                    Regenerate
                  </button>
                  <button
                    onClick={() => setOpen(null)}
                    className="grid size-9 place-items-center rounded-full border border-border hover:bg-bone"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Loader2 className="size-8 animate-spin text-accent" />
                    <p className="mt-4 font-display text-xl italic">Reading your Style DNA…</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Generating 10 bespoke creative interpretations for this surface.
                    </p>
                  </div>
                ) : directions.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>No directions generated yet. Click Regenerate to explore ideas.</p>
                  </div>
                ) : (
                  directions.map((dir, i) => (
                    <motion.div
                      key={dir.id || i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-2xl border border-border bg-card p-6"
                    >
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                          <span className="grid size-7 place-items-center rounded-full bg-bone font-mono text-xs font-semibold text-accent">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <h4 className="font-display text-2xl italic">{dir.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] text-accent">
                            {dir.dnaAlignment}% DNA Alignment
                          </span>
                          <span className="rounded-full bg-bone px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {dir.uniqueness}% Distinct
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-foreground">{dir.concept}</p>

                      <div className="mt-4 grid gap-3 rounded-xl border border-border/80 bg-background/50 p-4 text-xs sm:grid-cols-2">
                        <div>
                          <span className="font-mono uppercase tracking-wider text-muted-foreground">
                            Composition & Geometry
                          </span>
                          <p className="mt-1 text-foreground">{dir.composition}</p>
                        </div>
                        <div>
                          <span className="font-mono uppercase tracking-wider text-muted-foreground">
                            Typography & Tone
                          </span>
                          <p className="mt-1 text-foreground">{dir.typography}</p>
                        </div>
                        <div>
                          <span className="font-mono uppercase tracking-wider text-muted-foreground">
                            Color Application
                          </span>
                          <p className="mt-1 text-foreground">{dir.colorApplication}</p>
                        </div>
                        <div>
                          <span className="font-mono uppercase tracking-wider text-muted-foreground">
                            Imagery & Texture
                          </span>
                          <p className="mt-1 text-foreground">{dir.imageryDirection}</p>
                        </div>
                      </div>

                      {dir.keyElements && dir.keyElements.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {dir.keyElements.map((el, idx) => (
                            <span
                              key={idx}
                              className="rounded-md border border-border bg-bone/60 px-2 py-0.5 text-[11px]"
                            >
                              {el}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Refinement Panel */}
                      <div className="mt-4 border-t border-border/60 pt-3">
                        {activeRefineId === dir.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                value={refineText}
                                onChange={(e) => setRefineText(e.target.value)}
                                placeholder="e.g. Make this more minimal, darker, or more experimental…"
                                className="flex-1 rounded-full border border-border bg-background px-4 py-1.5 text-xs outline-none focus:border-accent"
                              />
                              <button
                                onClick={() => handleRefine(dir)}
                                disabled={refining || !refineText.trim()}
                                className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-50"
                              >
                                {refining ? "Refining…" : "Apply"}
                              </button>
                              <button
                                onClick={() => {
                                  setActiveRefineId(null);
                                  setRefineText("");
                                }}
                                className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-bone"
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {[
                                "Make this more minimal",
                                "Make this more experimental",
                                "Make this darker",
                                "More editorial",
                              ].map((preset) => (
                                <button
                                  key={preset}
                                  onClick={() => setRefineText(preset)}
                                  className="rounded-full bg-bone px-2.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  + {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveRefineId(dir.id);
                              setRefineText("");
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-accent"
                          >
                            <Sliders className="size-3" />
                            Refine this direction…
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

// ---------- Prompt Library ----------
function PromptLibrary({ dna }: { dna: StyleDNA | null }) {
  const [activeTab, setActiveTab] = useState<"engine" | "category">("engine");
  const [activeEngine, setActiveEngine] = useState<string>("Midjourney");
  const [promptsData, setPromptsData] = useState<PromptLibraryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [seedOffset, setSeedOffset] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Custom Prompt Enhancer
  const [userIdea, setUserIdea] = useState("");
  const [enhancedResult, setEnhancedResult] = useState<{
    enhancedPrompt: string;
    explanation: string;
    dnaTokensInjected: string[];
  } | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  const fetchPromptLibrary = useServerFn(generatePromptLibraryFn);
  const enhancePrompt = useServerFn(enhanceUserPromptFn);

  const loadPrompts = useCallback(
    async (offset: number) => {
      if (!dna) return;
      setLoading(true);
      try {
        const res = await fetchPromptLibrary({
          data: { dna, seedOffset: offset },
        });
        if (res && res.enginePrompts) {
          setPromptsData(res);
        }
      } catch (err) {
        console.error("Prompt library generation error:", err);
      } finally {
        setLoading(false);
      }
    },
    [dna, fetchPromptLibrary],
  );

  useEffect(() => {
    if (dna) {
      loadPrompts(seedOffset);
    }
  }, [dna, seedOffset, loadPrompts]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Prompt copied to clipboard");
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // ignore clipboard error
    }
  };

  const handleEnhanceUserPrompt = async () => {
    if (!userIdea.trim() || !dna) return;
    setEnhancing(true);
    try {
      const res = await enhancePrompt({
        data: {
          userIdea: userIdea.trim(),
          targetEngine: activeEngine,
          dna,
        },
      });
      if (res && res.enhancedPrompt) {
        setEnhancedResult(res);
        toast.success("Idea enhanced using your Style DNA!");
      }
    } catch {
      toast.error("Failed to enhance prompt.");
    } finally {
      setEnhancing(false);
    }
  };

  const engines = promptsData
    ? Object.keys(promptsData.enginePrompts)
    : ["Midjourney", "Flux", "Stable Diffusion", "ChatGPT", "Gemini", "Claude"];

  return (
    <section className="px-6 pb-16">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <EyebrowLabel>Prompt Library</EyebrowLabel>
            <h2 className="mt-2 font-display text-4xl italic">
              Your DNA, translated for every model
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-full border border-border bg-background p-1 text-xs">
              <button
                onClick={() => setActiveTab("engine")}
                className={`rounded-full px-3 py-1 font-medium transition-colors ${
                  activeTab === "engine"
                    ? "bg-ink text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                By AI Engine
              </button>
              <button
                onClick={() => setActiveTab("category")}
                className={`rounded-full px-3 py-1 font-medium transition-colors ${
                  activeTab === "category"
                    ? "bg-ink text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                By Category
              </button>
            </div>
            <button
              onClick={() => setSeedOffset((s) => s + 1)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs hover:bg-bone disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
              Generate More
            </button>
          </div>
        </div>

        {activeTab === "engine" ? (
          <div className="mt-6">
            <div className="flex flex-wrap gap-2">
              {engines.map((e) => (
                <button
                  key={e}
                  onClick={() => setActiveEngine(e)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                    activeEngine === e
                      ? "border-ink bg-ink text-background"
                      : "border-border bg-background hover:bg-bone"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <div className="relative mt-6 rounded-2xl border border-border bg-background p-6">
              {loading ? (
                <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-accent" />
                  Calibrating model prompts to your DNA…
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {promptsData?.enginePrompts[activeEngine] || "Generating DNA-specific prompt…"}
                  </p>
                  <button
                    onClick={() =>
                      copy(promptsData?.enginePrompts[activeEngine] || "", activeEngine)
                    }
                    className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-bone"
                  >
                    {copiedKey === activeEngine ? (
                      <>
                        <Check className="size-3 text-accent" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" /> Copy
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {promptsData?.categoryPrompts.map((cp, idx) => (
              <div
                key={cp.id || idx}
                className="relative rounded-2xl border border-border bg-background p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-bone px-2 py-0.5 font-mono text-[10px] uppercase text-accent">
                    {cp.category}
                  </span>
                  <button
                    onClick={() => copy(cp.prompt, cp.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] hover:bg-bone"
                  >
                    {copiedKey === cp.id ? (
                      <Check className="size-3 text-accent" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {copiedKey === cp.id ? "Copied" : "Copy"}
                  </button>
                </div>
                <h4 className="mt-2 font-display text-lg italic">{cp.title}</h4>
                <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                  {cp.prompt}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {cp.dnaFeaturesUsed?.map((feat, fi) => (
                    <span
                      key={fi}
                      className="rounded bg-bone/70 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Prompt Enhancer */}
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-background/50 p-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent">
            <Sparkles className="size-4" /> DNA-Aware Custom Prompt Generator
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Type any creative concept and we&rsquo;ll transform it into a DNA-infused prompt for
            your target model.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={userIdea}
              onChange={(e) => setUserIdea(e.target.value)}
              placeholder="e.g. Create a campaign for a sustainable sneaker brand…"
              className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-xs outline-none focus:border-accent"
            />
            <button
              onClick={handleEnhanceUserPrompt}
              disabled={enhancing || !userIdea.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-medium text-accent-foreground shadow-glow disabled:opacity-50"
            >
              {enhancing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Wand2 className="size-3.5" />
              )}
              {enhancing ? "Enhancing…" : "Enhance with DNA"}
            </button>
          </div>

          {enhancedResult && (
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  Enhanced Creative Prompt
                </span>
                <button
                  onClick={() => copy(enhancedResult.enhancedPrompt, "custom-enhanced")}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-bone"
                >
                  {copiedKey === "custom-enhanced" ? (
                    <Check className="size-3 text-accent" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copiedKey === "custom-enhanced" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-2 font-mono text-xs leading-relaxed text-foreground">
                {enhancedResult.enhancedPrompt}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{enhancedResult.explanation}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {enhancedResult.dnaTokensInjected?.map((token, ti) => (
                  <span
                    key={ti}
                    className="rounded bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent"
                  >
                    + {token}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- Moodboard ----------
function MoodboardGenerator({ dna }: { dna: StyleDNA | null }) {
  const [board, setBoard] = useState<MoodboardCollection | null>(null);
  const [theme, setTheme] = useState("Signature Aesthetic");
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState(0);

  const fetchBoard = useServerFn(generateMoodboardFn);
  const regenItem = useServerFn(regenerateMoodboardItemFn);

  const loadBoard = useCallback(
    async (s: number, t: string) => {
      if (!dna) return;
      setLoading(true);
      try {
        const res = await fetchBoard({
          data: { dna, theme: t, seed: s },
        });
        if (res && res.items) {
          setBoard(res);
        }
      } catch (err) {
        console.error("Moodboard generation error:", err);
      } finally {
        setLoading(false);
      }
    },
    [dna, fetchBoard],
  );

  useEffect(() => {
    if (dna) {
      loadBoard(seed, theme);
    }
  }, [dna, seed, theme, loadBoard]);

  const handleRegenItem = async (item: MoodboardItem, idx: number) => {
    if (!dna) return;
    try {
      const updated = await regenItem({
        data: { item, dna, theme, variantIndex: idx + seed + 1 },
      });
      if (updated && updated.id) {
        setBoard((prev) => {
          if (!prev) return prev;
          const items = [...prev.items];
          items[idx] = updated;
          return { ...prev, items };
        });
        toast.success(`Regenerated ${item.title}`);
      }
    } catch {
      toast.error("Failed to regenerate element.");
    }
  };

  const handleSaveBoard = () => {
    if (!board) return;
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moodboard-${theme.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    toast.success("Moodboard downloaded as JSON");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <EyebrowLabel>Moodboard Generator</EyebrowLabel>
          <h3 className="mt-2 font-display text-3xl italic">A living board of your DNA</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            A dynamic visual collection: hero imagery, color swatches, typography, and textures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSeed((s) => s + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs hover:bg-bone disabled:opacity-50"
          >
            <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            Regenerate Board
          </button>
          <button
            onClick={handleSaveBoard}
            disabled={!board}
            className="grid size-8 place-items-center rounded-full border border-border bg-background hover:bg-bone"
            title="Download Board"
          >
            <Download className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {board?.items.map((item, i) => (
          <motion.div
            key={item.id || i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-sm"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-accent">
                {item.role} · {item.type}
              </span>
              <button
                onClick={() => handleRegenItem(item, i)}
                className="opacity-0 transition-opacity group-hover:opacity-100 rounded-full border border-border bg-card p-1 hover:bg-bone"
                title="Regenerate this item"
              >
                <RefreshCw className="size-2.5" />
              </button>
            </div>

            {/* Content rendering by type */}
            {item.type === "image" && item.imageUrl ? (
              <div className="mt-2 overflow-hidden rounded-xl">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ) : item.type === "color-swatch" && item.colors ? (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-4 gap-1.5">
                  {item.colors.map((c, ci) => (
                    <div key={ci} className="space-y-1">
                      <div
                        className="h-12 w-full rounded-lg border border-border/40 shadow-inner"
                        style={{ backgroundColor: c.hex }}
                      />
                      <p className="font-mono text-[9px] text-muted-foreground">{c.hex}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{item.dnaFeature}</p>
              </div>
            ) : item.type === "typography" ? (
              <div className="mt-3 rounded-xl border border-border bg-bone/40 p-4">
                <p className="font-display text-xl italic leading-snug">{item.content}</p>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">{item.subtitle}</p>
              </div>
            ) : item.type === "texture" ? (
              <div className="mt-2 space-y-2">
                {item.imageUrl && (
                  <div className="overflow-hidden rounded-xl">
                    <img src={item.imageUrl} alt={item.title} className="w-full object-cover" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{item.content}</p>
              </div>
            ) : (
              <div className="mt-2 rounded-xl bg-bone/60 p-3 text-xs leading-relaxed">
                <p className="font-medium text-foreground">{item.content}</p>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground">{item.title}</span>
              <span className="font-mono">{item.dnaFeature}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---------- Design Twins ----------
function DesignTwins({ dna }: { dna: StyleDNA | null }) {
  const [requestText, setRequestText] = useState("");
  const [consulting, setConsulting] = useState(false);
  const [twinAdvice, setTwinAdvice] = useState<DesignTwinRecommendation | null>(null);

  const askTwin = useServerFn(askDesignTwinFn);

  if (!dna) return null;
  const twins = Array.isArray(dna.twins) ? dna.twins.filter((t) => t && typeof t === "object") : [];

  const handleConsult = async () => {
    if (!requestText.trim()) return;
    setConsulting(true);
    try {
      const res = await askTwin({
        data: { request: requestText.trim(), dna },
      });
      if (res && res.creativeDirection) {
        setTwinAdvice(res);
        toast.success("Design Twin consultation ready");
      }
    } catch {
      toast.error("Consultation failed.");
    } finally {
      setConsulting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-ink p-8 text-background">
      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-soft">
          Design Twin
        </span>
        <h3 className="mt-2 font-display text-3xl italic">Your AI Creative Director</h3>
        <p className="mt-1 text-xs text-background/70">
          Trained strictly on your visual DNA, ready to direct any project or format.
        </p>

        {/* Existing Nearest System Archetypes */}
        {twins.length > 0 && (
          <ul className="mt-5 space-y-2.5">
            {twins.map((t, i) => (
              <motion.li
                key={t.name || i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-background/10 bg-background/5 p-3.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-display text-lg italic">{t.name || "Design Twin"}</span>
                  <span className="font-mono text-xs text-accent-soft">{t.match ?? 85}% match</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-background/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.match}%` }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.9 }}
                    className="h-full bg-accent"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-background/60">{t.note}</p>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Interactive Consultation Form */}
      <div className="mt-6 border-t border-background/10 pt-5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-accent-soft">
          Ask Design Twin
        </span>
        <div className="mt-2 flex gap-2">
          <input
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="e.g. Landing page for an architecture studio…"
            className="flex-1 rounded-full border border-background/20 bg-background/10 px-4 py-2 text-xs text-background placeholder:text-background/40 outline-none focus:border-accent"
          />
          <button
            onClick={handleConsult}
            disabled={consulting || !requestText.trim()}
            className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground disabled:opacity-50"
          >
            {consulting ? <Loader2 className="size-3 animate-spin" /> : "Direct"}
          </button>
        </div>

        {twinAdvice && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-2 rounded-2xl border border-background/15 bg-background/10 p-4 text-xs text-background"
          >
            <div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-accent-soft">
                Creative Direction
              </span>
              <p className="mt-0.5 font-medium">{twinAdvice.creativeDirection}</p>
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-accent-soft">
                Visual Language & Materials
              </span>
              <p className="mt-0.5 text-background/80">{twinAdvice.visualLanguage}</p>
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-accent-soft">
                Color & Layout
              </span>
              <p className="mt-0.5 text-background/80">
                {twinAdvice.color} · {twinAdvice.composition}
              </p>
            </div>
            {twinAdvice.whatToAvoid && twinAdvice.whatToAvoid.length > 0 && (
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-red-300">
                  What To Avoid
                </span>
                <p className="mt-0.5 text-background/70">{twinAdvice.whatToAvoid.join(" · ")}</p>
              </div>
            )}
            <p className="border-t border-background/10 pt-1.5 text-[11px] italic text-background/60">
              Rationale: {twinAdvice.reasoning}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ---------- DNA Match Checker ----------
function DnaMatchChecker({ dna }: { dna: StyleDNA | null }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [matchData, setMatchData] = useState<DNAMatchScoreBreakdown | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const checkMatch = useServerFn(checkDnaMatchFn);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !dna) return;
    setPreview(URL.createObjectURL(f));
    setMatchData(null);
    setScanning(true);

    try {
      // 1. Analyze genuine pixel metrics on client using real computer vision
      const metrics = await analyzeImagePixels(f, f.name);

      // 2. Server calculates authentic Euclidean/cosine similarity against active Style DNA
      const res = await checkMatch({
        data: { metrics, dna },
      });
      if (res && typeof res.overall === "number") {
        setMatchData(res);
        toast.success(`DNA Match Score: ${res.overall}%`);
      }
    } catch (err) {
      console.error("DNA match check error:", err);
      toast.error("Visual analysis failed. Please try another image.");
    } finally {
      setScanning(false);
    }
    e.target.value = "";
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <EyebrowLabel>DNA Match Checker</EyebrowLabel>
      <h3 className="mt-2 font-display text-3xl italic">Score a design against your DNA</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload any external design or screenshot. We extract raw pixel metrics and compare them
        against your active Style DNA baseline.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_1.2fr]">
        <button
          onClick={() => inputRef.current?.click()}
          className="grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-bone/40 transition-colors hover:bg-bone"
        >
          {preview ? (
            <img src={preview} alt="Uploaded design" className="size-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="size-5" />
              <span className="text-xs">Upload a design</span>
            </div>
          )}
        </button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />

        <div className="flex flex-col justify-between rounded-2xl border border-border bg-background p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Authentic Match Score
            </p>
            <div className="mt-2 font-display text-6xl italic leading-none">
              {scanning ? (
                <Loader2 className="size-10 animate-spin text-accent" />
              ) : matchData ? (
                <span className={matchData.overall > 75 ? "text-accent" : ""}>
                  {matchData.overall}%
                </span>
              ) : (
                "—"
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {!matchData
                ? "Upload a design reference to calculate true metric similarity."
                : matchData.overall > 80
                  ? "Strong alignment — reads as authentically yours across color and composition."
                  : matchData.overall > 65
                    ? "Adjacent — shares palette family but deviates in whitespace or density."
                    : "Off-brand — substantially deviates from your core density and tonal restraint."}
            </p>
          </div>

          {matchData ? (
            <div className="mt-5 space-y-2 text-xs">
              <Bar label="Color Harmony" value={matchData.color} />
              <Bar label="Composition & Space" value={matchData.composition} />
              <Bar label="Visual Density" value={matchData.density} />
              <Bar label="Contrast Hierarchy" value={matchData.contrast} />
              <Bar label="Texture Finish" value={matchData.texture} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Detailed Explanation and Actionable Recommendations */}
      {matchData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-background p-5 text-xs"
        >
          {matchData.strengths.length > 0 && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                ✓ Authentic Strengths
              </span>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {matchData.strengths.map((s, si) => (
                  <li key={si} className="flex items-center gap-1.5">
                    <span className="size-1 rounded-full bg-accent" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {matchData.recommendations.length > 0 && (
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-foreground">
                → Actionable Adjustments to Match Your DNA
              </span>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {matchData.recommendations.map((r, ri) => (
                  <li key={ri} className="flex items-center gap-1.5">
                    <span className="size-1 rounded-full bg-muted-foreground" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">{value}%</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
          className="h-full bg-ink"
        />
      </div>
    </div>
  );
}
