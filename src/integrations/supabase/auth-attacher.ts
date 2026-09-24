import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";
import { paletteAuth } from "./dev-auth";

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;

    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    } catch {
      // Supabase offline / paused
    }

    if (!token && typeof window !== "undefined") {
      const localSession = paletteAuth.getSession();
      token = localSession?.access_token;
    }

    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
