import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Heart, Upload, RefreshCw, ExternalLink } from "lucide-react";
import { EyebrowLabel } from "@/components/site/section-heading";
import { listDnaProfiles } from "@/lib/dna.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Palette Print" },
      {
        name: "description",
        content:
          "Browse, follow, and clone Style DNAs published by designers, studios, and creative technologists.",
      },
      { property: "og:title", content: "Style DNA Marketplace" },
      {
        property: "og:description",
        content:
          "A community-driven feed of aesthetic identities. Save, follow, and remix DNA from the world s best designers.",
      },
    ],
  }),
  component: MarketplacePage,
});

type DnaProfile = {
  id: string;
  name: string;
  style_name?: string;
  tags?: string[];
  palette?: { hexList?: string[]; primary?: { hex?: string }; accent?: { hex?: string } };
  created_at: string;
  is_favorite?: boolean;
};

// Community showcase (static fallback / supplementary)
const COMMUNITY_DNAS = [
  {
    id: "community-1",
    name: "Editorial Modernist",
    author: "Amèlie Rousseau",
    location: "Paris",
    likes: 3420,
    palette: ["#fdfcf8", "#f5f1e9", "#cf5a3c", "#1a1918"],
    tags: ["Serif", "Warm", "Asymmetric"],
  },
  {
    id: "community-2",
    name: "Neo-Scandinavian",
    author: "Ida Björk",
    location: "Copenhagen",
    likes: 2810,
    palette: ["#f4f0e8", "#dddad0", "#8b8577", "#2d2b28"],
    tags: ["Minimal", "Cool Neutral", "Grid"],
  },
  {
    id: "community-3",
    name: "Digital Artisan",
    author: "Kenji Watanabe",
    location: "Tokyo",
    likes: 4110,
    palette: ["#faf7f2", "#e0d5b7", "#a3623b", "#1c1815"],
    tags: ["Tactile", "Warm", "Sculptural"],
  },
  {
    id: "community-4",
    name: "Futuristic Minimalist",
    author: "Zara Ahmed",
    location: "Dubai",
    likes: 1980,
    palette: ["#ffffff", "#eaeef2", "#5b7cfa", "#0a0f1e"],
    tags: ["Cool", "Technical", "Sharp"],
  },
  {
    id: "community-5",
    name: "Post-Digital Craft",
    author: "Mateo Herrera",
    location: "Mexico City",
    likes: 2645,
    palette: ["#f9f1e3", "#e8b56b", "#c94838", "#2a1e18"],
    tags: ["Warm", "Playful", "Handmade"],
  },
  {
    id: "community-6",
    name: "Luxe Contemporary",
    author: "Sofia Moreau",
    location: "Milan",
    likes: 5210,
    palette: ["#f7f4ee", "#c8b294", "#5c3a2e", "#181310"],
    tags: ["Luxurious", "Refined", "Editorial"],
  },
];

