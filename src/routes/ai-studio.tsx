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
  Upload,
  Image as ImageIcon,
  Layers,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EyebrowLabel, SectionHeading } from "@/components/site/section-heading";
import { listDnaProfiles } from "@/lib/dna.functions";
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

const MAXIMALIST_DNA = {
  name: "Experimental Maximalist",
  style_name: "Experimental Maximalist",
  summary:
    "Vibrant high-contrast kinetic maximalism with saturated color collisions, bold typography, and dense spatial rhythm.",
  tags: [
    "High Energy",
    "Color Saturated",
    "Kinetic",
    "Experimental Type",
    "Dense Composition",
    "Multi-layered",
  ],
  palette: [
    { name: "Electric Cyan", hex: "#00F0FF" },
    { name: "Acid Lime", hex: "#D4FF00" },
    { name: "Hot Magenta", hex: "#FF007A" },
    { name: "Deep Cobalt", hex: "#001AFF" },
    { name: "Pure Chrome", hex: "#FFFFFF" },
    { name: "Abyssal Black", hex: "#05050A" },
  ],
  typography: { display: "Clash Display", body: "Space Grotesk" },
  mood: [
    { label: "Minimalist", value: 12 },
    { label: "Luxury", value: 45 },
    { label: "Futuristic", value: 94 },
    { label: "Creative", value: 98 },
    { label: "Professional", value: 38 },
    { label: "Experimental", value: 96 },
  ],
  fingerprint: [
    { label: "Complexity", value: 92 },
    { label: "Motion", value: 88 },
    { label: "Density", value: 90 },
    { label: "Contrast", value: 95 },
    { label: "Warmth", value: 50 },
    { label: "Ornament", value: 85 },
  ],
};

export type StudioDna = typeof DEFAULT_DNA & {
  identity?: { name: string; tagline: string; description: string; keywords: string[] };
  principles?: string[];
  doList?: string[];
  dontList?: string[];
  density?: number;
  contrast?: any;
  texture?: any;
  imagery?: any;
  confidence?: any;
  [key: string]: any;
};

