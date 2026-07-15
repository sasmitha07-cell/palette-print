import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SaveDnaInput = z.object({
  name: z.string().min(1).max(120),
  style_name: z.string().optional(),
  confidence: z.number().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  palette: z.record(z.string(), z.any()).optional(),
  typography: z.record(z.string(), z.any()).optional(),
  mood: z.record(z.string(), z.any()).optional(),
  fingerprint: z.record(z.string(), z.any()).optional(),
});

export const saveDnaProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveDnaInput.parse(input))
  .handler(async ({ data, context }) => {
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
    const { data, error } = await context.supabase
      .from("dna_profiles")
      .select("id, name, style_name, confidence, tags, is_favorite, archived, created_at")
      .eq("archived", false)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const deleteDnaProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dna_profiles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, plan, credits, created_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().max(120).optional(),
        username: z.string().min(3).max(40).optional(),
        avatar_url: z.string().url().optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