function UserDnaCard({ profile, index }: { profile: DnaProfile; index: number }) {
  const colors =
    profile.palette?.hexList?.slice(0, 4) ||
    ([profile.palette?.primary?.hex, profile.palette?.accent?.hex].filter(Boolean) as string[]);
  const swatches = colors.length >= 2 ? colors : ["#fdfcf8", "#f5f1e9", "#cf5a3c", "#1a1918"];

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06, duration: 0.6 }}
      className="group flex flex-col rounded-3xl border border-accent/40 bg-card p-6 ring-1 ring-accent/20 transition-all hover:-translate-y-1 hover:shadow-elegant"
    >
      {/* "My DNA" badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-accent/10 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-accent">
          Your DNA
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {new Date(profile.created_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="flex h-32 overflow-hidden rounded-2xl">
        {swatches.map((c, i) => (
          <div
            key={i}
            className="flex-1 transition-all group-hover:flex-[1.1]"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="mt-6">
        <h3 className="font-display text-2xl italic leading-tight">
          {profile.style_name || profile.name}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">Extracted from your inspiration images</p>
      </div>

      {profile.tags && profile.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {profile.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full bg-bone px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-foreground/70"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <Link
          to="/style-dna"
          className="flex-1 rounded-full border border-border bg-background py-2.5 text-center text-xs font-medium transition-colors hover:bg-bone"
        >
          View DNA
        </Link>
        <button
          onClick={() => {
            navigator.clipboard.writeText(profile.id).catch(() => null);
            toast.success("DNA ID copied!");
          }}
          className="flex-1 rounded-full bg-foreground py-2.5 text-xs font-medium text-background transition-colors hover:bg-accent"
        >
          Share DNA
        </button>
      </div>
    </motion.article>
  );
}

function CommunityCard({ dna, index }: { dna: (typeof COMMUNITY_DNAS)[0]; index: number }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(dna.likes);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06, duration: 0.6 }}
      className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className="flex h-32 overflow-hidden rounded-2xl">
        {dna.palette.map((c) => (
          <div
            key={c}
            className="flex-1 transition-all group-hover:flex-[1.1]"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="mt-6 flex items-start justify-between">
        <div>
          <h3 className="font-display text-2xl italic leading-tight">{dna.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            by {dna.author} · {dna.location}
          </p>
        </div>
        <button
          onClick={() => {
            setLiked((v) => !v);
            setLikes((v) => (liked ? v - 1 : v + 1));
          }}
          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
            liked
              ? "border-accent text-accent"
              : "border-border text-muted-foreground hover:border-accent hover:text-accent"
          }`}
        >
          <Heart className={`size-3 ${liked ? "fill-accent" : ""}`} />
          {likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {dna.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-bone px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-foreground/70"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <button className="flex-1 rounded-full border border-border bg-background py-2.5 text-xs font-medium transition-colors hover:bg-bone">
          Save
        </button>
        <button
          onClick={() => toast.info("Clone DNA coming soon — extract your own in Style DNA Studio")}
          className="flex-1 rounded-full bg-foreground py-2.5 text-xs font-medium text-background transition-colors hover:bg-accent"
        >
          Clone DNA
        </button>
      </div>
    </motion.article>
  );
}

function MarketplacePage() {
  const [myDnas, setMyDnas] = useState<DnaProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProfiles = useServerFn(listDnaProfiles);

  const loadDnas = useCallback(async () => {
    setLoading(true);
    try {
      const profiles = await fetchProfiles();
      setMyDnas((profiles ?? []) as DnaProfile[]);
    } catch {
      /* silent */
    }
    setLoading(false);
  }, [fetchProfiles]);

  useEffect(() => {
    void loadDnas();
  }, [loadDnas]);

  const filteredCommunity = COMMUNITY_DNAS.filter(
    (d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.author.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="px-6 pb-12 pt-20">
        <div className="mx-auto max-w-6xl">
          <EyebrowLabel>Marketplace</EyebrowLabel>
          <h1 className="mt-6 max-w-3xl font-display text-6xl italic leading-[1.05]">
            Discover, follow, and clone <em className="text-accent">Style DNAs</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            A community feed of aesthetic identities from designers, studios, and creative
            technologists across the world.
          </p>

          {/* Search */}
          <div className="mt-8 flex max-w-md gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, style, or tag…"
              className="flex-1 rounded-full border border-border bg-background px-5 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="rounded-full border border-border px-4 py-2.5 text-xs text-muted-foreground hover:border-accent hover:text-accent transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* My DNAs */}
      {loading ? (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 h-4 w-32 animate-pulse rounded-full bg-bone/60" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-3xl bg-bone/60" />
              ))}
            </div>
          </div>
        </section>
      ) : myDnas.length > 0 ? (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Your Extracted DNAs ({myDnas.length})
              </h2>
              <button
                onClick={() => void loadDnas()}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                <RefreshCw className="size-3.5" /> Refresh
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myDnas.map((d, i) => (
                <UserDnaCard key={d.id} profile={d} index={i} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-4 rounded-3xl border border-dashed border-border bg-bone/30 px-8 py-10">
              <Upload className="size-8 text-muted-foreground/40" />
              <div>
                <p className="font-display text-xl italic">No Style DNAs extracted yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload your inspiration images in{" "}
                  <Link to="/style-dna" className="text-accent underline-offset-2 hover:underline">
                    Style DNA Studio
                  </Link>{" "}
                  to create your first DNA profile.
                </p>
              </div>
              <Link
                to="/style-dna"
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent"
              >
                Extract DNA <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Community */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Community DNAs
              {search &&
                ` · ${filteredCommunity.length} result${filteredCommunity.length !== 1 ? "s" : ""}`}
            </h2>
          </div>

          {filteredCommunity.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No community DNAs match &quot;{search}&quot;.{" "}
              <button onClick={() => setSearch("")} className="text-accent hover:underline">
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCommunity.map((d, i) => (
                <CommunityCard key={d.id} dna={d} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
