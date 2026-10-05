import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  UserCheck,
  Shield,
  Wand2,
  ArrowRight,
  UserPlus,
  LogIn,
  Compass,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { paletteAuth, DEMO_PRESETS, type DemoPersona } from "@/integrations/supabase/dev-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in & Studio Access — Palette Print" },
      {
        name: "description",
        content:
          "Sign in, register your account, or launch a Demo Studio persona to explore Style DNA.",
      },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "signup" | "demo";

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Custom demo user state
  const [customDemoName, setCustomDemoName] = useState("");
  const [customDemoRole, setCustomDemoRole] = useState("Creative Technologist");
  const [customDemoEmail, setCustomDemoEmail] = useState("");
  const [showCustomDemoForm, setShowCustomDemoForm] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const local = paletteAuth.getSession();
    if (local?.user) {
      navigate({ to: "/profile", replace: true });
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) navigate({ to: "/profile", replace: true });
      })
      .catch(() => {
        // offline
      });
  }, [navigate]);

  const launchDemo = (persona?: DemoPersona) => {
    setLoading(true);
    try {
      if (persona) {
        paletteAuth.createCustomDemoUser({
          name: persona.name,
          role: persona.role,
          email: persona.email,
        });
        toast.success(`Signed in as ${persona.name} (${persona.role})`);
      } else {
        paletteAuth.createDemoSession(
          "Studio Designer",
          "designer@paletteprint.studio",
          "Lead Designer",
        );
        toast.success("Signed in with Studio Designer Demo Account");
      }
      router.invalidate();
      navigate({ to: "/profile", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to launch demo");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomDemo = (e: FormEvent) => {
    e.preventDefault();
    if (!customDemoName.trim()) {
      toast.error("Please enter a name for your demo user");
      return;
    }
    setLoading(true);
    try {
      const session = paletteAuth.createCustomDemoUser({
        name: customDemoName.trim(),
        role: customDemoRole.trim() || "Independent Creator",
        email: customDemoEmail.trim() || undefined,
      });
      toast.success(`Demo user created: ${session.user.user_metadata.full_name}!`);
      router.invalidate();
      navigate({ to: "/profile", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create demo user");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        let signedUpRemote = false;

        // Try remote Supabase with a 1.5s timeout
        try {
          const remotePromise = supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/profile`,
              data: { full_name: name },
            },
          });
          const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
            setTimeout(() => reject(new Error("remote_timeout")), 1500),
          );
          const { error } = await Promise.race([remotePromise, timeoutPromise]);
          if (!error) signedUpRemote = true;
        } catch {
          // Fall back to local account registration
        }

        if (!signedUpRemote) {
          const res = await paletteAuth.signUp({ name, email, password });
          toast.success(`Account created — Welcome, ${res.user.full_name}!`);
        } else {
          toast.success("Account created — Welcome!");
        }

        router.invalidate();
        navigate({ to: "/profile", replace: true });
      } else {
        // Sign In
        let signedInRemote = false;

        try {
          const remotePromise = supabase.auth.signInWithPassword({ email, password });
          const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
            setTimeout(() => reject(new Error("remote_timeout")), 1500),
          );
          const { error } = await Promise.race([remotePromise, timeoutPromise]);
          if (!error) signedInRemote = true;
        } catch {
          // Fall back to local authentication
        }

        if (!signedInRemote) {
          const res = await paletteAuth.signInWithPassword({ email, password });
          toast.success(`Welcome back, ${res.user.full_name}!`);
        } else {
          toast.success("Welcome back.");
        }

        router.invalidate();
        navigate({ to: "/profile", replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col px-6 pb-24 pt-8">
      {/* Mode navigation pills */}
      <div className="flex items-center justify-center gap-1.5 rounded-full border border-border bg-card/60 p-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium transition-all ${
            mode === "signin"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LogIn className="size-3.5" /> Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium transition-all ${
            mode === "signup"
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="size-3.5" /> Create Account
        </button>
        <button
          type="button"
          onClick={() => setMode("demo")}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium transition-all ${
            mode === "demo"
              ? "bg-accent text-background shadow-sm"
              : "text-accent hover:bg-accent/10"
          }`}
        >
          <Sparkles className="size-3.5" /> Demo Studio
        </button>
      </div>

      {/* Header section */}
      <div className="mt-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
          {mode === "signup"
            ? "Studio Registration"
            : mode === "signin"
              ? "Studio Sign In"
              : "Instant Access & Exploration"}
        </p>
        <h1 className="mt-3 font-display text-5xl italic leading-[1.05]">
          {mode === "signup"
            ? "Begin your Palette"
            : mode === "signin"
              ? "Welcome back"
              : "Explore Demo Personas"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          {mode === "signup"
            ? "Create an account to save your Style DNA, generate editorial visuals, and build palettes."
            : mode === "signin"
              ? "Sign in to access your saved DNA profiles, moodboards, and creative library."
              : "Launch an instant curated designer profile or create your own custom demo persona."}
        </p>
      </div>

      {/* DEMO MODE VIEW */}
      {mode === "demo" && (
        <div className="mt-8 space-y-6">
          {/* Quick 1-Click Launch */}
          <div className="relative overflow-hidden rounded-3xl border border-accent/40 bg-accent/5 p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                  <Sparkles className="size-3" /> Recommended
                </span>
                <h3 className="mt-2 font-display text-2xl italic">Lead Studio Designer</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pre-loaded with 500 studio credits, Style DNA workspace, and full pipeline access.
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => launchDemo()}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-semibold text-background transition-all hover:bg-accent hover:shadow-glow disabled:opacity-60"
              >
                Launch Default Demo <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Curated Preset Personas */}
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Or Pick a Curated Persona
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {DEMO_PRESETS.slice(1).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={loading}
                  onClick={() => launchDemo(preset)}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-accent hover:shadow-sm"
                >
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-accent">
                      {preset.archetype}
                    </span>
                    <p className="mt-1.5 font-display text-lg italic leading-tight group-hover:text-accent transition-colors">
                      {preset.name}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                      {preset.role}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5 text-[10px] text-muted-foreground">
                    <span>{preset.email.split("@")[1]}</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Create Custom Demo User Section */}
          <div className="rounded-2xl border border-border bg-card/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Create a Custom Demo User</p>
                <p className="text-xs text-muted-foreground">
                  Test the platform with a custom name, title, and identity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomDemoForm(!showCustomDemoForm)}
                className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bone"
              >
                {showCustomDemoForm ? "Hide Form" : "Customize Demo User"}
              </button>
            </div>

            {showCustomDemoForm && (
              <form
                onSubmit={handleCreateCustomDemo}
                className="mt-4 space-y-3 border-t border-border/50 pt-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Full Name">
                    <input
                      value={customDemoName}
                      onChange={(e) => setCustomDemoName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                      placeholder="e.g. Maya Lin"
                    />
                  </Field>
                  <Field label="Role / Title">
                    <input
                      value={customDemoRole}
                      onChange={(e) => setCustomDemoRole(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                      placeholder="e.g. Spatial Architect"
                    />
                  </Field>
                </div>
                <Field label="Email (Optional)">
                  <input
                    type="email"
                    value={customDemoEmail}
                    onChange={(e) => setCustomDemoEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
                    placeholder="maya@paletteprint.studio"
                  />
                </Field>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-medium text-background transition-all hover:brightness-110 disabled:opacity-60"
                >
                  <Wand2 className="size-3.5" /> Create & Launch Custom Demo User
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SIGN IN & SIGN UP FORM */}
      {mode !== "demo" && (
        <div className="mt-8">
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Full Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  placeholder="e.g. Maya Lin"
                />
              </Field>
            )}

            <Field label="Email Address">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                placeholder="designer@paletteprint.studio"
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                placeholder="At least 6 characters"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-foreground px-5 py-3.5 text-sm font-medium text-background transition-all hover:bg-accent hover:shadow-glow disabled:opacity-60"
            >
              {loading
                ? "Processing…"
                : mode === "signup"
                  ? "Create Studio Account & Enter"
                  : "Sign In to Studio"}
            </button>
          </form>

          {/* Quick Demo Access banner below form */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-4 text-xs">
            <div className="flex items-center gap-2.5">
              <Compass className="size-4 text-accent shrink-0" />
              <span className="text-muted-foreground">
                Just want to explore? Skip credentials with Demo Mode.
              </span>
            </div>
            <button
              type="button"
              onClick={() => launchDemo()}
              className="shrink-0 font-medium text-accent hover:underline"
            >
              1-Click Demo Login →
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {mode === "signup"
                ? "Already have an account? Sign in here"
                : "Need an account? Create one in seconds"}
            </button>
          </div>
        </div>
      )}

      {/* System Mode Indicator */}
      <div className="mt-12 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground/80">
        <Shield className="size-3.5 text-accent/80" />
        <span>Studio Authentication Engine · Offline & Local Storage Enabled</span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
