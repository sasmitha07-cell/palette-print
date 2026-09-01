import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { generateStyleDNA, type StyleDNA } from "@/lib/style-dna-engine";
import { fileToBase64 } from "@/lib/file-to-base64";
import { analyzeImage } from "@/lib/vision-analysis";
import {
  ArrowRight,
  Check,
  GripVertical,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Upload,
  X,
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
          "Upload 10 inspiration images, extract your Style DNA and generate palettes, moodboards, prompts and design directions.",
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
  "Image Understanding",
  "Color Detection",
  "Composition Analysis",
  "Typography Analysis",
  "Mood Analysis",
  "Pattern Recognition",
  "Style Clustering",
  "DNA Generation",
];

// ---------- DNA (mock, derived from images) ----------
// const DNA = {
//   name: "Editorial Modernist",
//   confidence: 94,
//   theme: "Warm Editorial Minimalism",
//   personality: "Thoughtful curator with a tactile, print-first sensibility",
//   energy: "Calm · Considered · Confident",
//   tags: ["Serif Heavy", "Warm Neutral", "Asymmetric", "Tactile", "Grid Native", "Print DNA"],
//   palette: [
//     { hex: "#fdfcf8", name: "Bone" },
//     { hex: "#f5f1e9", name: "Oat" },
//     { hex: "#e2d5c0", name: "Clay" },
//     { hex: "#cf5a3c", name: "Terracotta" },
//     { hex: "#7a8b6f", name: "Sage" },
//     { hex: "#1a1918", name: "Ink" },
//   ],
//   harmony: "Split-complementary · warm dominant with sage accent",
//   gradients: [
//     "linear-gradient(135deg, #fdfcf8, #e2d5c0)",
//     "linear-gradient(135deg, #cf5a3c, #7a2f1d)",
//     "linear-gradient(135deg, #7a8b6f, #f5f1e9)",
//   ],
//   typography: {
//     display: {
//       name: "Cormorant Garamond",
//       style: "High-contrast transitional serif, italic-forward",
//     },
//     body: {
//       name: "Inter",
//       style: "Neutral geometric sans, optical sizing on for editorial rhythm",
//     },
//     pairings: [
//       "Cormorant Garamond × Inter",
//       "GT Sectra × Söhne",
//       "Tiempos Headline × Suisse Int'l",
//     ],
//   },
//   mood: [
//     { label: "Minimalist", value: 82 },
//     { label: "Luxury", value: 71 },
//     { label: "Futuristic", value: 24 },
//     { label: "Creative", value: 88 },
//     { label: "Professional", value: 76 },
//     { label: "Experimental", value: 44 },
//   ],
//   fingerprint: [
//     { label: "Complexity", value: 42 },
//     { label: "Motion", value: 30 },
//     { label: "Density", value: 55 },
//     { label: "Contrast", value: 78 },
//     { label: "Warmth", value: 86 },
//     { label: "Ornament", value: 34 },
//   ],
//   twins: [
//     { name: "Aesop", match: 92, note: "Restrained typography, tactile warmth" },
//     { name: "The New York Times Magazine", match: 88, note: "Editorial grid & italic serifs" },
//     { name: "Kinfolk", match: 84, note: "Muted palette, negative space" },
//     { name: "Are.na", match: 79, note: "Utilitarian grid, quiet UI" },
//   ],
// };

const SURFACES = [
  { key: "web", title: "Website Design", eyebrow: "Surface 01" },
  { key: "brand", title: "Branding", eyebrow: "Surface 02" },
  { key: "logo", title: "Logo Style", eyebrow: "Surface 03" },
  { key: "social", title: "Social Media", eyebrow: "Surface 04" },
  { key: "portfolio", title: "Portfolio", eyebrow: "Surface 05" },
  { key: "deck", title: "Presentations", eyebrow: "Surface 06" },
] as const;

type SurfaceKey = (typeof SURFACES)[number]["key"];

