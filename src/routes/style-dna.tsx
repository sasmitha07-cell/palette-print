import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
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
          "Upload 10 inspiration images and watch Palette Print extract your unique Style DNA in real time.",
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

function StyleDnaStudio() {
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done">("idle");
  const [stageIdx, setStageIdx] = useState(0);

  const addSample = useCallback(() => {
    setImages((prev) => {
      if (prev.length >= 10) return prev;
      return [...prev, SEEDS[prev.length]];
    });
  }, []);

  const fillAll = useCallback(() => {
    setImages(SEEDS.slice(0, 10));
  }, []);

  const remove = useCallback((i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const analyze = useCallback(() => {
    if (images.length !== 10) return;
    setStatus("analyzing");
    setStageIdx(0);
    let s = 0;
    const timer = setInterval(() => {
      s += 1;
      if (s >= STAGES.length) {
        clearInterval(timer);
        setStatus("done");
      } else {
        setStageIdx(s);
      }
    }, 700);
  }, [images.length]);

  const reset = useCallback(() => {
    setImages([]);
    setStatus("idle");
    setStageIdx(0);
  }, []);

  return (
    <div className="overflow-hidden">
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
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Inspiration Grid
              </span>
              <span className="font-mono text-sm">
                <span className="text-accent">{images.length}</span>
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
                    className={`group relative aspect-square overflow-hidden rounded-2xl border ${
                      src ? "border-border" : "border-dashed border-border/70"
                    }`}
                  >
                    {src ? (
                      <>
                        <img
                          src={src}
                          alt={`Reference ${i + 1}`}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                        <button
                          onClick={() => remove(i)}
                          className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-background/85 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                          aria-label="Remove image"
                        >
                          <X className="size-3" />
                        </button>
                        <span className="absolute bottom-2 left-2 rounded-full bg-background/85 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest backdrop-blur">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </>
                    ) : (
                      <button
                        onClick={addSample}
                        className="grid size-full place-items-center bg-bone/40 transition-colors hover:bg-bone"
                      >
                        <Upload className="size-4 text-muted-foreground" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">
                Drag & drop images, or use the sample set to preview the analysis.
              </p>
              <button
                onClick={analyze}
                disabled={images.length !== 10 || status === "analyzing"}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-glow transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "analyzing" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {status === "analyzing" ? "Analyzing…" : "Extract Style DNA"}
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
                const complete =
                  status === "done" || (status === "analyzing" && i < stageIdx);
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

      <AnimatePresence>
        {status === "done" ? (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="px-6 pb-24"
          >
            <div className="mx-auto max-w-6xl rounded-[32px] border border-border bg-bone/50 p-10">
              <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
                <div>
                  <EyebrowLabel>Your Style DNA</EyebrowLabel>
                  <h2 className="mt-3 font-display text-5xl italic leading-none">
                    Editorial Modernist
                  </h2>
                  <p className="mt-4 text-muted-foreground text-pretty">
                    Warm, structural, editorial. You favor negative space,
                    high-contrast typography, and warm neutral palettes accented
                    with terracotta earth tones.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["Serif Heavy", "Warm Neutral", "Asymmetric", "Tactile"].map(
                      (t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs"
                        >
                          {t}
                        </span>
                      ),
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {["#fdfcf8", "#f5f1e9", "#cf5a3c", "#7a8b6f", "#1a1918"].map(
                    (c) => (
                      <div key={c}>
                        <div
                          className="aspect-square rounded-2xl border border-border"
                          style={{ backgroundColor: c }}
                        />
                        <p className="mt-2 font-mono text-[9px] text-muted-foreground">
                          {c}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
