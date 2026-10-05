import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { EyebrowLabel } from "@/components/site/section-heading";
import { listDnaProfiles } from "@/lib/dna.functions";
import {
  Layers,
  ImageIcon,
  BookOpen,
  Wand2,
  Palette,
  FileText,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import img1 from "@/assets/inspiration-1.jpg";
import img2 from "@/assets/inspiration-2.jpg";
import img3 from "@/assets/inspiration-3.jpg";
import img4 from "@/assets/inspiration-4.jpg";
import img5 from "@/assets/inspiration-5.jpg";
import img6 from "@/assets/inspiration-6.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Palette Print" },
      {
        name: "description",
        content:
          "Your personal gallery — saved moodboards, generated images, concepts, briefs, and Style DNA extractions.",
      },
    ],
  }),
  component: GalleryPage,
});

type SavedAsset = {
  id: string;
  type: "concept" | "image" | "moodboard" | "brief" | "prompt" | "brandkit";
  title: string;
  payload: unknown;
  createdAt: number;
};

type DnaProfile = {
  id: string;
  name: string;
  style_name?: string;
  tags?: string[];
  palette?: { hexList?: string[]; primary?: { hex?: string }; accent?: { hex?: string } };
  created_at: string;
};

const FILTERS = [
  "All",
  "Images",
  "Concepts",
  "Moodboards",
  "Briefs",
  "Prompts",
  "Brand Kits",
  "Style DNAs",
];
const STATIC_IMAGES = [img1, img2, img3, img4, img5, img6, img4, img1, img3, img5, img2, img6];

const TYPE_ICON: Record<string, React.ReactNode> = {
  image: <ImageIcon className="size-4" />,
  concept: <Layers className="size-4" />,
  moodboard: <Palette className="size-4" />,
  brief: <FileText className="size-4" />,
  prompt: <Wand2 className="size-4" />,
  brandkit: <BookOpen className="size-4" />,
};

const TYPE_COLOR: Record<string, string> = {
  image: "bg-blue-500/10 text-blue-400",
  concept: "bg-violet-500/10 text-violet-400",
  moodboard: "bg-amber-500/10 text-amber-400",
  brief: "bg-green-500/10 text-green-400",
  prompt: "bg-pink-500/10 text-pink-400",
  brandkit: "bg-accent/10 text-accent",
};

function filterKey(f: string): SavedAsset["type"] | null {
  const map: Record<string, SavedAsset["type"]> = {
    Images: "image",
    Concepts: "concept",
    Moodboards: "moodboard",
    Briefs: "brief",
    Prompts: "prompt",
    "Brand Kits": "brandkit",
  };
  return map[f] ?? null;
}