const IDEAS: Record<SurfaceKey, { name: string; description: string; rationale: string }[]> = {
  web: buildIdeas("Website", [
    [
      "Editorial Journal",
      "Long-form magazine layout with anchored serif drop caps.",
      "Mirrors your print DNA and high-contrast serif signal.",
    ],
    [
      "Curator Grid",
      "Asymmetric card grid with generous margins and italic headings.",
      "Uses your asymmetric composition score of 78%.",
    ],
    [
      "Quiet Portfolio",
      "Single-column scroll with drifting terracotta accents.",
      "Amplifies negative space, matches Calm energy profile.",
    ],
    [
      "Atelier Landing",
      "Split hero with paper texture and rotating serif quotes.",
      "Leans into your tactile / warm neutral palette.",
    ],
    [
      "Studio Ledger",
      "Table-based case studies with monospaced meta rows.",
      "Captures your grid-native tendency.",
    ],
    [
      "Refraction Home",
      "Layered translucent panels over ivory canvas.",
      "Echoes your color harmony system.",
    ],
    [
      "Slow Scroll",
      "Section-locked scroll with motion under 30%.",
      "Respects your low motion fingerprint.",
    ],
    [
      "Print Poster",
      "Poster-style hero with oversized italic word marks.",
      "Doubles down on Editorial Modernist archetype.",
    ],
    [
      "Warm Grid",
      "Tile-based directory with clay hover states.",
      "Uses split-complementary harmony you scored high on.",
    ],
    [
      "Ink Mode",
      "Dark ink variant with bone typography inversions.",
      "Extends the palette without breaking archetype.",
    ],
  ]),
  brand: buildIdeas("Branding", [
    [
      "Paper & Ink",
      "Stationery system built around uncoated stock and letterpress marks.",
      "Reinforces tactile, print-first personality.",
    ],
    [
      "Terracotta Seal",
      "Wax-seal styled logomark with warm ochre foil.",
      "Extends terracotta accent into physical touchpoints.",
    ],
    [
      "Editorial Masthead",
      "Masthead-driven identity with rotating italic subheads.",
      "Leans into your serif-heavy tag.",
    ],
    [
      "Field Notes",
      "Compact pocket collateral with grid ruled interiors.",
      "Matches grid-native + tactile scores.",
    ],
    [
      "Studio Journal",
      "Quarterly zine as the primary brand artifact.",
      "Aligns with your curator personality.",
    ],
    [
      "Museum Label",
      "Museum-tag inspired product labels & captions.",
      "Uses your restrained typographic voice.",
    ],
    [
      "Slow Motion",
      "Micro-motion identity with 400ms serif transitions.",
      "Respects your low motion fingerprint.",
    ],
    [
      "Warm Neutral System",
      "Full six-token palette across bone, oat, clay, ink.",
      "Direct expression of your color DNA.",
    ],
    [
      "Signature Italic",
      "Italic word-mark as the primary logo.",
      "Reflects your italic-forward display font.",
    ],
    [
      "Craft Certification",
      "'Made with' craft stamp for every deliverable.",
      "Communicates thoughtful curator personality.",
    ],
  ]),
  logo: buildIdeas("Logo", [
    [
      "Italic Word-mark",
      "Cormorant italic set in ink on bone ground.",
      "Direct match to your display font style.",
    ],
    [
      "Monogram Seal",
      "Two-letter monogram inside a hairline circle.",
      "Uses restrained ornament (score 34%).",
    ],
    ["Editorial Bar", "Word-mark under a full-width rule.", "Captures editorial masthead cue."],
    [
      "Terracotta Dot",
      "Ink word-mark with a single terracotta punctuation dot.",
      "Highlights accent color with minimal ornament.",
    ],
    [
      "Stacked Serif",
      "Two-line stacked serif with mixed weight.",
      "Uses high-contrast serif preference.",
    ],
    [
      "Debossed Mark",
      "Emboss-ready mark with tight kerning.",
      "Extends tactile DNA into physical media.",
    ],
    ["Grid Glyph", "Geometric glyph built on a 5×5 grid.", "Reflects grid-native tendency."],
    [
      "Manuscript Ligature",
      "Custom ligature between two initials.",
      "Craft-forward, matches curator personality.",
    ],
    [
      "Field Stamp",
      "Ink stamp with slight misregistration.",
      "Captures print-first, warm neutral feel.",
    ],
    [
      "Solar Arc",
      "Word-mark under a thin terracotta arc.",
      "Introduces subtle warmth without noise.",
    ],
  ]),
  social: buildIdeas("Social", [
    [
      "Editorial Carousel",
      "5-slide carousel with italic pull-quotes.",
      "Uses your display type on high-engagement surface.",
    ],
    [
      "Bone Grid",
      "9-tile Instagram grid alternating imagery and quotes.",
      "Grid-native + warm neutral in feed form.",
    ],
    [
      "Terracotta Story Frames",
      "Story templates with terracotta chapter tags.",
      "Consistent accent use across stories.",
    ],
    [
      "Slow Reels",
      "Reels with 24fps cuts and serif chapter cards.",
      "Respects your low motion score.",
    ],
    [
      "Field Notes Post",
      "Handwritten annotation over photography.",
      "Amplifies tactile personality.",
    ],
    [
      "Newsletter Teaser",
      "Post format teasing long-form journal entries.",
      "Points followers toward editorial hub.",
    ],
    ["Palette Drop", "Weekly palette announcement post.", "Turns your color DNA into content."],
    ["Print Preview", "Mock magazine spread posts.", "Reinforces print-first identity."],
    [
      "Quiet Announcement",
      "Text-only announcement in ink on bone.",
      "Restrained ornament, high contrast.",
    ],
    ["Studio Diary", "Behind-the-scenes weekly diary post.", "Curator personality made public."],
  ]),
  portfolio: buildIdeas("Portfolio", [
    [
      "Case Journal",
      "Each case study reads like a magazine feature.",
      "Direct match to Editorial Modernist archetype.",
    ],
    ["Index Grid", "Table-of-contents home with numbered rows.", "Uses grid-native score."],
    [
      "Frame Focus",
      "Full-bleed hero image per project.",
      "High-contrast, low-density presentation.",
    ],
    [
      "Field Notebook",
      "Sidebar of raw notes next to polished work.",
      "Curator personality on display.",
    ],
    [
      "Chapter Scroll",
      "Chaptered long-scroll with italic dividers.",
      "Uses your serif-forward display.",
    ],
    [
      "Studio Reel",
      "Motion reel gated by a quiet still frame.",
      "Respects your low motion fingerprint.",
    ],
    ["Ledger Layout", "Two-column ledger with metadata on the left.", "Editorial + grid-native."],
    [
      "Print Mode Toggle",
      "Portfolio switches to print-ready PDF view.",
      "Extends print DNA into UX.",
    ],
    [
      "Terracotta Focus",
      "Currently featured project marked in terracotta.",
      "Uses accent color as wayfinding.",
    ],
    ["Warm Archive", "Bone-tinted archive of past work.", "Uses your neutral palette."],
  ]),
  deck: buildIdeas("Deck", [
    [
      "Editorial Deck",
      "Magazine spread layouts per slide.",
      "Direct match to editorial archetype.",
    ],
    ["Ink on Bone", "Two-tone slides with italic titles.", "Uses core palette."],
    ["Grid Deck", "12-column grid with generous margins.", "Grid-native + high contrast."],
    ["Quiet Data", "Charts in ink with terracotta highlights.", "Uses accent restraint."],
    ["Chapter Slides", "Section dividers as full italic word-marks.", "Signature italic display."],
    ["Field Deck", "Handwritten annotations over screenshots.", "Tactile personality."],
    ["Slow Transitions", "300ms fade transitions only.", "Respects low motion score."],
    ["Print Handout", "Deck exports as a bound zine.", "Print DNA extension."],
    ["Warm Cover", "Clay-tinted opening slide.", "Uses secondary palette."],
    ["Signature Sign-off", "Closing slide as italic sign-off.", "Reinforces personal voice."],
  ]),
};

