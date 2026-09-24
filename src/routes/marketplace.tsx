import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { EyebrowLabel } from "@/components/site/section-heading";

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
          "A community-driven feed of aesthetic identities. Save, follow, and remix DNA from the world's best designers.",
      },
    ],
  }),
  component: MarketplacePage,
});

const DNAS = [
  {
    name: "Editorial Modernist",
    author: "Amèlie Rousseau",
    location: "Paris",
    likes: 3420,
    palette: ["#fdfcf8", "#f5f1e9", "#cf5a3c", "#1a1918"],
    tags: ["Serif", "Warm", "Asymmetric"],
  },
  {
    name: "Neo-Scandinavian",
    author: "Ida Björk",
    location: "Copenhagen",
    likes: 2810,
    palette: ["#f4f0e8", "#dddad0", "#8b8577", "#2d2b28"],
    tags: ["Minimal", "Cool Neutral", "Grid"],
  },
  {
    name: "Digital Artisan",
    author: "Kenji Watanabe",
    location: "Tokyo",
    likes: 4110,
    palette: ["#faf7f2", "#e0d5b7", "#a3623b", "#1c1815"],
    tags: ["Tactile", "Warm", "Sculptural"],
  },
  {
    name: "Futuristic Minimalist",
    author: "Zara Ahmed",
    location: "Dubai",
    likes: 1980,
    palette: ["#ffffff", "#eaeef2", "#5b7cfa", "#0a0f1e"],
    tags: ["Cool", "Technical", "Sharp"],
  },
  {
    name: "Post-Digital Craft",
    author: "Mateo Herrera",
    location: "Mexico City",
    likes: 2645,
    palette: ["#f9f1e3", "#e8b56b", "#c94838", "#2a1e18"],
    tags: ["Warm", "Playful", "Handmade"],
  },
  {
    name: "Luxe Contemporary",
    author: "Sofia Moreau",
    location: "Milan",
    likes: 5210,
    palette: ["#f7f4ee", "#c8b294", "#5c3a2e", "#181310"],
    tags: ["Luxurious", "Refined", "Editorial"],
  },
];

function MarketplacePage() {
  return (
    <div className="overflow-hidden">
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
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DNAS.map((d, i) => (
            <motion.article
              key={d.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.6 }}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="flex h-32 overflow-hidden rounded-2xl">
                {d.palette.map((c) => (
                  <div
                    key={c}
                    className="flex-1 transition-all group-hover:flex-[1.1]"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-6 flex items-start justify-between">
                <div>
                  <h3 className="font-display text-2xl italic leading-tight">{d.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    by {d.author} · {d.location}
                  </p>
                </div>
                <button className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                  <Heart className="size-3" />
                  {(d.likes / 1000).toFixed(1)}k
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {d.tags.map((t) => (
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
                <button className="flex-1 rounded-full bg-foreground py-2.5 text-xs font-medium text-background transition-colors hover:bg-accent">
                  Clone DNA
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
