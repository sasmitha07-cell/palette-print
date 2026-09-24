import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { paletteAuth } from "@/integrations/supabase/dev-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // 1. Check local session from paletteAuth
    const local = paletteAuth.getSession();
    if (local?.user) {
      return { user: local.user };
    }

    // 2. Check supabase session
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        return { user: data.session.user };
      }
    } catch {
      // Supabase offline / paused
    }

    // 3. Check fallback in localStorage
    if (typeof window !== "undefined") {
      const demoRaw = localStorage.getItem("palette_demo_session");
      if (demoRaw) {
        try {
          const parsed = JSON.parse(demoRaw);
          if (parsed?.user) return { user: parsed.user };
        } catch {
          // ignore
        }
      }
    }

    // 3. Check remote getUser if available
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) return { user: data.user };
    } catch {
      // network offline
    }

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
