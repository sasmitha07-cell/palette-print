import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Trash2, Star, Plus } from "lucide-react";
import {
  deleteDnaProfile,
  getProfile,
  listDnaProfiles,
} from "@/lib/dna.functions";
import { supabase } from "@/integrations/supabase/client";
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
    await supabase.auth.signOut();
    router.navigate({ to: "/", replace: true });
  };

  const p = profile.data;
  const list = dnas.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-8">
      <EyebrowLabel>Your account</EyebrowLabel>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-6xl italic leading-[1.05]">
            {profile.isLoading ? "…" : p?.full_name || "Welcome"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {p?.plan ? `${p.plan.toUpperCase()} plan · ${p.credits ?? 0} credits` : ""}
          </p>
        </div>
        <button
          onClick={signOut}
          className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-bone hover:text-foreground"
        >
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="DNA profiles" value={list.length} />
        <Stat
          label="Favorites"
          value={list.filter((d) => d.is_favorite).length}
        />
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
