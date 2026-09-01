import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Copy,
  Download,
  Loader2,
  Send,
  Sparkles,
  X,
  Wand2,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EyebrowLabel, SectionHeading } from "@/components/site/section-heading";
import {
  chatWithDna,
  createProject,
  critiqueDesign,
  deleteProject,
  duplicateProject,
  generateBrandKit,
  generateBrief,
  generateConcepts,
  generateMoodboardPrompts,
  generatePrompts,
  generateRemix,
  generateSocialContent,
  generateWebsiteSections,
  listProjects,
} from "@/lib/ai-studio.functions";
import { streamImage } from "@/lib/stream-image";

export const Route = createFileRoute("/ai-studio")({
  head: () => ({
    meta: [
      { title: "AI Studio — Palette Print" },
      {
        name: "description",
        content:
          "Apply your Style DNA. Generate concepts, images, moodboards, brand kits, briefs and prompts — your AI Creative Director.",
      },
      { property: "og:title", content: "The AI Creative Studio" },
      {
        property: "og:description",
        content:
          "Apply My DNA, DNA Chat, Moodboards, Brand Kits, Critique, Website Generator and more.",
      },
    ],
  }),
  component: AiStudioPage,
});

// ---------- Default DNA (mirrors Style DNA page) ----------
const DEFAULT_DNA = {
  name: "Editorial Modernist",
  style_name: "Editorial Modernist",
  summary: "Warm editorial minimalism with tactile, print-first sensibility.",
  tags: ["Serif Heavy", "Warm Neutral", "Asymmetric", "Tactile", "Grid Native", "Print DNA"],
  palette: [
    { name: "Bone", hex: "#fdfcf8" },
    { name: "Oat", hex: "#f5f1e9" },
    { name: "Clay", hex: "#e2d5c0" },
    { name: "Terracotta", hex: "#cf5a3c" },
    { name: "Sage", hex: "#7a8b6f" },
    { name: "Ink", hex: "#1a1918" },
  ],
  typography: { display: "Cormorant Garamond", body: "Inter" },
  mood: [
    { label: "Minimalist", value: 82 },
    { label: "Luxury", value: 71 },
    { label: "Futuristic", value: 24 },
    { label: "Creative", value: 88 },
    { label: "Professional", value: 76 },
    { label: "Experimental", value: 44 },
  ],
  fingerprint: [
    { label: "Complexity", value: 42 },
    { label: "Motion", value: 30 },
    { label: "Density", value: 55 },
    { label: "Contrast", value: 78 },
    { label: "Warmth", value: 86 },
    { label: "Ornament", value: 34 },
  ],
};

const SURFACES = [
  { key: "web", title: "Website Design", eyebrow: "Surface 01" },
  { key: "brand", title: "Branding", eyebrow: "Surface 02" },
  { key: "logo", title: "Logo Design", eyebrow: "Surface 03" },
  { key: "social", title: "Social Media", eyebrow: "Surface 04" },
  { key: "portfolio", title: "Portfolio", eyebrow: "Surface 05" },
  { key: "deck", title: "Presentations", eyebrow: "Surface 06" },
] as const;
type SurfaceKey = (typeof SURFACES)[number]["key"];

type Concept = {
  name: string;
  description: string;
  direction?: string;
  style_explanation?: string;
  prompt?: string;
};

// ---------- Local saved assets (client-side stash + optional server projects) ----------
type SavedAsset = {
  id: string;
  type: "concept" | "image" | "moodboard" | "brief" | "prompt" | "brandkit";
  title: string;
  payload: unknown;
  createdAt: number;
};

function useSavedAssets() {
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pp:saved-assets");
      if (raw) setAssets(JSON.parse(raw));
    } catch {}
  }, []);
  const save = useCallback((a: Omit<SavedAsset, "id" | "createdAt">) => {
    setAssets((prev) => {
      const next = [{ ...a, id: crypto.randomUUID(), createdAt: Date.now() }, ...prev];
      localStorage.setItem("pp:saved-assets", JSON.stringify(next));
      toast.success("Saved to My Assets");
      return next;
    });
  }, []);
  const remove = useCallback((id: string) => {
    setAssets((prev) => {
      const next = prev.filter((a) => a.id !== id);
      localStorage.setItem("pp:saved-assets", JSON.stringify(next));
      return next;
    });
  }, []);
  return { assets, save, remove };
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

