import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Check, Zap, Crown, Building2, ArrowRight } from "lucide-react";
import { EyebrowLabel, SectionHeading } from "@/components/site/section-heading";
import { getProfile } from "@/lib/dna.functions";
import { listDnaProfiles } from "@/lib/dna.functions";
import { listProjects } from "@/lib/ai-studio.functions";
import { toast } from "sonner";

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

type Profile = {
  id: string;
  username?: string;
  full_name?: string;
  plan?: string;
  credits?: number;
  created_at?: string;
};

const TIERS = [
  {
    key: "curious",
    name: "Curious",
    icon: <Zap className="size-5" />,
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
    ctaLink: "/style-dna",
    solid: false,
  },
  {
    key: "studio",
    name: "Studio",
    icon: <Crown className="size-5" />,
    price: "$28",
    cadence: "per month",
    tagline: "For independent designers and creators.",
    features: [
      "Unlimited Style DNAs",
      "All six AI surfaces",
      "Style Remix Lab",
      "PDF · Figma · Framer export",
      "Publish to marketplace",
    ],
    cta: "Go Studio",
    ctaLink: "/style-dna",
    solid: true,
  },
  {
    key: "atelier",
    name: "Atelier",
    icon: <Building2 className="size-5" />,
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
    ctaLink: "/style-dna",
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

function planToKey(plan?: string): string {
  if (!plan) return "curious";
  const p = plan.toLowerCase();
  if (p.includes("atelier") || p.includes("enterprise")) return "atelier";
  if (p.includes("studio") || p.includes("pro") || p.includes("paid")) return "studio";
  return "curious";
}

function UsageSummary({
  profile,
  dnaCount,
  projectCount,
}: {
  profile: Profile;
  dnaCount: number;
  projectCount: number;
}) {
  const planKey = planToKey(profile.plan);
  const credits = typeof profile.credits === "number" ? profile.credits : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto mb-16 max-w-4xl rounded-3xl border border-border bg-card px-8 py-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Your current plan
          </p>
          <p className="mt-1 font-display text-3xl italic capitalize">
            {profile.plan || "Curious"}
          </p>
          {profile.full_name && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Welcome back, {profile.full_name.split(" ")[0]}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-8 text-center">
          <div>
            <p className="font-display text-4xl italic text-accent">{dnaCount}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Style DNA{dnaCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <p className="font-display text-4xl italic">{projectCount}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Project{projectCount !== 1 ? "s" : ""}
            </p>
          </div>
          {credits > 0 && (
            <div>
              <p className="font-display text-4xl italic">{credits}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Credits left
              </p>
            </div>
          )}
        </div>

        {planKey === "curious" && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Ready to unlock more?</p>
            <button
              onClick={() => toast.info("Upgrade flow coming soon!")}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Upgrade to Studio <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar for free plan limits */}
      {planKey === "curious" && (
        <div className="mt-6 border-t border-border pt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Style DNA extractions used</span>
            <span>{Math.min(dnaCount, 1)} / 1</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bone">
            <div
              className="h-full rounded-full bg-accent transition-all duration-700"
              style={{ width: `${Math.min(dnaCount * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PricingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dnaCount, setDnaCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useServerFn(getProfile);
  const fetchDnas = useServerFn(listDnaProfiles);
  const fetchProjects = useServerFn(listProjects);

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const [prof, dnas, projects] = await Promise.allSettled([
        fetchProfile(),
        fetchDnas(),
        fetchProjects(),
      ]);
      if (prof.status === "fulfilled" && prof.value) setProfile(prof.value as Profile);
      if (dnas.status === "fulfilled") setDnaCount((dnas.value ?? []).length);
      if (projects.status === "fulfilled") setProjectCount((projects.value ?? []).length);
    } catch {
      /* silent */
    }
    setLoading(false);
  }, [fetchProfile, fetchDnas, fetchProjects]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  const activePlanKey = planToKey(profile?.plan);

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

      {/* Usage summary for logged-in users */}
      <section className="px-6">
        {loading ? (
          <div className="mx-auto mb-16 max-w-4xl animate-pulse rounded-3xl bg-bone/60 px-8 py-12" />
        ) : profile ? (
          <UsageSummary profile={profile} dnaCount={dnaCount} projectCount={projectCount} />
        ) : null}
      </section>

      {/* Tier cards */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => {
            const isActive = profile ? activePlanKey === t.key : false;
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7 }}
                className={`relative flex flex-col rounded-3xl border p-8 transition-all ${
                  t.solid
                    ? "border-accent bg-ink text-background shadow-elegant"
                    : isActive
                      ? "border-accent/60 bg-card ring-1 ring-accent/30"
                      : "border-border bg-card"
                }`}
              >
                {/* Badges */}
                {t.solid && (
                  <span className="absolute right-6 top-6 rounded-full bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent-foreground">
                    Most Loved
                  </span>
                )}
                {isActive && !t.solid && (
                  <span className="absolute right-6 top-6 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent">
                    Your Plan
                  </span>
                )}

                {/* Icon */}
                <div
                  className={`mb-4 flex size-10 items-center justify-center rounded-full ${
                    t.solid ? "bg-accent/20 text-accent" : "bg-bone text-foreground"
                  }`}
                >
                  {t.icon}
                </div>

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

                {isActive && !t.solid ? (
                  <Link
                    to="/ai-studio"
                    className="mt-8 block rounded-full bg-accent px-6 py-3 text-center text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    Open AI Studio <ArrowRight className="ml-1 inline size-3.5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      if (isActive) return;
                      toast.info(
                        t.key === "atelier"
                          ? "Contact us at hello@paletteprint.studio"
                          : "Upgrade flow coming soon!",
                      );
                    }}
                    className={`mt-8 rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                      t.solid
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : isActive
                          ? "cursor-default border border-accent/40 bg-accent/10 text-accent"
                          : "border border-border bg-background hover:bg-bone"
                    }`}
                  >
                    {isActive ? "Current Plan" : t.cta}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
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
