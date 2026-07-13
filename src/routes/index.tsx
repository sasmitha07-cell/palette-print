import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Play, Sparkles } from "lucide-react";
import { InspirationConstellation } from "@/components/site/inspiration-constellation";
import { EyebrowLabel, SectionHeading } from "@/components/site/section-heading";
import img1 from "@/assets/inspiration-1.jpg";
import img2 from "@/assets/inspiration-2.jpg";
import img3 from "@/assets/inspiration-3.jpg";
import img4 from "@/assets/inspiration-4.jpg";
import img5 from "@/assets/inspiration-5.jpg";
import img6 from "@/assets/inspiration-6.jpg";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <StyleDnaShowcase />
      <SurfaceGenerator />
      <MoodboardMasonry />
      <DesignTwin />
      <MarketplaceStrip />
      <PricingPreview />
      <FinalCta />
    </div>
  );
}

/* ============================== HERO ============================== */
function Hero() {
  return (
    <section className="relative px-6 pb-16 pt-20">
      <div className="mx-auto max-w-6xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 backdrop-blur"
        >
          <Sparkles className="size-3.5 text-accent" />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/70">
            Creative Intelligence · v2.0
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95] tracking-tight text-balance"
        >
          Discover the <em className="text-accent">Blueprint</em>
          <br />
          Behind Your Creative Taste
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.9 }}
          className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground text-pretty md:text-xl"
        >
          Upload ten inspirations. We decode your Style DNA and generate websites,
          brands, portfolios, moodboards, and complete design systems — instantly,
          in your voice.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          <Link
            to="/style-dna"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 text-sm font-medium text-accent-foreground shadow-glow transition-all hover:scale-[1.02]"
          >
            Extract My Style DNA
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-7 py-4 text-sm font-medium text-foreground transition-colors hover:bg-bone">
            <Play className="size-4 fill-current" />
            Watch Demo · 90s
          </button>
        </motion.div>
      </div>

      <div className="mt-24">
        <InspirationConstellation />
      </div>
    </section>
  );
}