function ChangeDnaModal({
  isOpen,
  onClose,
  activeDna,
  onSelectDna,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeDna: StudioDna;
  onSelectDna: (newDna: StudioDna) => void;
}) {
  const fetchProfiles = useServerFn(listDnaProfiles);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchProfiles()
      .then((data) => {
        setSavedProfiles(data || []);
      })
      .catch(() => {
        setSavedProfiles([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, fetchProfiles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="font-display text-2xl italic">Select Active Style DNA</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Every AI Studio feature will anchor its generation directly to this selected DNA.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-bone hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 max-h-[26rem] space-y-4 overflow-y-auto pr-1">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Curated Aesthetic Archetypes
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div
                onClick={() => {
                  onSelectDna(DEFAULT_DNA);
                  onClose();
                }}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  activeDna.style_name === DEFAULT_DNA.style_name
                    ? "border-accent bg-bone/70"
                    : "border-border hover:border-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg italic">{DEFAULT_DNA.name}</p>
                  {activeDna.style_name === DEFAULT_DNA.style_name && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {DEFAULT_DNA.summary}
                </p>
                <div className="mt-3 flex gap-1">
                  {DEFAULT_DNA.palette.map((p) => (
                    <div
                      key={p.hex}
                      className="size-4 rounded"
                      style={{ backgroundColor: p.hex }}
                    />
                  ))}
                </div>
              </div>

              <div
                onClick={() => {
                  onSelectDna(MAXIMALIST_DNA as any);
                  onClose();
                }}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  activeDna.style_name === MAXIMALIST_DNA.style_name
                    ? "border-accent bg-bone/70"
                    : "border-border hover:border-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg italic">{MAXIMALIST_DNA.name}</p>
                  {activeDna.style_name === MAXIMALIST_DNA.style_name && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {MAXIMALIST_DNA.summary}
                </p>
                <div className="mt-3 flex gap-1">
                  {MAXIMALIST_DNA.palette.map((p) => (
                    <div
                      key={p.hex}
                      className="size-4 rounded"
                      style={{ backgroundColor: p.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Your Saved DNA Profiles
            </p>
            {loading ? (
              <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-accent" /> Loading your profiles...
              </div>
            ) : savedProfiles.length === 0 ? (
              <p className="py-4 text-xs text-muted-foreground">
                No custom saved DNA profiles yet. Analyze references on the Style DNA page to save a
                profile.
              </p>
            ) : (
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {savedProfiles.map((p) => {
                  const name = p.name || p.style_name || "Custom DNA";
                  const hexList: string[] =
                    p.palette?.rawHexList ||
                    (Array.isArray(p.palette) ? p.palette.map((c: any) => c.hex) : []);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectDna({
                          ...DEFAULT_DNA,
                          ...p,
                          name,
                          style_name: name,
                          palette: hexList.map((hex, i) => ({ name: `Color ${i + 1}`, hex })),
                        });
                        onClose();
                      }}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        activeDna.id === p.id || activeDna.style_name === name
                          ? "border-accent bg-bone/70"
                          : "border-border hover:border-accent"
                      }`}
                    >
                      <p className="font-display text-lg italic">{name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.confidence
                          ? `${Math.round(p.confidence * 100)}% confidence`
                          : "Custom profile"}
                      </p>
                      {hexList.length > 0 && (
                        <div className="mt-3 flex gap-1">
                          {hexList.slice(0, 6).map((hex, i) => (
                            <div
                              key={i}
                              className="size-4 rounded"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [dna, setDna] = useState<StudioDna>(DEFAULT_DNA);
  const [showDnaModal, setShowDnaModal] = useState(false);
  const { assets, save, remove } = useSavedAssets();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pp:active-dna");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          setDna({
            ...DEFAULT_DNA,
            ...parsed,
            name: parsed.identity?.name || parsed.name || DEFAULT_DNA.name,
            style_name:
              parsed.identity?.name || parsed.style_name || parsed.name || DEFAULT_DNA.style_name,
            summary: parsed.identity?.description || parsed.summary || DEFAULT_DNA.summary,
            tags: parsed.identity?.keywords || parsed.tags || DEFAULT_DNA.tags,
            palette: parsed.palette?.rawHexList
              ? parsed.palette.rawHexList.map((hex: string, i: number) => ({
                  name: `Color ${i + 1}`,
                  hex,
                }))
              : Array.isArray(parsed.palette)
                ? parsed.palette
                : DEFAULT_DNA.palette,
            mood: Array.isArray(parsed.mood)
              ? parsed.mood
              : Object.entries(parsed.mood || {}).map(([label, val]) => ({
                  label: label.charAt(0).toUpperCase() + label.slice(1),
                  value: Math.round((Number(val) || 0.5) * 100),
                })),
            fingerprint: parsed.fingerprint || DEFAULT_DNA.fingerprint,
          });
        }
      }
    } catch {}
  }, []);

  const handleSelectDna = (newDna: StudioDna) => {
    setDna(newDna);
    try {
      localStorage.setItem("pp:active-dna", JSON.stringify(newDna));
    } catch {}
    toast.success(`Active DNA switched to "${newDna.style_name}"`);
  };

  return (
    <div className="overflow-hidden">
      {/* Hero */}
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
            <button
              onClick={() => setShowDnaModal(true)}
              className="inline-flex items-center gap-1 rounded-full border border-accent bg-accent/10 px-3 py-1 font-medium text-accent hover:bg-accent hover:text-accent-foreground transition-all"
            >
              <RefreshCw className="size-3" />
              Change DNA
            </button>
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

      <ChangeDnaModal
        isOpen={showDnaModal}
        onClose={() => setShowDnaModal(false)}
        activeDna={dna}
        onSelectDna={handleSelectDna}
      />

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
  dna: StudioDna;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [active, setActive] = useState<SurfaceKey | null>(null);
  const [userContext, setUserContext] = useState("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Concept | null>(null);
  const gen = useServerFn(generateConcepts);

  const load = async (surface: SurfaceKey) => {
    setActive(surface);
    setConcepts([]);
    setLoading(true);
    try {
      const res: any = await gen({
        data: { dna, surface, count: 10, userContext: userContext.trim() || undefined },
      });
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
          description="Pick a surface. We'll generate ten unique creative concepts anchored to your Style DNA and your custom project request."
        />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <input
            value={userContext}
            onChange={(e) => setUserContext(e.target.value)}
            placeholder="Optional project request / theme (e.g. 'Luxury architecture website' or 'Playful music festival')..."
            className="w-full max-w-xl rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
function DnaChat({ dna }: { dna: StudioDna }) {
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
    "Make more minimal",
    "Make more experimental",
    "Make more premium",
    "Make darker",
    "Critique my current layout",
    "Generate creative prompt",
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
  dna: StudioDna;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [images, setImages] = useState<Record<number, { url: string; final: boolean }>>({});
  const [busy, setBusy] = useState(false);
  const [renderingAll, setRenderingAll] = useState(false);
  const [theme, setTheme] = useState("");
  const gen = useServerFn(generateMoodboardPrompts);

  const renderTile = async (i: number, promptList = prompts) => {
    if (images[i] || !promptList[i]) return;
    try {
      await streamImage(
        promptList[i],
        (url, final) => {
          setImages((prev) => ({ ...prev, [i]: { url, final } }));
        },
        undefined,
        dna,
        i,
      );
    } catch (e: any) {
      toast.error(e.message ?? "Image failed");
    }
  };

  const renderAllTiles = async (promptList = prompts) => {
    if (promptList.length === 0) return;
    setRenderingAll(true);
    // Batch in concurrent chunks of 3 for fast responsive streaming
    for (let i = 0; i < promptList.length; i += 3) {
      const batch = [i, i + 1, i + 2].filter((idx) => idx < promptList.length);
      await Promise.all(
        batch.map(async (idx) => {
          try {
            await streamImage(
              promptList[idx],
              (url, final) => {
                setImages((prev) => ({ ...prev, [idx]: { url, final } }));
              },
              undefined,
              dna,
              idx,
            );
          } catch (err) {
            console.warn(`Tile ${idx} render error:`, err);
          }
        }),
      );
    }
    setRenderingAll(false);
  };

  const build = async () => {
    setBusy(true);
    setImages({});
    try {
      const res: any = await gen({ data: { dna, theme } });
      const list = (res?.prompts as string[]) ?? [];
      setPrompts(list);
      if (list.length > 0) {
        toast.success("18 directions synthesized. Rendering living moodboard...");
        renderAllTiles(list);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  const renderedCount = Object.keys(images).length;

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
          description="Eighteen distinctive visual directions extracted from your DNA. Each tile features a bespoke museum-grade composition."
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
                onClick={() => renderAllTiles()}
                disabled={renderingAll}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-medium hover:border-accent disabled:opacity-50"
              >
                {renderingAll ? (
                  <Loader2 className="size-3.5 animate-spin text-accent" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                {renderingAll
                  ? `Rendering (${renderedCount}/18)...`
                  : renderedCount < 18
                    ? `Render All (${renderedCount}/18)`
                    : "Re-render All 18"}
              </button>
              <button
                onClick={() => downloadJSON("moodboard.json", { prompts, images })}
                className="rounded-full border border-border bg-background px-4 py-2.5 text-xs font-medium hover:border-accent"
              >
                Export
              </button>
              <button
                onClick={() =>
                  onSave({
                    type: "moodboard",
                    title: theme || `${dna.style_name || "Style DNA"} Moodboard`,
                    payload: { prompts, images, theme, count: prompts.length },
                  })
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
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:border-accent hover:shadow-md"
              >
                {images[i] ? (
                  <div className="relative h-full w-full">
                    <img
                      src={images[i].url}
                      alt={p}
                      className={`h-full w-full object-cover transition-all duration-700 ${
                        images[i].final ? "scale-100 blur-0" : "scale-105 blur-sm"
                      }`}
                    />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-semibold">
                        Direction {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="mt-0.5 line-clamp-2 font-serif text-[10px] italic text-white/95">
                        {p}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-between bg-bone/40 p-3 transition-colors group-hover:bg-bone/70">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-accent font-bold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Wand2 className="size-3 text-muted-foreground opacity-60 transition-colors group-hover:text-accent group-hover:opacity-100" />
                    </div>
                    <p className="line-clamp-3 font-serif text-[11px] italic leading-tight text-foreground/80">
                      {p}
                    </p>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                      Click to render
                    </span>
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
  dna: StudioDna;
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
  dna: StudioDna;
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
  dna: StudioDna;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("instagram");
  const [campaign, setCampaign] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generateSocialContent);

  const run = async () => {
    setBusy(true);
    try {
      const res: any = await gen({
        data: { dna, platform, campaign: campaign.trim() || undefined },
      });
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
          description="Generate 10 post directions tailored for your target platform and campaign theme."
        />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="Optional campaign theme (e.g. 'Minimalist spring drop' or 'Thought leadership series')..."
            className="w-full max-w-lg rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
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
            {busy ? "Generating..." : "Generate 10"}
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
function CritiqueTool({ dna }: { dna: StudioDna }) {
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gen = useServerFn(critiqueDesign);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Please select an image under 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const run = async () => {
    if (!desc.trim() && !image) {
      toast.error("Upload a design image or describe your design to critique.");
      return;
    }
    setBusy(true);
    try {
      const res: any = await gen({
        data: { dna, description: desc.trim(), image: image ?? undefined },
      });
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
              DNA <em>Match Checker & Vision Critique</em>
            </>
          }
          description="Upload an actual design image or paste details. We'll score and critique how well it honors your Style DNA."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,1.2fr]">
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {image ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-bone">
                <img src={image} alt="Uploaded design" className="h-full w-full object-cover" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute right-3 top-3 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center transition-all hover:border-accent hover:bg-bone/40"
              >
                <Upload className="size-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Upload design image for Vision analysis</p>
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
              </div>
            )}

            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="Optional notes: colors, typography, spacing, layout, mood, intended audience…"
              className="w-full rounded-2xl border border-border bg-background p-4 text-sm focus:border-accent focus:outline-none"
            />
            <button
              onClick={run}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {busy ? "Auditing with Gemini Vision..." : "Score against my DNA"}
            </button>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8">
            {result ? (
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    DNA Match Score
                  </p>
                  {result.dnaAlignmentNotes && (
                    <span className="rounded-full bg-bone px-3 py-0.5 text-xs text-muted-foreground">
                      Audited
                    </span>
                  )}
                </div>
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

                {result.strengths && result.strengths.length > 0 && (
                  <div className="mt-6">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Strengths & Alignments
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/80">
                      {(result.strengths as string[]).map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.gaps && result.gaps.length > 0 && (
                  <div className="mt-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Gaps & Misalignments
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/80">
                      {(result.gaps as string[]).map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.suggestions && (
                  <div className="mt-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Actionable Improvements
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/80">
                      {(result.suggestions as string[]).map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upload a design image or paste your design details to audit against your active
                Style DNA.
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
  dna: StudioDna;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [type, setType] = useState<(typeof SITE_TYPES)[number]>("saas");
  const [description, setDescription] = useState("");
  const [site, setSite] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generateWebsiteSections);

  const run = async () => {
    setBusy(true);
    try {
      const res = await gen({
        data: { dna, website_type: type, description: description.trim() || undefined },
      });
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
          description="Pick a type and provide details. We'll generate hero, features, testimonials, CTA and footer aligned with your DNA."
        />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project or brand (e.g. 'An architectural lighting studio')..."
            className="w-full max-w-lg rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
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
            {busy ? "Generating site..." : "Generate site"}
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
  dna: StudioDna;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [brief, setBrief] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generateBrief);

  const run = async (kind: string) => {
    setActive(kind);
    setBusy(true);
    setBrief(null);
    try {
      const res = await gen({
        data: { dna, kind, context: context.trim() || undefined },
      });
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
          description="Synthesize comprehensive strategic and design briefs anchored directly to your Style DNA."
        />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Optional project context or requirements (e.g. 'Fintech series A launch' or 'Flagship store identity')..."
            className="w-full max-w-lg rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
  dna: StudioDna;
  onSave: (a: Omit<SavedAsset, "id" | "createdAt">) => void;
}) {
  const [target, setTarget] = useState<(typeof PROMPT_TARGETS)[number]>("Midjourney");
  const [userGoal, setUserGoal] = useState("");
  const [prompts, setPrompts] = useState<{ tag: string; text: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generatePrompts);

  const run = async () => {
    setBusy(true);
    try {
      const res: any = await gen({
        data: { dna, target, userGoal: userGoal.trim() || undefined },
      });
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
          description="Synthesize tool-specific prompts that rigorously encode your palette, typography, and composition."
        />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <input
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            placeholder="Optional specific creative goal (e.g. 'Tactile editorial perfume bottle' or 'Landing page hero component')..."
            className="w-full max-w-lg rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
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
            {busy ? "Generating prompts..." : "Generate"}
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
      await create({ data: { name: name.trim(), kind: "ai-studio", metadata: {} } });
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
// ============================================================
// SECTION 14 — My Assets (saved locally with rich viewer)
// ============================================================
function MyAssets({ assets, onRemove }: { assets: SavedAsset[]; onRemove: (id: string) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<SavedAsset | null>(null);

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
          description="Everything you save across AI Studio is stored here in full detail. Click any card to inspect, copy, or export the full content."
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
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => {
              const p = a.payload as any;
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAsset(a)}
                  className="group relative cursor-pointer rounded-2xl border border-border bg-background p-5 transition-all hover:border-accent hover:shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-semibold">
                        {a.type}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(a.id);
                        }}
                        className="text-muted-foreground hover:text-destructive p-1"
                        title="Delete saved asset"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <p className="mt-2.5 font-display text-lg italic text-foreground group-hover:text-accent transition-colors">
                      {a.title}
                    </p>

                    {/* Rich preview depending on type */}
                    {a.type === "image" && p?.dataUrl && (
                      <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl bg-bone">
                        <img
                          src={p.dataUrl}
                          alt={a.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    {a.type === "concept" && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {p?.description || p?.direction || "Creative direction concept"}
                      </p>
                    )}

                    {a.type === "prompt" && (
                      <div className="mt-2.5 rounded-lg bg-bone/60 p-2.5 font-mono text-[11px] text-foreground/80 line-clamp-2 border border-border/60">
                        {p?.text || "Prompt text"}
                      </div>
                    )}

                    {a.type === "brief" && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {p?.summary || p?.hero?.subhead || "Comprehensive creative and technical brief"}
                      </p>
                    )}

                    {a.type === "brandkit" && Array.isArray(p?.palette) && (
                      <div className="mt-3 flex gap-1.5">
                        {p.palette.slice(0, 5).map((col: any, idx: number) => (
                          <div
                            key={idx}
                            className="size-5 rounded-md border border-black/10 shadow-xs"
                            style={{ backgroundColor: col.hex }}
                            title={col.name || col.hex}
                          />
                        ))}
                      </div>
                    )}

                    {a.type === "moodboard" && (
                      <p className="mt-2 text-xs text-muted-foreground font-mono">
                        {Array.isArray(p?.prompts)
                          ? `${p.prompts.length} visual directions`
                          : "Curated moodboard"}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                    <span className="text-xs text-accent font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View content →
                    </span>
                  </div>
                </div>
              );
            })}
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

      {/* Full Content Inspection Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onRemove={onRemove}
      />
    </section>
  );
}

function AssetDetailModal({
  asset,
  onClose,
  onRemove,
}: {
  asset: SavedAsset | null;
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  if (!asset) return null;
  const p = asset.payload as any;

  const copyPayload = () => {
    let text = "";
    if (asset.type === "prompt") text = p.text || "";
    else if (asset.type === "concept")
      text = `${p.name || asset.title}\n\nDescription: ${p.description || ""}\n\nDirection: ${p.direction || ""}\n\nDNA Alignment: ${p.style_explanation || ""}\n\nPrompt: ${p.prompt || ""}`;
    else if (asset.type === "brief")
      text = p.summary
        ? `${asset.title}\n\n${p.summary}\n\n${Array.isArray(p.sections) ? p.sections.map((s: any) => `${s.heading}:\n${s.content}`).join("\n\n") : ""}`
        : JSON.stringify(p, null, 2);
    else text = JSON.stringify(p, null, 2);
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-background p-6 sm:p-8 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-semibold">
                Saved {asset.type}
              </span>
              <h3 className="mt-1 font-display text-2xl sm:text-3xl italic">{asset.title}</h3>
              <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                Saved on {new Date(asset.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-bone hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {asset.type === "concept" && (
              <div className="space-y-4">
                {p.description && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Description
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{p.description}</p>
                  </div>
                )}
                {p.direction && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Art Direction
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{p.direction}</p>
                  </div>
                )}
                {p.style_explanation && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      DNA Alignment
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{p.style_explanation}</p>
                  </div>
                )}
                {p.prompt && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Image Generation Prompt
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(p.prompt);
                          toast.success("Prompt copied");
                        }}
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <Copy className="size-3" /> Copy Prompt
                      </button>
                    </div>
                    <div className="rounded-xl bg-bone/70 p-4 font-mono text-xs text-foreground/90 border border-border">
                      {p.prompt}
                    </div>
                  </div>
                )}
              </div>
            )}

            {asset.type === "prompt" && (
              <div className="space-y-4">
                <div>
                  <span className="rounded-full bg-accent/15 px-3 py-1 font-mono text-[11px] font-medium text-accent">
                    Target: {p.tag || "Universal"}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Full Prompt
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(p.text);
                        toast.success("Prompt copied to clipboard");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                    >
                      <Copy className="size-3" /> Copy Prompt
                    </button>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-5 font-mono text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {p.text}
                  </div>
                </div>
              </div>
            )}

            {asset.type === "brief" && (
              <div className="space-y-6">
                {p.summary && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Summary
                    </p>
                    <p className="mt-1.5 text-sm italic text-foreground/90">{p.summary}</p>
                  </div>
                )}
                {Array.isArray(p.sections) && p.sections.length > 0 ? (
                  <div className="space-y-4">
                    {p.sections.map((s: any, idx: number) => (
                      <div key={idx} className="rounded-2xl border border-border bg-card p-5">
                        <p className="font-display text-lg italic text-foreground">{s.heading}</p>
                        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                          {s.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : p.hero ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <span className="font-mono text-[10px] uppercase text-accent font-semibold">Hero Section</span>
                      <p className="mt-1 font-display text-xl italic">{p.hero.headline}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{p.hero.subhead}</p>
                      {p.hero.cta && <p className="mt-2 font-mono text-[11px] text-accent">CTA: {p.hero.cta}</p>}
                      {p.hero.visual && (
                        <p className="mt-2 text-xs text-foreground/80 bg-bone/60 p-2.5 rounded-lg">
                          <strong>Art Direction:</strong> {p.hero.visual}
                        </p>
                      )}
                    </div>
                    {Array.isArray(p.features) && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {p.features.map((f: any, i: number) => (
                          <div key={i} className="rounded-xl border border-border bg-card p-4">
                            <p className="text-sm font-semibold">{f.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{f.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {p.cta && (
                      <div className="rounded-xl border border-border bg-card p-4">
                        <span className="font-mono text-[10px] uppercase text-accent font-semibold">Call to Action</span>
                        <p className="mt-1 font-display text-lg italic">{p.cta.headline}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{p.cta.body}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {asset.type === "brandkit" && (
              <div className="space-y-6">
                {p.summary && (
                  <p className="text-sm text-foreground/80 leading-relaxed italic">{p.summary}</p>
                )}
                {Array.isArray(p.palette) && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                      Harmonic Palette
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {p.palette.map((c: any, i: number) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-3 text-center">
                          <div className="h-10 w-full rounded-lg shadow-inner" style={{ backgroundColor: c.hex }} />
                          <p className="mt-2 text-xs font-semibold truncate">{c.name || `Tone ${i + 1}`}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{c.hex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {p.typography && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">Display Font</span>
                      <p className="mt-1 font-display text-lg italic">{p.typography.display || "Serif"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">Body Font</span>
                      <p className="mt-1 font-sans text-sm font-medium">{p.typography.body || "Sans-serif"}</p>
                    </div>
                  </div>
                )}
                {Array.isArray(p.surface_recommendations) && p.surface_recommendations.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                      Surface Recommendations
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-foreground/85">
                      {p.surface_recommendations.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {asset.type === "moodboard" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    18 Visual Directions
                  </p>
                  <button
                    onClick={() => {
                      const all = Array.isArray(p.prompts) ? p.prompts.join("\n\n") : "";
                      navigator.clipboard.writeText(all);
                      toast.success("All 18 prompts copied");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                  >
                    <Copy className="size-3" /> Copy All 18
                  </button>
                </div>
                {p.images && Object.keys(p.images).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {Object.entries(p.images).map(([k, imgData]: [string, any]) => (
                      <div key={k} className="aspect-square overflow-hidden rounded-lg border border-border">
                        <img src={imgData.url} alt={`Tile ${k}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {Array.isArray(p.prompts) &&
                    p.prompts.map((pm: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-xs">
                        <span className="font-mono text-accent font-semibold">{String(i + 1).padStart(2, "0")}</span>
                        <p className="flex-1 text-foreground/90 italic font-serif">{pm}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(pm);
                            toast.success(`Prompt ${i + 1} copied`);
                          }}
                          className="text-muted-foreground hover:text-accent"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {asset.type === "image" && p?.dataUrl && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border bg-black/10 flex items-center justify-center p-2">
                  <img src={p.dataUrl} alt={asset.title} className="max-h-[50vh] w-auto object-contain rounded-xl" />
                </div>
                {p.concept?.prompt && (
                  <div>
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">Original Prompt</p>
                    <p className="mt-1 text-xs text-foreground/80 bg-bone/70 p-3 rounded-xl border border-border font-mono">
                      {p.concept.prompt}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div className="flex gap-2">
              <button
                onClick={copyPayload}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:border-accent"
              >
                <Copy className="size-3.5" /> Copy Content
              </button>
              <button
                onClick={() => downloadJSON(`${asset.title.replace(/\s+/g, "_")}.json`, asset)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:border-accent"
              >
                <Download className="size-3.5" /> Export JSON
              </button>
            </div>
            <button
              onClick={() => {
                onRemove(asset.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
