import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runStyleDNAPipeline } from "@/lib/ai/style-dna";

const SaveDnaInput = z.object({
  name: z.string().min(1).max(120),
  style_name: z.string().optional(),
  confidence: z.number().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  palette: z.any().optional(),
  typography: z.any().optional(),
  mood: z.any().optional(),
  fingerprint: z.any().optional(),
});

const AnalyzeInput = z.object({
  images: z
    .array(
      z.object({
        id: z.string(),
        base64: z.string().min(10),
        mimeType: z.string().default("image/jpeg"),
        dominantColors: z.array(z.string()).optional(),
        cvMetrics: z.any().optional(),
      }),
    )
    .min(1)
    .max(10),
  authoritativePalette: z.array(z.string()).default([]),
});

function extractDataPayload<T>(input: unknown, parser: (val: unknown) => T): T {
  if (
    input &&
    typeof input === "object" &&
    "data" in input &&
    (input as Record<string, unknown>).data !== undefined
  ) {
    return parser((input as Record<string, unknown>).data);
  }
  return parser(input);
}

/**
 * Server-side analysis and multi-image synthesis pipeline.
 * Securely calls Gemini Vision without exposing API keys to the client.
 */
export const analyzeStyleDnaFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => extractDataPayload(input, (val) => AnalyzeInput.parse(val)))
  .handler(async ({ data }) => {
    try {
      const result = await runStyleDNAPipeline({
        images: data.images,
        authoritativePalette: data.authoritativePalette,
      });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze Style DNA";
      console.error("[analyzeStyleDnaFn] Pipeline error:", err);
      throw new Error(msg);
    }
  });

export const saveDnaProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => extractDataPayload(input, (val) => SaveDnaInput.parse(val)))
  .handler(async ({ data, context }) => {
    if (context.isLocal) {
      const localId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `dna_${Date.now()}`;
      return { id: localId };
    }
    const { data: row, error } = await context.supabase
      .from("dna_profiles")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listDnaProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (context.isLocal) {
      return [];
    }
    try {
      const { data, error } = await context.supabase
        .from("dna_profiles")
        .select(
          "id, name, style_name, confidence, tags, is_favorite, archived, created_at, palette, typography, mood, fingerprint",
        )
        .eq("archived", false)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
  });

function unpackDnaRow(row: Record<string, unknown> | null | undefined) {
  if (!row) return row;
  const fp = row.fingerprint;
  if (fp && typeof fp === "object" && "fullDNA" in fp) {
    const full = (fp as { fullDNA: Record<string, unknown> }).fullDNA;
    const fpRadar = (fp as { radar?: unknown }).radar;
    return {
      ...full,
      ...row,
      id: row.id,
      identity: full.identity || {
        name: row.name || row.style_name || "Style DNA",
        tagline: full.theme || row.summary || "",
        description: row.summary || "",
        keywords: row.tags || [],
      },
      palette: full.palette || row.palette,
      typography: full.typography || row.typography,
      mood: full.mood || row.mood,
      composition: full.composition,
      density: full.density,
      contrast: full.contrast,
      texture: full.texture,
      imagery: full.imagery,
      rhythm: full.rhythm,
      principles: full.principles || [],
      doList: full.doList || [],
      dontList: full.dontList || [],
      evidence: full.evidence || [],
      fingerprint: Array.isArray(fpRadar)
        ? fpRadar
        : Array.isArray(fp)
          ? fp
          : full.fingerprint || [],
    };
  }
  return row;
}

export const getStyleDNA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) => z.object({ id: z.string() }).parse(val)),
  )
  .handler(async ({ data, context }) => {
    if (context.isLocal) {
      return null;
    }
    const { data: row, error } = await context.supabase
      .from("dna_profiles")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return unpackDnaRow(row);
  });

export const getActiveStyleDNA = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (context.isLocal) {
      return null;
    }
    const { data, error } = await context.supabase
      .from("dna_profiles")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return unpackDnaRow(data);
  });

/**
 * Direct server-side accessor for retrieving Style DNA for a user by id or active fallback.
 */