/* ============================== TRUST STRIP ============================== */
function TrustStrip() {
  const brands = ["ATELIER", "Foundry", "Kinfolk", "Studio Nord", "Verse", "Are.na", "Kadeau"];
  return (
    <section className="border-y border-border bg-bone/50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 md:flex-row md:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Trusted by 8,400+ studios and independents
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((b) => (
            <span
              key={b}
              className="font-display text-xl italic tracking-tight text-foreground/40"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== HOW IT WORKS ============================== */
const STEPS = [
  {
    n: "01",
    t: "Upload 10 Images",
    d: "Drop your visual references — screenshots, photos, art, textures. Anything you're drawn to.",
  },
  {
    n: "02",
    t: "AI Analyzes Patterns",
    d: "Eight-stage vision pipeline extracts color, composition, typography, mood, and structural cues.",
  },
  {
    n: "03",
    t: "Extract Style DNA",
    d: "Receive a comprehensive signature: archetype, palette, type pairing, mood, and design fingerprint.",
  },
  {
    n: "04",
    t: "Generate Creative Systems",
    d: "Turn DNA into websites, brands, logos, portfolios, decks, and social systems on demand.",
  },
  {
    n: "05",
    t: "Build New Designs",
    d: "Export style guides, remix into new directions, or hand off to your team of humans and AIs.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="How It Works"
          title={
            <>
              From inspiration <em>to intelligent</em> creative systems
            </>
          }
          description="Five steps, twelve seconds each. Palette Print treats aesthetic taste as a signal — and gives you tools to project it everywhere."
        />

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="group relative flex flex-col justify-between bg-background p-8 transition-colors hover:bg-bone/40"
            >
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
                  Step {s.n}
                </span>
                <h3 className="mt-6 font-display text-2xl italic leading-tight">
                  {s.t}
                </h3>
              </div>
              <p className="mt-8 text-sm text-muted-foreground">{s.d}</p>
              <div className="mt-8 h-px w-8 bg-accent/40 transition-all group-hover:w-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== STYLE DNA SHOWCASE ============================== */
function StyleDnaShowcase() {
  return (
    <section id="style-dna" className="px-6 py-32">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12">
        {/* Left: identity */}
        <div className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
          <EyebrowLabel>Analysis Result</EyebrowLabel>
          <h2 className="mt-4 font-display text-5xl italic leading-none">
            The Editorial Modernist
          </h2>
          <p className="mt-6 text-muted-foreground text-pretty">
            Your aesthetic profile leans toward high-contrast asymmetry, serif
            display heritage, and a warm organic spectrum — mid-century print meets
            contemporary luxury.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { label: "Minimalist", solid: false },
              { label: "Luxe", solid: false },
              { label: "Cinematic", solid: true },
              { label: "Tactile", solid: false },
              { label: "Editorial", solid: false },
            ].map((t) => (
              <span
                key={t.label}
                className={`rounded-full border border-border px-3 py-1 text-xs font-medium ${
                  t.solid ? "bg-foreground text-background italic font-display" : "bg-background"
                }`}
              >
                {t.label}
              </span>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-end justify-between border-b border-border pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
                Confidence
              </span>
              <span className="font-display text-3xl italic">94.2%</span>
            </div>
            <div className="mt-5 space-y-4">
              {[
                { l: "Complexity", v: 34 },
                { l: "Density", v: 62 },
                { l: "Contrast", v: 88 },
                { l: "Warmth", v: 72 },
                { l: "Motion", v: 24 },
                { l: "Structure", v: 78 },
              ].map((m) => (
                <div key={m.l}>
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span>{m.l}</span>
                    <span>{m.v}%</span>
                  </div>
                  <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-border">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.v}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className={m.l === "Contrast" || m.l === "Warmth" ? "h-full bg-accent" : "h-full bg-foreground"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: dashboard */}
        <div className="lg:col-span-8">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Moodboard */}
            <div className="relative overflow-hidden rounded-3xl border border-border md:row-span-2">
              <img
                src={img1}
                alt="Warm plaster inspiration"
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-full bg-background/85 px-4 py-2 backdrop-blur-md">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
                  Primary Reference
                </span>
                <span className="font-display italic">01/10</span>
              </div>
            </div>

            {/* Color palette */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <EyebrowLabel>Color DNA</EyebrowLabel>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {[
                  { c: "#fdfcf8", h: "Canvas" },
                  { c: "#f5f1e9", h: "Bone" },
                  { c: "#cf5a3c", h: "Terracotta" },
                  { c: "#7a8b6f", h: "Sage" },
                  { c: "#1a1918", h: "Ink" },
                ].map((s) => (
                  <div key={s.c} className="group">
                    <div
                      className="aspect-square rounded-xl border border-border transition-transform group-hover:scale-105"
                      style={{ backgroundColor: s.c }}
                    />
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {s.h}
                    </p>
                    <p className="font-mono text-[9px] text-foreground/60">{s.c}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-bone px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest">
                  Analogous · Warm
                </span>
                <span className="rounded-full bg-bone px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest">
                  Low Saturation
                </span>
              </div>
            </div>

            {/* Typography */}
            <div className="rounded-3xl border border-border bg-ink p-8 text-background">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-soft">
                Typography DNA
              </span>
              <p className="mt-6 font-display text-5xl italic leading-none">
                Cormorant
              </p>
              <p className="mt-1 font-display text-2xl">Garamond · Display</p>
              <div className="my-6 h-px bg-background/15" />
              <p className="font-sans text-lg font-medium">Inter Tight Grotesk</p>
              <p className="mt-1 font-sans text-sm text-background/60">
                Body · Interface · Data
              </p>
            </div>

            {/* Radar preview */}
            <div className="md:col-span-2 rounded-3xl border border-border bg-card p-8">
              <div className="flex items-start justify-between">
                <div>
                  <EyebrowLabel>Design Fingerprint</EyebrowLabel>
                  <h3 className="mt-2 font-display text-2xl italic">
                    8 dimensions of aesthetic taste
                  </h3>
                </div>
                <span className="rounded-full bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent">
                  Unique
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
                {[
                  { l: "Minimalist", v: 82 },
                  { l: "Luxury", v: 76 },
                  { l: "Futuristic", v: 34 },
                  { l: "Creative", v: 91 },
                  { l: "Professional", v: 88 },
                  { l: "Experimental", v: 42 },
                  { l: "Bold", v: 68 },
                  { l: "Emotional", v: 74 },
                ].map((m) => (
                  <div key={m.l}>
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground/70">{m.l}</span>
                      <span className="font-mono text-[10px] text-foreground/50">
                        {m.v}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${m.v}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.1 }}
                        className="h-full bg-gradient-to-r from-foreground to-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== SURFACE GENERATOR ============================== */
const SURFACES = [
  {
    n: "01",
    t: "Website Design",
    d: "Asymmetric editorial grids, floating imagery, deep ivory depth.",
    tint: "#f5f1e9",
    accent: "#cf5a3c",
    count: 10,
  },
  {
    n: "02",
    t: "Brand Identity",
    d: "Refined wordmarks, mark systems, and stationery leveraging serif heritage.",
    tint: "#ede6d6",
    accent: "#1a1918",
    count: 12,
  },
  {
    n: "03",
    t: "Logo Systems",
    d: "Monograms, marks, and lockups derived from your compositional patterns.",
    tint: "#f4d4c8",
    accent: "#cf5a3c",
    count: 10,
  },
  {
    n: "04",
    t: "Social Media",
    d: "Cohesive 12-post grids across Instagram, Pinterest, and Threads.",
    tint: "#e2d5c0",
    accent: "#7a8b6f",
    count: 10,
  },
  {
    n: "05",
    t: "Presentations",
    d: "Narrative decks and pitch systems using your palette and voice.",
    tint: "#fdfcf8",
    accent: "#cf5a3c",
    count: 10,
  },
  {
    n: "06",
    t: "Portfolio",
    d: "Case study layouts and index pages that showcase your work with taste.",
    tint: "#f5f1e9",
    accent: "#1a1918",
    count: 10,
  },
];

function SurfaceGenerator() {
  return (
    <section className="border-t border-border bg-bone/40 px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-end justify-between gap-6 border-b border-border pb-10 md:flex-row">
          <SectionHeading
            eyebrow="AI Surface Generator"
            title={
              <>
                Ten directions. <em>Six surfaces.</em>
                <br />
                One aesthetic identity.
              </>
            }
          />
          <p className="max-w-sm text-sm text-muted-foreground">
            Click any surface and Palette Print generates ten concept variations
            using your Style DNA — layouts, mockups, palettes, and rationale
            included.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SURFACES.map((s, i) => (
            <motion.article
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <div
                className="relative aspect-[4/3] overflow-hidden"
                style={{ backgroundColor: s.tint }}
              >
                <SurfaceMock kind={s.t} accent={s.accent} />
                <span className="absolute right-4 top-4 rounded-full bg-background/85 px-3 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
                  {s.count} concepts
                </span>
              </div>
              <div className="flex-1 p-7">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {s.n}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
                <h3 className="mt-4 font-display text-3xl italic leading-none">
                  {s.t}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SurfaceMock({ kind, accent }: { kind: string; accent: string }) {
  if (kind === "Website Design") {
    return (
      <div className="absolute inset-6 flex flex-col rounded-lg border border-foreground/10 bg-background p-4 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-foreground/20" />
          <span className="size-1.5 rounded-full bg-foreground/20" />
          <span className="ml-auto h-1 w-16 bg-foreground/10" />
        </div>
        <div className="mt-4 h-1.5 w-16 bg-foreground/70" />
        <div className="mt-2 h-4 w-full bg-foreground/10" />
        <div className="mt-1 h-4 w-3/4 bg-foreground/10" />
        <div className="mt-auto grid grid-cols-3 gap-1">
          <div className="h-10 rounded" style={{ backgroundColor: accent, opacity: 0.6 }} />
          <div className="h-10 rounded bg-foreground/10" />
          <div className="h-10 rounded bg-foreground/10" />
        </div>
      </div>
    );
  }
  if (kind === "Brand Identity") {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-display text-5xl italic" style={{ color: accent }}>
            Ma
          </p>
          <div className="mx-auto mt-2 h-px w-10" style={{ background: accent }} />
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.4em]">
            Studio · 2026
          </p>
        </div>
      </div>
    );
  }
  if (kind === "Logo Systems") {
    return (
      <div className="absolute inset-0 grid grid-cols-3 gap-2 p-8">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="grid place-items-center rounded-lg border border-foreground/10 bg-background"
          >
            <div
              className="size-6 rounded-full"
              style={{
                background: i % 2 === 0 ? accent : "transparent",
                border: i % 2 === 0 ? "none" : `1.5px solid ${accent}`,
              }}
            />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "Social Media") {
    return (
      <div className="absolute inset-6 grid grid-cols-3 gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-sm"
            style={{
              backgroundColor: i === 4 ? accent : "rgba(0,0,0,0.06)",
            }}
          />
        ))}
      </div>
    );
  }
  if (kind === "Presentations") {
    return (
      <div className="absolute inset-6 flex flex-col rounded-lg border border-foreground/10 bg-background p-5">
        <p className="font-display text-xl italic">Chapter 04</p>
        <div className="mt-2 h-1 w-20" style={{ background: accent }} />
        <div className="mt-auto flex justify-between text-[8px] font-mono uppercase tracking-widest">
          <span>Palette Print</span>
          <span>04 · 12</span>
        </div>
      </div>
    );
  }
  // Portfolio
  return (
    <div className="absolute inset-6 grid grid-cols-6 grid-rows-4 gap-1">
      <div className="col-span-4 row-span-3 rounded" style={{ background: accent, opacity: 0.7 }} />
      <div className="col-span-2 row-span-2 rounded bg-foreground/10" />
      <div className="col-span-2 row-span-1 rounded bg-foreground/20" />
      <div className="col-span-3 row-span-1 rounded bg-foreground/10" />
      <div className="col-span-3 row-span-1 rounded bg-foreground/20" />
    </div>
  );
}

/* ============================== MOODBOARD MASONRY ============================== */
function MoodboardMasonry() {
  const items = [
    { src: img2, span: "row-span-2" },
    { src: img1, span: "" },
    { src: img4, span: "" },
    { src: img3, span: "row-span-2" },
    { src: img5, span: "" },
    { src: img6, span: "row-span-2" },
    { src: img4, span: "" },
    { src: img1, span: "" },
  ];
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
          <SectionHeading
            eyebrow="Moodboard Generator"
            title={
              <>
                A living moodboard <br />
                <em>curated by your DNA</em>
              </>
            }
          />
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-bone">
            Generate New Board
            <Sparkles className="size-4 text-accent" />
          </button>
        </div>

        <div className="mt-14 grid auto-rows-[180px] grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05, duration: 0.6 }}
              className={`group relative overflow-hidden rounded-2xl border border-border ${it.span}`}
            >
              <img
                src={it.src}
                alt="Moodboard reference"
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== DESIGN TWIN ============================== */
const TWINS = [
  { name: "Apple", pct: 74, note: "Restrained hierarchy, generous whitespace" },
  { name: "Kinfolk", pct: 88, note: "Editorial serif, warm neutral palette" },
  { name: "Aesop", pct: 82, note: "Ink typography, apothecary restraint" },
  { name: "Arc", pct: 61, note: "Playful accent color, soft geometry" },
  { name: "Are.na", pct: 71, note: "Curatorial density, monospace details" },
];

function DesignTwin() {
  return (
    <section className="border-y border-border bg-bone/40 px-6 py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Design Twin"
            title={
              <>
                You share aesthetic DNA <br />
                with <em>familiar company</em>
              </>
            }
            description="We compare your Style DNA against a library of iconic brands. Not to imitate — to locate you on the map of great taste."
          />
        </div>

        <div className="space-y-3">
          {TWINS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="group flex items-center gap-6 rounded-2xl border border-border bg-background p-5 transition-all hover:border-accent"
            >
              <span className="w-14 text-center font-display text-2xl italic text-accent">
                {t.pct}%
              </span>
              <div className="flex-1">
                <p className="font-display text-xl italic">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.note}</p>
              </div>
              <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-border md:block">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${t.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-accent"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== MARKETPLACE STRIP ============================== */
function MarketplaceStrip() {
  const dnas = [
    "Neo-Scandinavian Identity",
    "Digital Artisan DNA",
    "Futuristic Minimalist",
    "Luxe Contemporary",
    "Editorial Modernist",
    "Creative Technologist",
    "Post-Digital Craft",
  ];
  return (
    <section className="overflow-hidden border-y border-border bg-ink py-14 text-background">
      <div className="flex w-max animate-marquee gap-16 px-6">
        {[...dnas, ...dnas].map((d, i) => (
          <div key={i} className="flex items-center gap-16">
            <span className="font-display text-3xl italic">{d}</span>
            <span className="font-mono text-xs uppercase tracking-[0.4em] text-accent">
              ✦
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================== PRICING PREVIEW ============================== */
function PricingPreview() {
  const tiers = [
    {
      name: "Curious",
      price: "$0",
      cadence: "forever",
      notes: [
        "1 Style DNA extraction",
        "3 AI surface generations",
        "Community marketplace",
      ],
      cta: "Start Free",
      solid: false,
    },
    {
      name: "Studio",
      price: "$28",
      cadence: "per month",
      notes: [
        "Unlimited Style DNAs",
        "All six AI surfaces",
        "Style Remix Lab",
        "PDF · Figma · Framer export",
      ],
      cta: "Go Studio",
      solid: true,
    },
    {
      name: "Atelier",
      price: "$96",
      cadence: "per month",
      notes: [
        "Team seats",
        "Client-facing brand books",
        "DNA Match Checker API",
        "Priority creative support",
      ],
      cta: "Talk to Us",
      solid: false,
    },
  ];
  return (
    <section id="pricing" className="px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          align="center"
          eyebrow="Pricing"
          title={<>Priced for <em>creative practice</em></>}
          description="Start free. Scale with your studio. All plans include your full Style DNA report."
        />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                t.solid
                  ? "border-accent bg-ink text-background shadow-elegant"
                  : "border-border bg-card"
              }`}
            >
              {t.solid ? (
                <span className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent-foreground">
                  Popular
                </span>
              ) : null}
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
                {t.name}
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl italic">{t.price}</span>
                <span className={t.solid ? "text-background/60" : "text-muted-foreground"}>
                  {t.cadence}
                </span>
              </div>
              <ul className="mt-8 flex-1 space-y-3 text-sm">
                {t.notes.map((n) => (
                  <li key={n} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        t.solid ? "bg-accent" : "bg-accent"
                      }`}
                    />
                    {n}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                  t.solid
                    ? "bg-accent text-accent-foreground hover:bg-accent/90"
                    : "border border-border bg-background hover:bg-bone"
                }`}
              >
                {t.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== FINAL CTA ============================== */
function FinalCta() {
  return (
    <section className="px-6 pb-16">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-border bg-ink px-8 py-24 text-background md:px-16">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr] md:items-end">
          <div>
            <EyebrowLabel>Extract Style DNA</EyebrowLabel>
            <h2 className="mt-6 font-display text-5xl italic leading-[1.05] md:text-6xl">
              Your aesthetic is a signal.
              <br />
              <em className="text-accent">Learn its frequency.</em>
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              to="/style-dna"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-4 text-sm font-medium text-accent-foreground shadow-glow transition-all hover:scale-[1.02]"
            >
              Start Extraction
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-background/20 px-7 py-4 text-sm font-medium text-background transition-colors hover:bg-background/10"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