// ============================================================
function AiStudioPage() {
  const dna = DEFAULT_DNA;
  const { assets, save, remove } = useSavedAssets();

  return (
    <div className="overflow-hidden">
      {/* Hero (unchanged aesthetic) */}
      <section className="px-6 pb-16 pt-20">
        <div className="mx-auto max-w-6xl">
          <EyebrowLabel>AI Studio</EyebrowLabel>
          <h1 className="mt-6 max-w-4xl font-display text-6xl italic leading-[1.05]">
            Apply your DNA. <em className="text-accent">Generate everything.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Your personal AI Creative Director — anchored to your Style DNA across every surface.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-border bg-background px-3 py-1 font-mono uppercase tracking-widest text-muted-foreground">
              Active DNA
            </span>
            <span className="rounded-full bg-ink px-3 py-1 font-medium text-background">
              {dna.style_name}
            </span>
            {dna.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <ApplyMyDna dna={dna} onSave={save} />
      <DnaChat dna={dna} />
      <MoodboardGenerator dna={dna} onSave={save} />
      <StyleRemixLab dna={dna} onSave={save} />
      <BrandKitGenerator dna={dna} onSave={save} />
      <SocialGenerator dna={dna} onSave={save} />
      <CritiqueTool dna={dna} />
      <WebsiteGenerator dna={dna} onSave={save} />
      <BriefCenter dna={dna} onSave={save} />
      <PromptLibrary dna={dna} onSave={save} />
      <ProjectWorkspace />
      <MyAssets assets={assets} onRemove={remove} />
    </div>
  );
}

// ============================================================
// SECTION 1 — Apply My DNA (surfaces → concepts → images)
// ============================================================
function ApplyMyDna({
  dna,
  onSave,
}: {
  dna: typeof DEFAULT_DNA;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [active, setActive] = useState<SurfaceKey | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Concept | null>(null);
  const gen = useServerFn(generateConcepts);

  const load = async (surface: SurfaceKey) => {
    setActive(surface);
    setConcepts([]);
    setLoading(true);
    try {
      const res: any = await gen({ data: { dna, surface, count: 10 } });
      setConcepts(res?.concepts ?? []);
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Apply My DNA"
          title={
            <>
              Six surfaces, <em>ten concepts each</em>
            </>
          }
          description="Pick a surface. We'll generate ten unique creative concepts anchored to your Style DNA."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((s) => (
            <button
              key={s.key}
              onClick={() => load(s.key)}
              className={`group text-left rounded-2xl border p-6 transition-all ${
                active === s.key
                  ? "border-accent bg-bone/60"
                  : "border-border bg-card hover:border-accent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.eyebrow}
                </span>
                {loading && active === s.key ? (
                  <Loader2 className="size-4 animate-spin text-accent" />
                ) : (
                  <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-accent" />
                )}
              </div>
              <p className="mt-6 font-display text-2xl italic">{s.title}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {active === s.key && concepts.length
                  ? `${concepts.length} concepts ready`
                  : "Generate 10 concepts"}
              </p>
            </button>
          ))}
        </div>

        {active && (
          <div className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-3xl italic">
                {SURFACES.find((s) => s.key === active)?.title} concepts
              </h3>
              {concepts.length > 0 && (
                <button
                  onClick={() => downloadJSON(`concepts-${active}.json`, concepts)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:border-accent"
                >
                  <Download className="size-3.5" /> Export JSON
                </button>
              )}
            </div>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl bg-bone/60" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {concepts.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group rounded-2xl border border-border bg-background p-6"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                      Concept {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-3 font-display text-xl italic">{c.name}</p>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {c.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => setDetail(c)}
                        className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:bg-accent"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => onSave({ type: "concept", title: c.name, payload: c })}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-accent"
                      >
                        Save
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        <ConceptDetail concept={detail} onClose={() => setDetail(null)} onSave={onSave} />
      </div>
    </section>
  );
}

function ConceptDetail({
  concept,
  onClose,
  onSave,
}: {
  concept: Concept | null;
  onClose: () => void;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [img, setImg] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setImg(null);
    setIsFinal(false);
  }, [concept]);

  const generate = async () => {
    if (!concept) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setBusy(true);
    setImg(null);
    setIsFinal(false);
    try {
      const prompt =
        concept.prompt ??
        `${concept.name}: ${concept.description}. Editorial, premium, cinematic, warm neutrals, tactile texture.`;
      await streamImage(
        prompt,
        (url, final) => {
          setImg(url);
          if (final) setIsFinal(true);
        },
        ac.signal,
      );
    } catch (e: any) {
      if (e.name !== "AbortError") toast.error(e.message ?? "Image failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {concept && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-background p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Concept
                </span>
                <h3 className="mt-2 font-display text-4xl italic">{concept.name}</h3>
              </div>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-bone">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">{concept.description}</p>
                {concept.direction && (
                  <div className="mt-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Creative direction
                    </p>
                    <p className="mt-1 text-sm">{concept.direction}</p>
                  </div>
                )}
                {concept.style_explanation && (
                  <div className="mt-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Why it fits your DNA
                    </p>
                    <p className="mt-1 text-sm">{concept.style_explanation}</p>
                  </div>
                )}
                {concept.prompt && (
                  <div className="mt-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Prompt used
                    </p>
                    <p className="mt-1 rounded-lg bg-bone/60 p-3 text-xs">{concept.prompt}</p>
                  </div>
                )}
              </div>
              <div>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-bone">
                  {img ? (
                    <img
                      src={img}
                      alt={concept.name}
                      className={`h-full w-full object-cover transition-[filter] duration-500 ${
                        isFinal ? "blur-0" : "blur-2xl"
                      }`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {busy ? <Loader2 className="size-6 animate-spin" /> : "No image yet"}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={generate}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground disabled:opacity-50"
                  >
                    <Wand2 className="size-3.5" />
                    {img ? "Regenerate" : "Generate image"}
                  </button>
                  {img && isFinal && (
                    <>
                      <button
                        onClick={() => downloadDataUrl(`${concept.name}.png`, img)}
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium hover:border-accent"
                      >
                        <Download className="size-3.5" /> Download
                      </button>
                      <button
                        onClick={() =>
                          onSave({
                            type: "image",
                            title: concept.name,
                            payload: { dataUrl: img, concept },
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium hover:border-accent"
                      >
                        Save
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// SECTION 2 — DNA Chat (real AI)
// ============================================================
function DnaChat({ dna }: { dna: typeof DEFAULT_DNA }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "I'm your Style DNA. Ask me anything — homepage layouts, logo directions, animations, brand strategy. Everything I say will be anchored to your aesthetic.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const chat = useServerFn(chatWithDna);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setBusy(true);
    try {
      const res: any = await chat({
        data: { dna, messages: next.map((m) => ({ role: m.role, content: m.content })) },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e: any) {
      toast.error(e.message ?? "Chat failed");
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [
    "Suggest a homepage layout",
    "Create a logo concept",
    "Design my portfolio",
    "Suggest animations for my landing page",
  ];

  return (
    <section className="border-t border-border bg-bone/40 px-6 py-24">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr,1.2fr]">
        <div>
          <EyebrowLabel>DNA Chat</EyebrowLabel>
          <h3 className="mt-3 font-display text-4xl italic">
            Talk to your <em className="text-accent">Creative Director</em>
          </h3>
          <p className="mt-4 text-sm text-muted-foreground">
            Trained on your palette, typography, mood, and fingerprint. Every reply anchors to your
            DNA.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-accent"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-ink p-6 text-background">
          <div ref={scrollRef} className="h-80 space-y-3 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "assistant"
                    ? "bg-background/10 text-background"
                    : "ml-auto bg-accent text-accent-foreground"
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="max-w-[60%] rounded-2xl bg-background/10 px-4 py-2.5 text-sm">
                <Loader2 className="inline size-4 animate-spin" />
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask your DNA anything…"
              className="flex-1 rounded-full border border-background/15 bg-background/5 px-4 py-2.5 text-sm placeholder:text-background/40 focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => send()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              <Send className="size-3.5" /> Ask
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 4 — Moodboard Generator
// ============================================================
function MoodboardGenerator({
  dna,
  onSave,
}: {
  dna: typeof DEFAULT_DNA;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [images, setImages] = useState<Record<number, { url: string; final: boolean }>>({});
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState("");
  const gen = useServerFn(generateMoodboardPrompts);

  const build = async () => {
    setBusy(true);
    setImages({});
    try {
      const res: any = await gen({ data: { dna, theme } });
      const list = (res?.prompts as string[]) ?? [];
      setPrompts(list);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  const renderTile = async (i: number) => {
    if (images[i]) return;
    try {
      await streamImage(prompts[i], (url, final) => {
        setImages((prev) => ({ ...prev, [i]: { url, final } }));
      });
    } catch (e: any) {
      toast.error(e.message ?? "Image failed");
    }
  };

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Moodboard"
          title={
            <>
              Generate a <em>living moodboard</em>
            </>
          }
          description="Eighteen visual directions extracted from your DNA. Click any tile to render it."
        />
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Optional theme (e.g. 'launch campaign')"
            className="w-full max-w-sm rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <button
            onClick={build}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {prompts.length ? "Regenerate" : "Generate Moodboard"}
          </button>
          {prompts.length > 0 && (
            <>
              <button
                onClick={() => downloadJSON("moodboard.json", { prompts, images })}
                className="rounded-full border border-border bg-background px-4 py-2.5 text-xs font-medium hover:border-accent"
              >
                Export
              </button>
              <button
                onClick={() =>
                  onSave({ type: "moodboard", title: theme || "Moodboard", payload: { prompts } })
                }
                className="rounded-full border border-border bg-background px-4 py-2.5 text-xs font-medium hover:border-accent"
              >
                Save
              </button>
            </>
          )}
        </div>

        {prompts.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {prompts.map((p, i) => (
              <button
                key={i}
                onClick={() => renderTile(i)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-bone text-left"
              >
                {images[i] ? (
                  <img
                    src={images[i].url}
                    alt={p}
                    className={`h-full w-full object-cover transition-[filter] ${
                      images[i].final ? "blur-0" : "blur-lg"
                    }`}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-end p-3 text-[10px] leading-tight text-muted-foreground opacity-80 transition-opacity group-hover:opacity-100">
                    {p}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// SECTION 6 — Style Remix Lab (real AI)
// ============================================================
function StyleRemixLab({
  dna,
  onSave,
}: {
  dna: typeof DEFAULT_DNA;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [blend, setBlend] = useState({ editorial: 60, futuristic: 20, luxury: 20 });
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generateRemix);

  const run = async () => {
    setBusy(true);
    try {
      const res: any = await gen({ data: { dna, blend } });
      setResult(res);
    } catch (e: any) {
      toast.error(e.message ?? "Remix failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-border bg-bone/40 px-6 py-24">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-8">
          <EyebrowLabel>Style Remix Lab</EyebrowLabel>
          <h3 className="mt-3 font-display text-3xl italic">Blend aesthetic vectors</h3>
          <div className="mt-8 space-y-6">
            {(["editorial", "futuristic", "luxury"] as const).map((k) => (
              <div key={k}>
                <div className="flex justify-between text-sm capitalize">
                  <span>{k}</span>
                  <span className="font-mono text-accent">{blend[k]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={blend[k]}
                  onChange={(e) => setBlend((r) => ({ ...r, [k]: Number(e.target.value) }))}
                  className="mt-2 w-full accent-accent"
                />
              </div>
            ))}
          </div>
          <button
            onClick={run}
            disabled={busy}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate Remix DNA
          </button>
        </div>

        <div className="rounded-3xl border border-border bg-background p-8">
          <EyebrowLabel>Comparison</EyebrowLabel>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Original
              </p>
              <p className="mt-2 font-display text-xl italic">{dna.style_name}</p>
              <div className="mt-3 flex gap-1">
                {dna.palette.map((p) => (
                  <div key={p.hex} className="h-6 w-6 rounded" style={{ backgroundColor: p.hex }} />
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Remix</p>
              <p className="mt-2 font-display text-xl italic">{result?.style_name ?? "—"}</p>
              {result?.palette && (
                <div className="mt-3 flex gap-1">
                  {(result.palette as { hex: string }[]).map((p, i) => (
                    <div key={i} className="h-6 w-6 rounded" style={{ backgroundColor: p.hex }} />
                  ))}
                </div>
              )}
            </div>
          </div>
          {result && (
            <>
              <p className="mt-6 text-sm text-muted-foreground">{result.summary}</p>
              {result.surface_recommendations && (
                <ul className="mt-4 list-disc pl-5 text-sm text-foreground/80">
                  {(result.surface_recommendations as string[]).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
              <button
                onClick={() =>
                  onSave({ type: "brandkit", title: result.style_name, payload: result })
                }
                className="mt-6 rounded-full border border-border px-4 py-2 text-xs font-medium hover:border-accent"
              >
                Save remix
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 7 — Brand Kit
// ============================================================
function BrandKitGenerator({
  dna,
  onSave,
}: {
  dna: typeof DEFAULT_DNA;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState("");
  const [kit, setKit] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generateBrandKit);

  const run = async () => {
    setBusy(true);
    try {
      const res = await gen({ data: { dna, brand_name: name || undefined } });
      setKit(res);
    } catch (e: any) {
      toast.error(e.message ?? "Brand kit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Brand Kit"
          title={
            <>
              Complete <em>brand systems</em>
            </>
          }
          description="Logo direction, color system, typography, icons, illustration, photography, voice and personality."
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Brand name (optional)"
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <button
            onClick={run}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate Brand Kit
          </button>
        </div>

        {kit && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <KitCard title="Logo direction" body={kit.logo_direction} />
            <KitCard title="Icon style" body={kit.icon_style} />
            <KitCard title="Illustration" body={kit.illustration_style} />
            <KitCard title="Photography" body={kit.photography_style} />
            <KitCard title="Brand voice" body={kit.brand_voice} />
            <KitCard title="Brand personality" body={kit.brand_personality} />
            {kit.typography && (
              <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2 lg:col-span-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Typography
                </p>
                <p className="mt-2 text-sm">
                  <strong>Display:</strong> {kit.typography.display} · <strong>Body:</strong>{" "}
                  {kit.typography.body}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{kit.typography.pairing_notes}</p>
              </div>
            )}
            {kit.color_system && (
              <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2 lg:col-span-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Color system
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {(kit.color_system as any[]).map((c, i) => (
                    <div key={i} className="rounded-xl border border-border p-3">
                      <div className="h-12 w-full rounded" style={{ backgroundColor: c.hex }} />
                      <p className="mt-2 text-xs font-medium">{c.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{c.hex}</p>
                      {c.use && <p className="mt-1 text-[10px] text-muted-foreground">{c.use}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="md:col-span-2 lg:col-span-3 flex gap-2">
              <button
                onClick={() =>
                  onSave({ type: "brandkit", title: name || "Brand Kit", payload: kit })
                }
                className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:border-accent"
              >
                Save
              </button>
              <button
                onClick={() => downloadJSON(`brand-kit-${(name || "kit").toLowerCase()}.json`, kit)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:border-accent"
              >
                Export JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function KitCard({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{title}</p>
      <p className="mt-3 text-sm text-foreground/80">{body}</p>
    </div>
  );
}

// ============================================================
// SECTION 8 — Social Media Generator
// ============================================================
const PLATFORMS = ["instagram", "linkedin", "pinterest", "twitter"] as const;

function SocialGenerator({
  dna,
  onSave,
}: {
  dna: typeof DEFAULT_DNA;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("instagram");
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generateSocialContent);

  const run = async () => {
    setBusy(true);
    try {
      const res: any = await gen({ data: { dna, platform } });
      setItems(res?.concepts ?? []);
    } catch (e: any) {
      toast.error(e.message ?? "Social generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-border bg-bone/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Social Studio"
          title={
            <>
              Content <em>in your voice</em>
            </>
          }
        />
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`rounded-full px-4 py-2 text-xs font-medium capitalize ${
                platform === p
                  ? "bg-foreground text-background"
                  : "border border-border bg-background"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={run}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Generate 10
          </button>
        </div>

        {items.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((c, i) => (
              <div key={i} className="rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    {c.type ?? "Post"}
                  </span>
                  <button
                    onClick={() =>
                      onSave({ type: "concept", title: c.title ?? "Post", payload: c })
                    }
                    className="text-xs text-muted-foreground hover:text-accent"
                  >
                    Save
                  </button>
                </div>
                <p className="mt-3 font-display text-lg italic">{c.title}</p>
                {c.hook && <p className="mt-1 text-xs text-muted-foreground">{c.hook}</p>}
                <p className="mt-3 text-sm text-foreground/80">{c.description}</p>
                {c.visual_direction && (
                  <p className="mt-3 rounded-lg bg-bone/60 p-2 text-[11px]">
                    <strong>Visual:</strong> {c.visual_direction}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// SECTION 9 — Design Critique
// ============================================================
function CritiqueTool({ dna }: { dna: typeof DEFAULT_DNA }) {
  const [desc, setDesc] = useState("");
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(critiqueDesign);

  const run = async () => {
    if (desc.trim().length < 20) {
      toast.error("Describe the design in a bit more detail.");
      return;
    }
    setBusy(true);
    try {
      const res: any = await gen({ data: { dna, description: desc } });
      setResult(res);
    } catch (e: any) {
      toast.error(e.message ?? "Critique failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Design Critique"
          title={
            <>
              DNA <em>Match Checker</em>
            </>
          }
          description="Describe or paste details of a design. We'll score how well it matches your Style DNA."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,1.2fr]">
          <div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={8}
              placeholder="Describe the design: colors, typography, spacing, layout, mood, imagery…"
              className="w-full rounded-2xl border border-border bg-background p-4 text-sm focus:border-accent focus:outline-none"
            />
            <button
              onClick={run}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Score against my DNA
            </button>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8">
            {result ? (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  DNA Match
                </p>
                <p className="mt-2 font-display text-6xl italic">{result.overall}%</p>
                {result.scores && (
                  <div className="mt-6 space-y-3">
                    {Object.entries(result.scores).map(([k, v]) => (
                      <div key={k}>
                        <div className="flex justify-between text-xs capitalize">
                          <span>{k}</span>
                          <span className="font-mono text-accent">{v as number}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bone">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{ width: `${v as number}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {result.suggestions && (
                  <div className="mt-6">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Suggestions
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {(result.suggestions as string[]).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your score appears here after we compare the design against your DNA.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 10 — Website Generator
// ============================================================
const SITE_TYPES = ["saas", "startup", "portfolio", "agency", "ecommerce"] as const;

function WebsiteGenerator({
  dna,
  onSave,
}: {
  dna: typeof DEFAULT_DNA;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [type, setType] = useState<(typeof SITE_TYPES)[number]>("saas");
  const [site, setSite] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generateWebsiteSections);

  const run = async () => {
    setBusy(true);
    try {
      const res = await gen({ data: { dna, website_type: type } });
      setSite(res);
    } catch (e: any) {
      toast.error(e.message ?? "Website failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-border bg-bone/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Website Generator"
          title={
            <>
              Structure <em>a full site</em>
            </>
          }
          description="Pick a type. We'll generate hero, features, testimonials, CTA and footer aligned with your DNA."
        />
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {SITE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider ${
                type === t ? "bg-foreground text-background" : "border border-border bg-background"
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={run}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Generate site
          </button>
        </div>

        {site && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {site.hero && (
              <div className="md:col-span-2 rounded-2xl border border-border bg-background p-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Hero</p>
                <p className="mt-3 font-display text-3xl italic">{site.hero.headline}</p>
                <p className="mt-2 text-sm text-muted-foreground">{site.hero.subhead}</p>
                <p className="mt-3 text-xs">
                  <strong>CTA:</strong> {site.hero.cta} · <strong>Visual:</strong>{" "}
                  {site.hero.visual}
                </p>
              </div>
            )}
            {site.features && (
              <div className="rounded-2xl border border-border bg-background p-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Features
                </p>
                <ul className="mt-3 space-y-3">
                  {(site.features as any[]).map((f, i) => (
                    <li key={i}>
                      <p className="text-sm font-medium">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {site.testimonials && (
              <div className="rounded-2xl border border-border bg-background p-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Testimonials
                </p>
                <ul className="mt-3 space-y-3">
                  {(site.testimonials as any[]).map((t, i) => (
                    <li key={i}>
                      <p className="text-sm italic">&ldquo;{t.quote}&rdquo;</p>
                      <p className="mt-1 text-xs text-muted-foreground">— {t.author}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {site.cta && (
              <div className="rounded-2xl border border-border bg-background p-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">CTA</p>
                <p className="mt-3 font-display text-xl italic">{site.cta.headline}</p>
                <p className="mt-1 text-sm text-muted-foreground">{site.cta.body}</p>
                <p className="mt-2 text-xs">Button: {site.cta.button}</p>
              </div>
            )}
            {site.footer?.columns && (
              <div className="rounded-2xl border border-border bg-background p-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Footer
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {(site.footer.columns as any[]).map((c, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium">{c.heading}</p>
                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {(c.links as string[]).map((l, j) => (
                          <li key={j}>{l}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={() => onSave({ type: "brief", title: `${type} website`, payload: site })}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:border-accent"
              >
                Save
              </button>
              <button
                onClick={() => downloadJSON(`website-${type}.json`, site)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:border-accent"
              >
                Export JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// SECTION 11 — Brief Center
// ============================================================
const BRIEFS = [
  "Website Brief",
  "Brand Brief",
  "Logo Brief",
  "Marketing Brief",
  "Campaign Brief",
  "Portfolio Brief",
  "Mobile App Brief",
  "Startup Brief",
] as const;

function BriefCenter({
  dna,
  onSave,
}: {
  dna: typeof DEFAULT_DNA;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [brief, setBrief] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generateBrief);

  const run = async (kind: string) => {
    setActive(kind);
    setBusy(true);
    setBrief(null);
    try {
      const res = await gen({ data: { dna, kind } });
      setBrief(res);
    } catch (e: any) {
      toast.error(e.message ?? "Brief failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Creative Briefs"
          title={
            <>
              Generated briefs, <em>export-ready</em>
            </>
          }
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BRIEFS.map((b, i) => (
            <button
              key={b}
              onClick={() => run(b)}
              className={`group rounded-2xl border p-6 text-left transition-all ${
                active === b
                  ? "border-accent bg-bone/60"
                  : "border-border bg-card hover:border-accent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {busy && active === b ? (
                  <Loader2 className="size-4 animate-spin text-accent" />
                ) : (
                  <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-accent" />
                )}
              </div>
              <p className="mt-6 font-display text-2xl italic">{b}</p>
              <p className="mt-2 text-xs text-muted-foreground">PDF · DOCX export</p>
            </button>
          ))}
        </div>

        {brief && (
          <div className="mt-8 rounded-3xl border border-border bg-background p-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{active}</p>
            <h3 className="mt-2 font-display text-3xl italic">{brief.title}</h3>
            <p className="mt-3 text-sm text-muted-foreground">{brief.summary}</p>
            <div className="mt-6 space-y-4">
              {(brief.sections as any[])?.map((s, i) => (
                <div key={i}>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s.heading}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{s.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => onSave({ type: "brief", title: brief.title, payload: brief })}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:border-accent"
              >
                Save
              </button>
              <button
                onClick={() => downloadJSON(`${brief.title}.json`, brief)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:border-accent"
              >
                Export JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// SECTION 12 — Prompt Library
// ============================================================
const PROMPT_TARGETS = [
  "ChatGPT",
  "Gemini",
  "Claude",
  "Midjourney",
  "Flux",
  "Stable Diffusion",
  "Cursor",
  "V0",
  "Bolt",
] as const;

function PromptLibrary({
  dna,
  onSave,
}: {
  dna: typeof DEFAULT_DNA;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [target, setTarget] = useState<(typeof PROMPT_TARGETS)[number]>("Midjourney");
  const [prompts, setPrompts] = useState<{ tag: string; text: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generatePrompts);

  const run = async () => {
    setBusy(true);
    try {
      const res: any = await gen({ data: { dna, target } });
      setPrompts(res?.prompts ?? []);
    } catch (e: any) {
      toast.error(e.message ?? "Prompts failed");
    } finally {
      setBusy(false);
    }
  };

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("Copied");
  };

  return (
    <section className="border-t border-border bg-bone/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Prompt Library"
          title={
            <>
              Prompts tuned to <em>your voice</em>
            </>
          }
        />
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {PROMPT_TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                target === t
                  ? "bg-foreground text-background"
                  : "border border-border bg-background"
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={run}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Generate
          </button>
        </div>

        {prompts.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prompts.map((p, i) => (
              <div key={i} className="group rounded-2xl border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    {p.tag}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copy(p.text)}
                      className="text-muted-foreground hover:text-accent"
                    >
                      <Copy className="size-4" />
                    </button>
                    <button
                      onClick={() => onSave({ type: "prompt", title: p.tag, payload: p })}
                      className="text-xs text-muted-foreground hover:text-accent"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <p className="mt-4 text-sm text-foreground/80">{p.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// SECTION 5 — Project Workspace
// ============================================================
function ProjectWorkspace() {
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useServerFn(listProjects);
  const create = useServerFn(createProject);
  const del = useServerFn(deleteProject);
  const dup = useServerFn(duplicateProject);

  const refresh = useCallback(async () => {
    try {
      const rows = await list();
      setProjects(rows ?? []);
    } catch (e: any) {
      // silent — likely unauthenticated
    }
  }, [list]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await create({ data: { name: name.trim(), kind: "ai-studio", data: {} } });
      setName("");
      await refresh();
      toast.success("Project created");
    } catch (e: any) {
      toast.error(e.message ?? "Sign in to save projects");
    } finally {
      setBusy(false);
    }
  };

  const removeProject = async (id: string) => {
    try {
      await del({ data: { id } });
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  const duplicate = async (id: string) => {
    try {
      await dup({ data: { id } });
      await refresh();
      toast.success("Duplicated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Projects"
          title={
            <>
              Your <em>creative workspace</em>
            </>
          }
          description="Group concepts, moodboards, briefs and chats into named projects."
        />
        <div className="mt-8 flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name (e.g. 'Startup Website')"
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <button
            onClick={add}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground disabled:opacity-50"
          >
            <Plus className="size-3.5" /> New
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            No projects yet. Sign in and create your first project to organize your creative work.
          </p>
        ) : (
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                <p className="font-display text-xl italic">{p.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {new Date(p.updated_at).toLocaleDateString()}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => duplicate(p.id)}
                    className="rounded-full border border-border px-3 py-1.5 text-[11px] hover:border-accent"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => removeProject(p.id)}
                    className="rounded-full border border-border px-3 py-1.5 text-[11px] text-destructive hover:border-destructive"
                  >
                    <Trash2 className="mr-1 inline size-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// SECTION 14 — My Assets (saved locally)
// ============================================================
function MyAssets({ assets, onRemove }: { assets: SavedAsset[]; onRemove: (id: string) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return assets
      .filter((a) => filter === "all" || a.type === filter)
      .filter((a) => a.title.toLowerCase().includes(query.toLowerCase()));
  }, [assets, filter, query]);

  const types = ["all", "concept", "image", "moodboard", "brief", "prompt", "brandkit"];

  return (
    <section className="border-t border-border bg-bone/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="My Assets"
          title={
            <>
              Saved <em>work</em>
            </>
          }
          description="Everything you save across AI Studio is stored here in your browser."
        />
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                filter === t
                  ? "bg-foreground text-background"
                  : "border border-border bg-background"
              }`}
            >
              {t}
            </button>
          ))}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="ml-auto w-full max-w-xs rounded-full border border-border bg-background px-4 py-2 text-xs focus:border-accent focus:outline-none"
          />
          <button
            onClick={() => downloadJSON("saved-assets.json", assets)}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-accent"
          >
            <Download className="mr-1 inline size-3" /> Export
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            {assets.length === 0 ? "Nothing saved yet." : "No matches."}
          </p>
        ) : (
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    {a.type}
                  </span>
                  <button
                    onClick={() => onRemove(a.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <p className="mt-3 font-display text-lg italic">{a.title}</p>
                {a.type === "image" && (a.payload as any)?.dataUrl && (
                  <img
                    src={(a.payload as any).dataUrl}
                    alt={a.title}
                    className="mt-3 aspect-square w-full rounded-lg object-cover"
                  />
                )}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 rounded-3xl border border-border bg-card p-8">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-accent" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              AI Integration Ready
            </p>
          </div>
          <p className="mt-3 font-display text-2xl italic">Pluggable AI architecture</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Vision (Gemini · GPT · CLIP), text (Gemini · GPT · Claude) and image (Gemini · Flux ·
            Imagen) all route through a clean gateway. Swap models per surface without touching UI.
          </p>
        </div>
      </div>
    </section>
  );
}