function buildIdeas(_prefix: string, arr: [string, string, string][]) {
  return arr.map(([name, description, rationale]) => ({ name, description, rationale }));
}

const PROMPTS = {
  Midjourney:
    "editorial modernist magazine spread, warm ivory bone palette with terracotta accent and sage undertone, italic serif headline in Cormorant Garamond, uncoated paper texture, asymmetric grid, negative space, natural daylight, --ar 3:4 --style raw --v 6",
  Flux: "an editorial modernist composition on warm bone paper, italic serif typography, terracotta and sage accents, asymmetric print layout, high contrast, tactile grain, museum lighting, 35mm film look",
  "Stable Diffusion":
    "(editorial:1.2) magazine layout, warm neutral palette #fdfcf8 #f5f1e9 #cf5a3c #7a8b6f #1a1918, italic serif display, asymmetric grid, uncoated paper, print DNA, cinematic natural light, hires, tactile",
  ChatGPT:
    "Act as an editorial art director. Using an Editorial Modernist aesthetic (warm neutral palette, italic serif display, asymmetric grid, tactile print feel), draft a [ARTIFACT] with restrained ornament and terracotta as the sole accent.",
  Gemini:
    "Design a [ARTIFACT] in the Editorial Modernist style: bone/oat/clay/ink palette with terracotta accent, Cormorant Garamond italic headings, Inter body, asymmetric 12-column grid, generous whitespace, low motion, print-first feel.",
} as const;