export async function getStyleDNAForUser(supabase: SupabaseClient, userId: string, dnaId?: string) {
  let query = supabase.from("dna_profiles").select("*").eq("user_id", userId).eq("archived", false);
  if (dnaId) {
    query = query.eq("id", dnaId);
  } else {
    query = query.order("created_at", { ascending: false }).limit(1);
  }
  const { data: row, error } = await (dnaId ? query.single() : query.maybeSingle());
  if (error || !row) return null;
  return unpackDnaRow(row);
}

export const deleteDnaProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) => z.object({ id: z.string() }).parse(val)),
  )
  .handler(async ({ data, context }) => {
    if (context.isLocal) {
      return { ok: true };
    }
    const { error } = await context.supabase.from("dna_profiles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userMeta = (context.claims as Record<string, unknown>)?.user_metadata as
      Record<string, unknown> | undefined;
    const email = (context.claims as Record<string, unknown>)?.email as string | undefined;

    if (context.isLocal) {
      return {
        id: context.userId,
        username: email ? email.split("@")[0] : "designer",
        full_name: (userMeta?.full_name as string) || "Studio Designer",
        avatar_url: "",
        plan: (userMeta?.plan as string) || "pro",
        credits: typeof userMeta?.credits === "number" ? userMeta.credits : 250,
        created_at: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await context.supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, plan, credits, created_at")
        .eq("id", context.userId)
        .maybeSingle();
      if (error || !data) throw new Error("not found");
      return data;
    } catch {
      return {
        id: context.userId,
        username: email ? email.split("@")[0] : "designer",
        full_name: (userMeta?.full_name as string) || "Studio Designer",
        avatar_url: "",
        plan: "pro",
        credits: 250,
        created_at: new Date().toISOString(),
      };
    }
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          full_name: z.string().max(120).optional(),
          username: z.string().min(3).max(40).optional(),
          avatar_url: z.string().url().optional().or(z.literal("")),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================================
// DOWNSTREAM AI SUITE SERVER FUNCTIONS (PHASE 3)
// ============================================================================
import { generateCreativeDirections, refineCreativeDirection } from "@/lib/ai/directions";
import { generatePromptLibrary, enhanceUserPrompt } from "@/lib/ai/prompts-library";
import { generateDynamicMoodboard, regenerateMoodboardElement } from "@/lib/ai/moodboard";
import { calculateRealDNAMatch } from "@/lib/ai/dna-match";
import { chatWithStyleDNA, askDesignTwin } from "@/lib/ai/dna-chat";

export const generateAiDirectionsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          surface: z.string(),
          surfaceTitle: z.string().optional(),
          dna: z.any(),
          projectContext: z.string().optional(),
          seedOffset: z.number().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    return generateCreativeDirections(data);
  });

export const refineAiDirectionFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          direction: z.any(),
          refinementPrompt: z.string().min(1),
          dna: z.any(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    return refineCreativeDirection(data);
  });

export const generatePromptLibraryFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          dna: z.any(),
          seedOffset: z.number().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    return generatePromptLibrary(data.dna, data.seedOffset);
  });

export const enhanceUserPromptFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          userIdea: z.string().min(1),
          targetEngine: z.string().optional(),
          category: z.string().optional(),
          dna: z.any(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    return enhanceUserPrompt(data);
  });

export const generateMoodboardFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          dna: z.any(),
          theme: z.string().optional(),
          goal: z.string().optional(),
          seed: z.number().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    return generateDynamicMoodboard(data);
  });

export const regenerateMoodboardItemFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          item: z.any(),
          dna: z.any(),
          theme: z.string().optional(),
          variantIndex: z.number().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    return regenerateMoodboardElement(
      data.item,
      data.dna,
      data.theme || "Signature",
      data.variantIndex,
    );
  });

export const checkDnaMatchFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          metrics: z.any(),
          dna: z.any(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    return calculateRealDNAMatch(data.metrics, data.dna);
  });

export const dnaChatFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant", "system"]),
              content: z.string(),
            }),
          ),
          dna: z.any(),
          projectContext: z.string().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    return chatWithStyleDNA(data.messages, data.dna, data.projectContext);
  });

export const askDesignTwinFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    extractDataPayload(input, (val) =>
      z
        .object({
          request: z.string().min(1),
          dna: z.any(),
          projectContext: z.string().optional(),
        })
        .parse(val),
    ),
  )
  .handler(async ({ data }) => {
    return askDesignTwin(data.request, data.dna, data.projectContext);
  });
