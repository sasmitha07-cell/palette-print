import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EyebrowLabel, SectionHeading } from "@/components/site/section-heading";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Palette Print" },
      {
        name: "description",
        content:
          "Five steps and eight AI analysis stages that turn ten inspirations into your Style DNA and creative systems.",
      },
      { property: "og:title", content: "How Palette Print Works" },
      {
        property: "og:description",
        content:
          "Upload · Analyze · Extract · Generate · Build. Inside the Palette Print creative intelligence engine.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const STAGES = [
  { n: "01", t: "Image Understanding", d: "Vision transformer maps subjects, textures, and space." },
  { n: "02", t: "Color Detection", d: "Extracts dominant, secondary, and accent palettes with harmony scoring." },
  { n: "03", t: "Composition Analysis", d: "Reads grid rhythm, balance, symmetry, and negative space." },
  { n: "04", t: "Typography Analysis", d: "Infers type character, weight, and pairing preferences." },
  { n: "05", t: "Mood Analysis", d: "Weighs emotional tone across eight sensory axes." },
  { n: "06", t: "Pattern Recognition", d: "Detects motifs, shape language, and repetition." },
  { n: "07", t: "Style Clustering", d: "Groups your references into a coherent aesthetic archetype." },
  { n: "08", t: "DNA Generation", d: "Synthesizes everything into your unique Style DNA signature." },
];

function HowItWorksPage() {
  return (
    <div className="overflow-hidden">
      <section className="px-6 pb-20 pt-20 text-center">
        <EyebrowLabel>The Process</EyebrowLabel>
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-6xl italic leading-[1.05] md:text-7xl">
          From <em className="text-accent">10 images</em> to a complete creative system
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Every extraction runs through an eight-stage analysis pipeline. Here's
          what happens behind the scenes.
        </p>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl space-y-4">
          {STAGES.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="grid gap-6 rounded-3xl border border-border bg-card px-8 py-8 md:grid-cols-[100px_1fr_auto] md:items-center"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">
                Stage {s.n}
              </span>
              <div>
                <h3 className="font-display text-3xl italic">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
              <div className="hidden font-display text-6xl italic text-border md:block">
                {s.n}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Then Generate"
            title={<>The DNA <em>becomes</em> tangible</>}
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              "Websites & Landing Pages",
              "Brand Systems & Logos",
              "Portfolios & Case Studies",
              "Social Media Grids",
              "Presentation Decks",
              "Design Systems & Style Guides",
              "Creative Briefs (PDF/DOCX)",
              "AI Prompt Libraries",
              "Moodboards & References",
            ].map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-background p-6 transition-colors hover:border-accent"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Output · {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 font-display text-2xl italic">{t}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              to="/style-dna"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 text-sm font-medium text-accent-foreground shadow-glow"
            >
              Try It Now
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
