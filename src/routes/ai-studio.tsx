import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import { EyebrowLabel, SectionHeading } from "@/components/site/section-heading";

export const Route = createFileRoute("/ai-studio")({
  head: () => ({
    meta: [
      { title: "AI Studio — Palette Print" },
      {
        name: "description",
        content:
          "Remix your Style DNA, chat with your aesthetic identity, and export prompts for Midjourney, ChatGPT, and more.",
      },
      { property: "og:title", content: "The AI Creative Studio" },
      {
        property: "og:description",
        content:
          "Style Remix Lab, DNA Chat, and Prompt Library — the creative operating system for your taste.",
      },
    ],
  }),
  component: AiStudioPage,
});

const PROMPT_TARGETS = [
  "Midjourney",
  "Stable Diffusion",
  "ChatGPT",
  "Gemini",
  "Claude",
  "Flux",
  "Lovable",
];

const PROMPTS = [
  {
    tag: "Website Hero",
    text: "Editorial modernist hero, warm ivory background, oversized cormorant italic display type in ink, sculptural terracotta accent element, high contrast, generous negative space, film-grain photography aesthetic.",
  },
  {
    tag: "Brand Mark",
    text: "Wordmark for a design studio, serif with elongated italic tail, warm ink on cream, timeless editorial character reminiscent of 1970s Italian art magazines.",
  },
  {
    tag: "Portfolio Cover",
    text: "Case study cover, split composition, warm plaster texture on left, serif number 01 in terracotta on right, minimal, painterly light, tactile.",
  },
];

function AiStudioPage() {
  const [remix, setRemix] = useState({ editorial: 60, futurist: 20, tactile: 20 });
  const [chat, setChat] = useState<{ role: "you" | "dna"; text: string }[]>([
    {
      role: "dna",
      text: "I'm your Style DNA. Ask me anything about colors, layouts, typography, or how to bring your aesthetic to a new surface.",
    },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setChat((c) => [...c, { role: "you", text: q }]);
    setInput("");
    setTimeout(() => {
      setChat((c) => [
        ...c,
        {
          role: "dna",
          text: reply(q),
        },
      ]);
    }, 500);
  };

  return (
    <div className="overflow-hidden">
      <section className="px-6 pb-16 pt-20">
        <div className="mx-auto max-w-6xl">
          <EyebrowLabel>AI Studio</EyebrowLabel>
          <h1 className="mt-6 max-w-4xl font-display text-6xl italic leading-[1.05]">
            Remix, chat, and generate <em className="text-accent">from your DNA</em>
          </h1>
        </div>
      </section>

      {/* Remix Lab */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-8">
            <EyebrowLabel>Style Remix Lab</EyebrowLabel>
            <h3 className="mt-3 font-display text-3xl italic">
              Blend three aesthetic vectors
            </h3>
            <div className="mt-8 space-y-6">
              {(
                [
                  ["editorial", "Editorial"],
                  ["futurist", "Futurist"],
                  ["tactile", "Tactile"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-mono text-accent">{remix[key]}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={remix[key]}
                    onChange={(e) =>
                      setRemix((r) => ({ ...r, [key]: Number(e.target.value) }))
                    }
                    className="mt-2 w-full accent-accent"
                  />
                </div>
              ))}
            </div>
            <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground">
              <Sparkles className="size-4" />
              Generate Remix DNA
            </button>
          </div>

          <div className="rounded-3xl border border-border bg-ink p-8 text-background">
            <EyebrowLabel>DNA Chat</EyebrowLabel>
            <h3 className="mt-3 font-display text-3xl italic">
              Talk to your aesthetic
            </h3>
            <div className="mt-6 h-64 space-y-3 overflow-y-auto pr-1">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "dna"
                      ? "bg-background/10 text-background"
                      : "ml-auto bg-accent text-accent-foreground"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Suggest a homepage layout…"
                className="flex-1 rounded-full border border-background/15 bg-background/5 px-4 py-2.5 text-sm placeholder:text-background/40 focus:border-accent focus:outline-none"
              />
              <button
                onClick={send}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Prompt Library */}
      <section className="border-t border-border bg-bone/40 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Prompt Library"
            title={<>Ready-made prompts <em>in your voice</em></>}
            description="Copy prompts tuned to your Style DNA. Works across every major image and text model."
          />
          <div className="mt-8 flex flex-wrap gap-2">
            {PROMPT_TARGETS.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PROMPTS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                className="group rounded-2xl border border-border bg-background p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    {p.tag}
                  </span>
                  <button className="text-muted-foreground transition-colors hover:text-accent">
                    <Copy className="size-4" />
                  </button>
                </div>
                <p className="mt-4 text-sm text-foreground/80">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Creative Brief */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Creative Briefs"
            title={<>Generated briefs, <em>export-ready</em></>}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Brand Brief",
              "Website Brief",
              "Logo Brief",
              "Marketing Brief",
              "Portfolio Brief",
              "Campaign Brief",
            ].map((b, i) => (
              <div
                key={b}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-accent" />
                </div>
                <p className="mt-6 font-display text-2xl italic">{b}</p>
                <p className="mt-2 text-xs text-muted-foreground">PDF · DOCX export</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function reply(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("color")) {
    return "Lead with warm ivory (#fdfcf8) and bone (#f5f1e9). Use terracotta (#cf5a3c) sparingly as a signal color, and reserve ink (#1a1918) for typography and rules.";
  }
  if (lower.includes("logo")) {
    return "Try a serif wordmark in Cormorant italic with an elongated tail, paired with a small circular terracotta pigment as a graphic device.";
  }
  if (lower.includes("layout") || lower.includes("homepage")) {
    return "Asymmetric hero: oversized italic display type left-aligned, single sculptural image bleeding right, generous 12rem vertical rhythm between sections.";
  }
  return "Your DNA reads editorial and warm. Whatever you're designing, favor negative space, one focal accent, and serif display type against modern grotesque body copy.";
}