// ---------- Radar helpers ----------
function radarPoints(values: number[], radius: number) {
  const n = values.length;
  return values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (v / 100) * radius;
    return [Math.cos(angle) * r, Math.sin(angle) * r] as const;
  });
}

function StyleDnaStudio() {
  const [dna, setDna] = useState<StyleDNA | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done">("idle");
  const [stageIdx, setStageIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const dnaRef = useRef<HTMLDivElement | null>(null);

  const addFromFiles = useCallback((files: FileList | File[]) => {
    // const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));

    setImageFiles((prev) => {
      const room = 10 - prev.length;
      return [...prev, ...arr.slice(0, room)];
    });
    if (!arr.length) return;
    setImages((prev) => {
      const room = 10 - prev.length;
      const next = arr.slice(0, room).map((f) => URL.createObjectURL(f));
      return [...prev, ...next];
    });
  }, []);

  const addSample = useCallback(() => {
    setImages((prev) => (prev.length >= 10 ? prev : [...prev, SEEDS[prev.length]]));
  }, []);

  const fillAll = useCallback(() => setImages(SEEDS.slice(0, 10)), []);
  const remove = useCallback(
    (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i)),
    [],
  );

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
  }, []);

  // const analyze = useCallback(() => {
  //   if (images.length !== 10) return;
  //   setStatus("analyzing");
  //   setStageIdx(0);
  //   let s = 0;
  //   const timer = setInterval(() => {
  //     s += 1;
  //     if (s >= STAGES.length) {
  //       clearInterval(timer);
  //       setStatus("done");
  //     } else {
  //       setStageIdx(s);
  //     }
  //   }, 650);
  // }, [images.length]);

  const analyze = useCallback(async () => {
    if (images.length !== 10 || imageFiles.length !== 10) return;

    try {
      setStatus("analyzing");
      setStageIdx(0);

      setStageIdx(1);

      const firstFile = imageFiles[0];
      if (firstFile) {
        const base64 = await fileToBase64(firstFile);
        const result = await analyzeImage(base64, firstFile.type);
        console.log("Gemini Result:", result);
      }

      const generatedDna = await generateStyleDNA(imageFiles);

      setDna(generatedDna);

      console.log(generatedDna);

      setStageIdx(2);

      // future:
      // vision analysis

      setStageIdx(3);

      // future:
      // fingerprint generation

      setStageIdx(4);

      setStatus("done");
    } catch (error) {
      console.error(error);
      setStatus("idle");
    }
  }, [imageFiles, images.length]);
  const reset = useCallback(() => {
    setImages([]);
    setImageFiles([]);
    setDna(null);
    setStatus("idle");
    setStageIdx(0);
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
                  ? "Analyzing…"
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
              {status === "analyzing" && "Extracting patterns"}
              {status === "done" && "DNA locked"}
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
        {status === "done" ? (
          <motion.div
            ref={dnaRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Signature card */}
            <section className="px-6 pb-16">
              <div className="mx-auto max-w-6xl rounded-[32px] border border-border bg-bone/50 p-10">
                <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
                  <div>
                    <EyebrowLabel>Your Style DNA</EyebrowLabel>
                    <h2 className="mt-3 font-display text-5xl italic leading-none">{dna?.name}</h2>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${dna?.confidence}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="h-full bg-accent"
                          />
                        </div>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {dna?.confidence}% confidence
                      </span>
                    </div>
                    <dl className="mt-6 space-y-3 text-sm">
                      <MetaRow k="Primary Theme" v={dna?.theme} />
                      <MetaRow k="Creative Personality" v={dna?.personality} />
                      <MetaRow k="Energy Profile" v={dna?.energy} />
                    </dl>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {dna?.tags?.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 md:grid-cols-3 lg:grid-cols-6">
                    {dna?.palette?.map((c, i) => (
                      <motion.div
                        key={c.hex}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                      >
                        <div
                          className="aspect-square rounded-2xl border border-border"
                          style={{ backgroundColor: c.hex }}
                        />
                        <p className="mt-2 text-xs">{c.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{c.hex}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Color + Typography */}
            <section className="px-6 pb-16">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
                <Card eyebrow="Color DNA" title="Warm neutral, terracotta-led">
                  <p className="text-sm text-muted-foreground">Harmony · {dna?.harmony}</p>
                  <div className="mt-5 grid grid-cols-6 gap-1.5">
                    {dna?.palette?.map((c) => (
                      <div
                        key={c.hex}
                        className="h-14 rounded-lg border border-border"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Gradient System
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {dna?.gradients?.map((g) => (
                      <div
                        key={g}
                        className="h-16 rounded-xl border border-border"
                        style={{ backgroundImage: g }}
                      />
                    ))}
                  </div>
                </Card>

                <Card eyebrow="Typography DNA" title="Italic serif meets neutral sans">
                  <div className="rounded-2xl border border-border bg-background p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      Display · {dna?.typography?.display?.name}
                    </p>
                    <p className="mt-2 font-display text-4xl italic leading-none">
                      Discover the blueprint.
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {dna?.typography?.display?.style}
                    </p>
                  </div>
                  <div className="mt-3 rounded-2xl border border-border bg-background p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      Body · {dna?.typography?.body?.name}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
                      Set the rhythm of your platform in a neutral geometric sans — quiet enough to
                      disappear, precise enough to hold an editorial grid.
                    </p>
                  </div>
                  <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Recommended Pairings
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {dna?.typography?.pairings?.map((p) => (
                      <li key={p} className="flex items-center gap-2">
                        <span className="size-1 rounded-full bg-accent" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </section>

            {/* Mood + Fingerprint */}
            <section className="px-6 pb-16">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
                <Card eyebrow="Mood Analysis" title="How your aesthetic reads">
                  <div className="mt-4 space-y-4">
                    {dna?.mood?.map((m, i) => (
                      <div key={m.label}>
                        <div className="flex items-center justify-between text-xs">
                          <span>{m.label}</span>
                          <span className="font-mono text-muted-foreground">{m.value}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${m.value}%` }}
                            transition={{ delay: 0.15 + i * 0.08, duration: 1, ease: "easeOut" }}
                            className="h-full bg-ink"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card eyebrow="Design Fingerprint" title="Your six-axis signature">
                  <RadarChart data={dna?.fingerprint || []} />
                </Card>
              </div>
            </section>

            {/* AI Directions */}
            <AiDirections />

            {/* Prompt Library */}
            <PromptLibrary />

            {/* Moodboard + Design Twin */}
            <section className="px-6 pb-16">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.4fr_1fr]">
                <MoodboardGenerator />
                <DesignTwins dna={dna} />
              </div>
            </section>

            {/* DNA Match + Chat */}
            <section className="px-6 pb-24">
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
                <DnaMatchChecker />
                <StyleDnaChat />
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
      <dd className="max-w-xs text-right">{v ?? "—"}</dd>
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
  if (!data?.length) return null;
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;
  const rings = [0.25, 0.5, 0.75, 1];

  const points = radarPoints(
    data.map((d) => d.value),
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
        {data.map((_, i) => {
          const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
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
        {data.map((d, i) => {
          const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
          const x = cx + Math.cos(angle) * (radius + 18);
          const y = cy + Math.sin(angle) * (radius + 18);
          return (
            <text
              key={d.label}
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
function AiDirections() {
  const [open, setOpen] = useState<SurfaceKey | null>(null);

  return (
    <section className="px-6 pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <EyebrowLabel>AI Directions</EyebrowLabel>
            <h2 className="mt-2 font-display text-4xl italic md:text-5xl">Ten ideas per surface</h2>
          </div>
          <p className="hidden max-w-sm text-sm text-muted-foreground md:block">
            Tap a surface to generate ten direction concepts derived from your Style DNA.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((s) => (
            <button
              key={s.key}
              onClick={() => setOpen(s.key)}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-left transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <EyebrowLabel>{s.eyebrow}</EyebrowLabel>
              <h3 className="mt-3 font-display text-3xl italic">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate 10 directions tuned to your DNA.
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
              className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-t-3xl border border-border bg-background sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-border p-6">
                <div>
                  <EyebrowLabel>Directions</EyebrowLabel>
                  <h3 className="mt-1 font-display text-3xl italic">
                    {SURFACES.find((s) => s.key === open)?.title}
                  </h3>
                </div>
                <button
                  onClick={() => setOpen(null)}
                  className="grid size-9 place-items-center rounded-full border border-border hover:bg-bone"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="max-h-[70vh] space-y-3 overflow-y-auto p-6">
                {IDEAS[open].map((idea, i) => (
                  <motion.div
                    key={idea.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-display text-xl italic">{idea.name}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{idea.description}</p>
                        <p className="mt-2 text-xs">
                          <span className="font-mono uppercase tracking-widest text-accent">
                            Rationale ·{" "}
                          </span>
                          {idea.rationale}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

// ---------- Prompt Library ----------
function PromptLibrary() {
  const engines = Object.keys(PROMPTS) as (keyof typeof PROMPTS)[];
  const [active, setActive] = useState<keyof typeof PROMPTS>(engines[0]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMPTS[active]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

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
          <div className="flex flex-wrap gap-2">
            {engines.map((e) => (
              <button
                key={e}
                onClick={() => setActive(e)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  active === e
                    ? "border-ink bg-ink text-background"
                    : "border-border bg-background hover:bg-bone"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mt-6 rounded-2xl border border-border bg-background p-6">
          <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{PROMPTS[active]}</p>
          <button
            onClick={copy}
            className="absolute right-4 top-4 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-bone"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------- Moodboard ----------
function MoodboardGenerator() {
  const [seed, setSeed] = useState(0);
  const layout = useMemo(() => {
    const heights = [220, 300, 180, 260, 340, 200, 280, 240, 320];
    // shuffle deterministically by seed
    return heights.map((h, i) => ({
      src: SEEDS[(i + seed) % SEEDS.length],
      h,
      pad: (i * 7 + seed * 3) % 3,
    }));
  }, [seed]);

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <div className="flex items-start justify-between">
        <div>
          <EyebrowLabel>Moodboard Generator</EyebrowLabel>
          <h3 className="mt-2 font-display text-3xl italic">A living board of your DNA</h3>
        </div>
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="rounded-full border border-border bg-background px-4 py-2 text-xs hover:bg-bone"
        >
          Regenerate
        </button>
      </div>
      <div className="mt-6 columns-2 gap-3 sm:columns-3">
        {layout.map((item, i) => (
          <motion.div
            key={`${seed}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-border"
            style={{ padding: item.pad }}
          >
            <img
              src={item.src}
              alt="Moodboard reference"
              style={{ height: item.h }}
              className="w-full rounded-xl object-cover"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---------- Design Twins ----------
function DesignTwins({ dna }: { dna: StyleDNA | null }) {
  if (!dna) return null;
  return (
    <div className="rounded-3xl border border-border bg-ink p-8 text-background">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-soft">
        Design Twin
      </span>
      <h3 className="mt-2 font-display text-3xl italic">Your closest design systems</h3>
      <ul className="mt-6 space-y-3">
        {dna?.twins?.map((t, i) => (
          <motion.li
            key={t.name}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-background/10 bg-background/5 p-4"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-display text-xl italic">{t.name}</span>
              <span className="font-mono text-xs text-accent-soft">{t.match}% match</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-background/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${t.match}%` }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.9 }}
                className="h-full bg-accent"
              />
            </div>
            <p className="mt-2 text-xs text-background/70">{t.note}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

// ---------- DNA Match Checker ----------
function DnaMatchChecker() {
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setScore(null);
    setScanning(true);
    setTimeout(() => {
      // deterministic-ish score from filename length
      const s = 62 + ((f.name.length * 7) % 34);
      setScore(s);
      setScanning(false);
    }, 1400);
    e.target.value = "";
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <EyebrowLabel>DNA Match Checker</EyebrowLabel>
      <h3 className="mt-2 font-display text-3xl italic">Score a design against your DNA</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload any design and we&rsquo;ll grade how closely it aligns with your Editorial Modernist
        signature.
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
              Match Score
            </p>
            <div className="mt-2 font-display text-6xl italic leading-none">
              {scanning ? (
                <Loader2 className="size-10 animate-spin text-accent" />
              ) : score !== null ? (
                <span className={score > 75 ? "text-accent" : ""}>{score}%</span>
              ) : (
                "—"
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {score === null
                ? "Waiting for a design to compare."
                : score > 80
                  ? "Strong alignment — reads as authentically yours."
                  : score > 65
                    ? "Adjacent — shares palette but breaks your grid rhythm."
                    : "Off-brand — introduces motion & density beyond your DNA."}
            </p>
          </div>
          {score !== null ? (
            <div className="mt-5 space-y-2 text-xs">
              <Bar label="Palette" value={Math.min(100, score + 6)} />
              <Bar label="Typography" value={Math.max(20, score - 8)} />
              <Bar label="Composition" value={score} />
            </div>
          ) : null}
        </div>
      </div>
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

// ---------- Style DNA Chat ----------
type ChatMsg = { role: "user" | "assistant"; content: string };

function StyleDnaChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm your Style DNA assistant. I know you as an Editorial Modernist with a warm neutral palette and italic serif display. Ask me for layout ideas, palette variations, or brand language.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setThinking(true);
    setTimeout(() => {
      const reply = mockReply(q);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setThinking(false);
    }, 900);
  };

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border p-5">
        <div className="grid size-9 place-items-center rounded-full bg-accent/15 text-accent">
          <MessageCircle className="size-4" />
        </div>
        <div>
          <EyebrowLabel>Style DNA Chat</EyebrowLabel>
          <p className="font-display text-xl italic leading-tight">Trained on your aesthetic</p>
        </div>
      </div>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              m.role === "user" ? "ml-auto bg-ink text-background" : "bg-bone text-foreground"
            }`}
          >
            {m.content}
          </motion.div>
        ))}
        {thinking ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Consulting your DNA…
          </div>
        ) : null}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a layout, palette variant, or brand line…"
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground shadow-glow disabled:opacity-50"
          disabled={!input.trim()}
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

function mockReply(q: string) {
  const s = q.toLowerCase();
  if (s.includes("palette") || s.includes("color"))
    return "For a variant palette, try shifting terracotta (#cf5a3c) toward oxblood (#7a2f1d) and swap sage for a cooler celadon (#a8b8a2). Keep bone and ink fixed to preserve your DNA.";
  if (s.includes("layout") || s.includes("landing") || s.includes("website"))
    return "Lean on an asymmetric 12-column grid: italic Cormorant headline top-left, a quiet terracotta rule under it, then a single full-bleed image at row 2. Keep motion under 300ms.";
  if (s.includes("logo"))
    return "Set your name in Cormorant Italic, tight tracking, ink on bone, with a single terracotta punctuation dot after the last letter. It'll match your restrained-ornament fingerprint.";
  if (s.includes("brand") || s.includes("voice"))
    return "Your voice reads as a thoughtful curator: short editorial sentences, occasional italic emphasis, no exclamation marks. Signal warmth with sensory nouns (paper, ink, ochre).";
  return "Working from your Editorial Modernist DNA: keep contrast high, motion low, and let italic serif carry the emotion. Terracotta is your only accent — use it sparingly.";
}
