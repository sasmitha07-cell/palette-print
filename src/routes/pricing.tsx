import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { EyebrowLabel, SectionHeading } from "@/components/site/section-heading";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Palette Print" },
      {
        name: "description",
        content:
          "Simple, intelligent pricing. Start free, scale with your studio. Every plan includes your full Style DNA report.",
      },
      { property: "og:title", content: "Palette Print Pricing" },
      {
        property: "og:description",
        content:
          "Three plans for creators, studios, and ateliers. Full Style DNA included on every tier.",
      },
    ],
  }),
  component: PricingPage,
});

const TIERS = [
  {
    name: "Curious",
    price: "$0",
    cadence: "forever",
    tagline: "For the first DNA extraction.",
    features: [
      "1 Style DNA extraction",
      "3 AI surface generations",
      "Community marketplace access",
      "Basic moodboard exports",
    ],
    cta: "Start Free",
    solid: false,
  },
  {
    name: "Studio",
    price: "$28",
    cadence: "per month",
    tagline: "For independent designers and creators.",
    features: [
      "Unlimited Style DNAs",
      "All six AI surfaces",
      "Style Remix Lab",
      "DNA Chat assistant",
      "PDF · Figma · Framer export",
      "Publish to marketplace",
    ],
    cta: "Go Studio",
    solid: true,
  },
  {
    name: "Atelier",
    price: "$96",
    cadence: "per month",
    tagline: "For studios and agencies with clients.",
    features: [
      "5 team seats · $18/seat after",
      "Client-facing brand books",
      "DNA Match Checker API",
      "Custom design twin library",
      "Priority creative support",
      "SOC 2 & DPA available",
    ],
    cta: "Talk to Us",
    solid: false,
  },
];

const FAQ = [
  {
    q: "What happens after I upload 10 images?",
    a: "The images run through an eight-stage vision pipeline (color, composition, typography, mood, and more) and become your Style DNA in about 30 seconds.",
  },
  {
    q: "Can I use my DNA on client work?",
    a: "Yes. Studio and Atelier plans include full commercial rights to every generated system, mockup, and brief.",
  },
  {
    q: "Which AI models do you use?",
    a: "Palette Print is model-agnostic. We route requests to the best-in-class vision, language, and image models per surface — with fallbacks for reliability.",
  },
  {
    q: "Do you offer education pricing?",
    a: "Yes. Students and educators receive 50% off Studio. Reach out for a verification link.",
  },
];

function PricingPage() {
  return (
    <div className="overflow-hidden">
      <section className="px-6 pb-16 pt-20 text-center">
        <EyebrowLabel>Pricing</EyebrowLabel>
        <h1 className="mx-auto mt-6 max-w-3xl font-display text-6xl italic leading-[1.05] md:text-7xl">
          Priced for <em className="text-accent">creative practice</em>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Start free. Scale with your studio. Every plan includes your full Style DNA report and
          marketplace access.
        </p>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => (
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
                  Most Loved
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
              <p
                className={`mt-2 text-sm ${
                  t.solid ? "text-background/70" : "text-muted-foreground"
                }`}
              >
                {t.tagline}
              </p>
              <ul className="mt-8 flex-1 space-y-3 text-sm">
                {t.features.map((n) => (
                  <li key={n} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
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
      </section>

      <section className="border-t border-border bg-bone/40 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            eyebrow="FAQ"
            title={
              <>
                Common <em>questions</em>
              </>
            }
          />
          <div className="mt-10 divide-y divide-border rounded-3xl border border-border bg-background">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-8 py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                  <span className="font-display text-xl italic">{f.q}</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-lg transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
