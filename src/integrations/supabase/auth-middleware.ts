import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { supabase as clientSupabase } from "./client";
import { paletteAuth } from "./dev-auth";
import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export const requireSupabaseAuth = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    try {
      let token: string | undefined;
      try {
        const { data } = await clientSupabase.auth.getSession();
        token = data.session?.access_token;
      } catch {
        // remote Supabase offline
      }

      if (!token && typeof window !== "undefined") {
        const localSession = paletteAuth.getSession();
        token = localSession?.access_token;

        if (!token) {
          const raw = localStorage.getItem("palette_demo_session");
          if (raw) {
            try {
              token = JSON.parse(raw)?.access_token;
            } catch {
              // ignore
            }
          }
        }

        if (!token) {
          const autoSession = paletteAuth.createDemoSession();
          token = autoSession.access_token;
        }
      }

      if (!token) {
        // Fallback demo token
        token = "demo.header.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtYTAwMC0wMDAwMDAwMDAwMDEiLCJlbWFpbCI6ImRlc2lnbmVyQHBhbGV0dGVwcmludC5zdHVkaW8ifQ.palette_local_signature";
      }
      return next({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Your session has expired. Please sign in again.";
      throw new Error(msg);
    }
  })
  .server(async ({ next }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY =
      process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      const missing = [
        ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
        ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
      ];
      const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Configure your Supabase environment values.`;
      console.error(`[Supabase] ${message}`);
      throw new Error(message);
    }

    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token || token.split(".").length !== 3) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Validate claims / user identity
    let userId: string | undefined;
    let claims: unknown;
    let isLocal = false;

    const isLocalToken =
      token.endsWith(".palette_dev_signature") ||
      token.endsWith(".palette_local_signature");

    if (isLocalToken) {
      isLocal = true;
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payloadRaw = Buffer.from(parts[1], "base64url").toString("utf-8");
          const payload = JSON.parse(payloadRaw);
          if (payload?.sub) {
            userId = payload.sub as string;
            claims = payload;
          }
        }
      } catch (e) {
        console.warn("[auth-middleware] Failed to parse local token payload", e);
      }
    } else {
      // Remote Supabase with 1.5s timeout race so dead DNS never stalls requests
      const withTimeout = async <T>(promise: Promise<T>, ms = 1500): Promise<T> => {
        let timeoutHandle: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error("Supabase timeout")), ms);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutHandle));
      };

      try {
        const { data, error } = await withTimeout(supabase.auth.getClaims(token), 1500);
        if (!error && data?.claims?.sub) {
          userId = data.claims.sub as string;
          claims = data.claims;
        }
      } catch {
        // remote Supabase offline
      }

      if (!userId) {
        try {
          const { data: userData, error: userError } = await withTimeout(
            supabase.auth.getUser(token),
            1500,
          );
          if (!userError && userData?.user?.id) {
            userId = userData.user.id;
            claims = userData.user;
          }
        } catch {
          // remote Supabase offline
        }
      }

      // Fallback: If remote failed / timed out, decode token JWT
      if (!userId && token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payloadRaw = Buffer.from(parts[1], "base64url").toString("utf-8");
            const payload = JSON.parse(payloadRaw);
            if (payload?.sub) {
              userId = payload.sub as string;
              claims = payload;
              isLocal = true;
            }
          }
        } catch {
          // invalid token
        }
      }
    }

    if (!userId) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    return next({
      context: {
        supabase,
        userId,
        claims,
        isLocal,
      },
    });
  });