function AssetCard({ asset, index }: { asset: SavedAsset; index: number }) {
  const payload = asset.payload as Record<string, unknown> | null;
  const imageUrl =
    asset.type === "image"
      ? (payload?.url as string) || (payload?.dataUrl as string) || (payload?.imageUrl as string)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.5 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-elegant"
    >
      {imageUrl ? (
        <div className="aspect-square overflow-hidden bg-bone/50">
          <img
            src={imageUrl}
            alt={asset.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center bg-bone/40 text-muted-foreground/40">
          {TYPE_ICON[asset.type]}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${TYPE_COLOR[asset.type] ?? ""}`}
          >
            {TYPE_ICON[asset.type]}
            {asset.type}
          </span>
        </div>
        <p className="line-clamp-2 text-sm font-medium leading-snug">{asset.title}</p>
        <p className="mt-auto font-mono text-[10px] text-muted-foreground">
          {new Date(asset.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </motion.div>
  );
}

function DnaCard({ profile, index }: { profile: DnaProfile; index: number }) {
  const colors =
    profile.palette?.hexList?.slice(0, 4) ||
    ([profile.palette?.primary?.hex, profile.palette?.accent?.hex].filter(Boolean) as string[]);
  const swatches = colors.length >= 2 ? colors : ["#fdfcf8", "#f5f1e9", "#cf5a3c", "#1a1918"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.5 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="flex h-28 overflow-hidden">
        {swatches.map((c, i) => (
          <div
            key={i}
            className="flex-1 transition-all duration-500 group-hover:flex-[1.2]"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="p-4">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          Style DNA
        </p>
        <p className="mt-1 font-display text-xl italic leading-tight">
          {profile.style_name || profile.name}
        </p>
        {profile.tags && profile.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {profile.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-bone px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-foreground/60"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          {new Date(profile.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </motion.div>
  );
}

function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [dnaProfiles, setDnaProfiles] = useState<DnaProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useServerFn(listDnaProfiles);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem("pp:saved-assets");
      if (raw) setAssets(JSON.parse(raw) as SavedAsset[]);
    } catch {
      /* ignore */
    }
    try {
      const profiles = await fetchProfiles();
      setDnaProfiles((profiles ?? []) as DnaProfile[]);
    } catch {
      /* silent */
    }
    setLoading(false);
  }, [fetchProfiles]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredAssets =
    activeFilter === "All"
      ? assets
      : activeFilter === "Style DNAs"
        ? []
        : assets.filter((a) => a.type === filterKey(activeFilter));

  const filteredDna = activeFilter === "All" || activeFilter === "Style DNAs" ? dnaProfiles : [];

  const totalItems = assets.length + dnaProfiles.length;
  const showStaticFallback = !loading && totalItems === 0;

  return (
    <div className="overflow-hidden">
      <section className="px-6 pb-12 pt-20">
        <div className="mx-auto max-w-7xl">
          <EyebrowLabel>Your Gallery</EyebrowLabel>
          <div className="mt-6 flex flex-col items-end justify-between gap-6 md:flex-row">
            <div>
              <h1 className="max-w-3xl font-display text-6xl italic leading-[1.05]">
                Your creative <em>archive</em>
              </h1>
              <p className="mt-3 text-muted-foreground">
                {loading
                  ? "Loading your work…"
                  : totalItems > 0
                    ? `${totalItems} item${totalItems !== 1 ? "s" : ""} saved across all sessions`
                    : "Generate work in AI Studio or extract a Style DNA to start your gallery"}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                    activeFilter === f
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background hover:bg-bone"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Loading skeleton */}
      {loading && (
        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-2xl bg-bone/60"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </section>
      )}

      {/* User content */}
      {!loading && !showStaticFallback && (
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {filteredDna.map((p, i) => (
                  <DnaCard key={p.id} profile={p} index={i} />
                ))}
                {filteredAssets.map((a, i) => (
                  <AssetCard key={a.id} asset={a} index={i + filteredDna.length} />
                ))}
              </div>
            </AnimatePresence>

            {filteredAssets.length === 0 && filteredDna.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-24 text-center">
                <p className="text-muted-foreground">No items in this category yet.</p>
                <Link
                  to="/ai-studio"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent"
                >
                  Open AI Studio <ExternalLink className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Static inspiration fallback */}
      {showStaticFallback && (
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-bone/40 px-6 py-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Inspiration Gallery
              </span>
              <p className="ml-auto text-xs text-muted-foreground">
                Your saved work appears here · Start in{" "}
                <Link to="/ai-studio" className="text-accent underline-offset-2 hover:underline">
                  AI Studio
                </Link>{" "}
                or{" "}
                <Link to="/style-dna" className="text-accent underline-offset-2 hover:underline">
                  Style DNA
                </Link>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {STATIC_IMAGES.map((src, i) => (
                <motion.figure
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.04, duration: 0.6 }}
                  className={`group relative overflow-hidden rounded-2xl border border-border ${
                    i % 5 === 0 ? "row-span-2" : ""
                  }`}
                >
                  <img
                    src={src}
                    alt="Inspiration"
                    loading="lazy"
                    className="size-full object-cover opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
                    style={{ aspectRatio: i % 5 === 0 ? "3/4" : "1/1" }}
                  />
                  <figcaption className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full bg-background/85 px-3 py-1.5 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                    <span className="font-mono text-[9px] uppercase tracking-widest">
                      Inspiration
                    </span>
                    <span className="font-display text-xs italic text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {!loading && totalItems > 0 && (
        <div className="flex justify-center pb-12">
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <RefreshCw className="size-3.5" /> Refresh gallery
          </button>
        </div>
      )}
    </div>
  );
}
