import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Trash2, Star, Plus } from "lucide-react";
import { deleteDnaProfile, getProfile, listDnaProfiles } from "@/lib/dna.functions";
import { supabase } from "@/integrations/supabase/client";
import { clearDemoSession } from "@/integrations/supabase/dev-auth";
import { paletteAuth, DEMO_PRESETS, type DemoPersona } from "@/integrations/supabase/dev-auth";
import { EyebrowLabel } from "@/components/site/section-heading";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your account — Palette Print" },
      { name: "description", content: "Your Style DNA profiles, projects, and settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const fetchDna = useServerFn(listDnaProfiles);
  const removeDna = useServerFn(deleteDnaProfile);

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const dnas = useQuery({ queryKey: ["dna-list"], queryFn: () => fetchDna() });

  const del = useMutation({
    mutationFn: (id: string) => removeDna({ data: { id } }),
    onSuccess: () => {
      toast.success("DNA profile deleted");
      qc.invalidateQueries({ queryKey: ["dna-list"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    paletteAuth.signOut();
    clearDemoSession();
    toast.success("Signed out");
    router.navigate({ to: "/", replace: true });
  };

  const switchDemoPersona = (persona: DemoPersona) => {
    paletteAuth.createCustomDemoUser({
      name: persona.name,
      role: persona.role,
      email: persona.email,
    });
    toast.success(`Switched to demo persona: ${persona.name}`);
    qc.invalidateQueries();
    setShowPersonaMenu(false);
  };

  const localUser = paletteAuth.getUser();
  const p = profile.data;
  const displayName = p?.full_name || localUser?.user_metadata?.full_name || "Studio Designer";
  const displayPlan = p?.plan || localUser?.user_metadata?.plan || "pro";
  const displayCredits = p?.credits ?? localUser?.user_metadata?.credits ?? 250;
  const isDemo = localUser?.user_metadata?.is_demo;

  const list = dnas.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-8">
      <div className="flex items-center justify-between">
        <EyebrowLabel>Your account</EyebrowLabel>
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">
            <Sparkles className="size-3" /> Demo Studio Mode
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-6xl italic leading-[1.05]">
            {profile.isLoading && !displayName ? "…" : displayName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {`${displayPlan.toUpperCase()} plan · ${displayCredits} credits`}
            {localUser?.email && ` · ${localUser.email}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-background"
          >
            <Sparkles className="mr-1.5 inline size-3.5" />
            Switch Demo Persona
          </button>
          <button
            onClick={signOut}
            className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-bone hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Demo Persona Switcher Drawer/Card */}
      {showPersonaMenu && (
        <div className="mt-6 rounded-3xl border border-accent/30 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Instant Demo Personas
            </p>
            <Link
              to="/auth"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Go to Auth Page / Create Custom Demo User
            </Link>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Switch your active studio identity in one click:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_PRESETS.map((dp) => (
              <button
                key={dp.id}
                type="button"
                onClick={() => switchDemoPersona(dp)}
                className="flex flex-col justify-between rounded-2xl border border-border bg-background p-4 text-left transition-all hover:border-accent hover:shadow-sm"
              >
                <div>
                  <span className="font-mono text-[9px] uppercase text-accent">{dp.archetype}</span>
                  <p className="mt-1 font-display text-lg italic">{dp.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{dp.role}</p>
                </div>
                <span className="mt-3 inline-block text-[10px] text-accent font-medium">
                  Switch to this persona →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="DNA profiles" value={list.length} />
        <Stat label="Favorites" value={list.filter((d) => d.is_favorite).length} />
        <Stat
          label="Member since"
          value={
            p?.created_at
              ? new Date(p.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
        />
      </div>

      {/* DNA library */}
      <div className="mt-14 flex items-end justify-between">
        <div>
          <EyebrowLabel>Saved DNA profiles</EyebrowLabel>
          <h2 className="mt-3 font-display text-3xl italic">Your aesthetic library</h2>
        </div>
        <Link
          to="/style-dna"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition-colors hover:bg-accent"
        >
          <Plus className="size-3.5" /> New DNA
        </Link>
      </div>

      {dnas.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto size-6 text-accent" />
          <p className="mt-4 font-display text-2xl italic">No DNA profiles yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload ten inspirations to generate your first Style DNA.
          </p>
          <Link
            to="/style-dna"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent"
          >
            Start extraction
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => (
            <div
              key={d.id}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-accent"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  {d.style_name ?? "Style DNA"}
                </span>
                {d.is_favorite && <Star className="size-3.5 text-accent" />}
              </div>
              <p className="mt-4 font-display text-2xl italic">{d.name}</p>
              {d.tags && d.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto flex items-center justify-between pt-6 text-xs text-muted-foreground">
                <span>{new Date(d.created_at).toLocaleDateString()}</span>
                <button
                  onClick={() => del.mutate(d.id)}
                  className="text-muted-foreground transition-colors hover:text-accent"
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl italic">{value}</p>
    </div>
  );
}
