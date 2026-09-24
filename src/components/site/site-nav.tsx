import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { paletteAuth } from "@/integrations/supabase/dev-auth";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/style-dna", label: "Style DNA" },
  { to: "/ai-studio", label: "AI Studio" },
  { to: "/gallery", label: "Gallery" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const checkState = async () => {
      const local = paletteAuth.getSession();
      if (local?.user) {
        setSignedIn(true);
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        setSignedIn(!!data.session);
      } catch {
        setSignedIn(false);
      }
    };

    checkState();

    const unsubPalette = paletteAuth.onAuthStateChange((session) => {
      setSignedIn(!!session);
    });

    let unsubSupabase = () => {};
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setSignedIn(true);
        } else if (!paletteAuth.getSession()) {
          setSignedIn(false);
        }
      });
      unsubSupabase = () => sub.subscription.unsubscribe();
    } catch {
      // ignore
    }

    return () => {
      unsubPalette();
      unsubSupabase();
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        className={`flex w-full max-w-6xl items-center justify-between gap-6 rounded-full border border-border px-3 py-2 pl-6 backdrop-blur-xl transition-all duration-500 ${
          scrolled ? "bg-background/85 shadow-elegant" : "bg-background/60 shadow-none"
        }`}
      >
        <Link to="/" className="flex items-center gap-2">
          <PrismMark />
          <span className="font-display text-xl italic tracking-tight">Palette Print</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.slice(1).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-bone hover:text-foreground"
              activeProps={{
                className:
                  "rounded-full bg-bone px-3 py-1.5 text-[13px] font-medium text-foreground",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <Link
              to="/profile"
              className="rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-all hover:bg-accent hover:shadow-glow"
            >
              Account
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Sign In
              </Link>
              <Link
                to="/auth"
                className="rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-all hover:bg-accent hover:shadow-glow"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function PrismMark() {
  return (
    <span aria-hidden className="relative grid size-8 place-items-center rounded-full bg-accent/10">
      <span className="size-3 rounded-full bg-accent shadow-glow" />
      <span className="absolute inset-0 rounded-full border border-accent/30" />
    </span>
  );
}
