import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.5-flash";

async function callChatJson(system: string, user: string): Promise<any> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system + "\n\nReturn ONLY valid minified JSON. No markdown, no code fences." },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (res.status === 429) throw new Error("Rate limit exceeded — please retry shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in your workspace billing.");
  if (!res.ok) throw new Error(`AI gateway error: ${res.status} ${await res.text().catch(() => "")}`);
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : { error: "parse_failed", raw: content };
  }
}

async function callChatText(system: string, messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (res.status === 429) throw new Error("Rate limit exceeded — please retry shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in your workspace billing.");
  if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

const DnaSchema = z
  .object({
    name: z.string().optional(),
    style_name: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    palette: z.any().optional(),
    typography: z.any().optional(),
    mood: z.any().optional(),
    fingerprint: z.any().optional(),
  })
  .passthrough();

const SurfaceEnum = z.enum(["web", "brand", "logo", "social", "portfolio", "deck"]);

export const generateConcepts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ dna: DnaSchema, surface: SurfaceEnum, count: z.number().min(1).max(12).default(10) }).parse(input),
  )
  .handler(async ({ data }) => {
    const surfaceMap: Record<string, string> = {
      web: "Website designs",
      brand: "Branding systems",
      logo: "Logo designs",
      social: "Social media content directions",
      portfolio: "Portfolio designs",
      deck: "Presentation designs",
    };
    const system = `You are an award-winning creative director. Generate ${data.count} distinctive ${surfaceMap[data.surface]} concepts strictly reflecting the given Style DNA. Every concept must be unique, editorial, and premium.`;
    const user = `STYLE DNA:\n${JSON.stringify(data.dna)}\n\nReturn JSON: {"concepts":[{"name","description","direction","style_explanation","prompt"} x ${data.count}]}`;
    return callChatJson(system, user);
  });

export const chatWithDna = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        dna: DnaSchema,
        messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const system = `You are the user's personal AI Creative Director. You have full access to their Style DNA and must ALWAYS anchor advice to it — reference specific colors, typography, moods, and fingerprint traits. Be practical, editorial, and specific. Keep replies under 220 words.\n\nSTYLE DNA:\n${JSON.stringify(data.dna)}`;
    const text = await callChatText(system, data.messages);
    return { reply: text };
  });

export const generateBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ dna: DnaSchema, kind: z.string(), context: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const system = `You are a senior creative strategist. Produce a complete, export-ready ${data.kind}. Structure with clear sections and bullet points.`;
    const user = `Style DNA: ${JSON.stringify(data.dna)}\nExtra context: ${data.context ?? "none"}\n\nReturn JSON: {"title","summary","sections":[{"heading","content"}]}`;
    return callChatJson(system, user);
  });

export const critiqueDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ dna: DnaSchema, description: z.string().min(4) }).parse(input),
  )
  .handler(async ({ data }) => {
    const system = `You are a design critique engine. Score how well a submitted design matches the user's Style DNA. Be honest and specific.`;
    const user = `DNA: ${JSON.stringify(data.dna)}\n\nSUBMITTED DESIGN DESCRIPTION:\n${data.description}\n\nReturn JSON: {"overall":0-100,"scores":{"typography":0-100,"colors":0-100,"spacing":0-100,"layout":0-100,"mood":0-100},"strengths":["..."],"gaps":["..."],"suggestions":["..."]}`;
    return callChatJson(system, user);
  });

export const generateBrandKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ dna: DnaSchema, brand_name: z.string().optional() }).parse(input))
  .handler(async ({ data }) => {
    const system = `You are a brand systems designer. Produce a complete brand kit anchored to the given DNA.`;
    const user = `DNA: ${JSON.stringify(data.dna)}\nBrand name: ${data.brand_name ?? "Unnamed Brand"}\n\nReturn JSON: {"logo_direction","color_system":[{"name","hex","use"}],"typography":{"display","body","pairing_notes"},"icon_style","illustration_style","photography_style","brand_voice","brand_personality"}`;
    return callChatJson(system, user);
  });

export const generateSocialContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        dna: DnaSchema,
        platform: z.enum(["instagram", "linkedin", "pinterest", "twitter"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const system = `You are a social content strategist. Generate 10 concepts tailored for ${data.platform} that reflect the user's Style DNA.`;
    const user = `DNA: ${JSON.stringify(data.dna)}\n\nReturn JSON: {"concepts":[{"type","title","hook","description","visual_direction"} x 10]}`;
    return callChatJson(system, user);
  });

export const generateRemix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        dna: DnaSchema,
        blend: z.record(z.string(), z.number()),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const system = `You are a Style Remix engine. Blend the user's DNA with the given aesthetic vector percentages and produce a new coherent style.`;
    const user = `Original DNA: ${JSON.stringify(data.dna)}\nBlend: ${JSON.stringify(data.blend)}\n\nReturn JSON: {"style_name","summary","palette":[{"name","hex"} x 5-6],"mood":[{"label","value"} x 6],"typography":{"display","body"},"surface_recommendations":["..."]}`;
    return callChatJson(system, user);
  });

export const generateMoodboardPrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ dna: DnaSchema, theme: z.string().optional() }).parse(input))
  .handler(async ({ data }) => {
    const system = `You are a moodboard curator. Produce 18 short image prompts (each 8-14 words) that together form a cohesive moodboard for the user's DNA.`;
    const user = `DNA: ${JSON.stringify(data.dna)}\nTheme: ${data.theme ?? "signature"}\n\nReturn JSON: {"prompts":["..." x 18]}`;
    return callChatJson(system, user);
  });

export const generateWebsiteSections = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        dna: DnaSchema,
        website_type: z.enum(["saas", "startup", "portfolio", "agency", "ecommerce"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const system = `You are a senior product designer. Design a complete website structure for a ${data.website_type} project that follows the user's DNA.`;
    const user = `DNA: ${JSON.stringify(data.dna)}\n\nReturn JSON: {"hero":{"headline","subhead","cta","visual"},"features":[{"title","body"} x 4],"testimonials":[{"quote","author"} x 3],"cta":{"headline","body","button"},"footer":{"columns":[{"heading","links":["..."]}]}}`;
    return callChatJson(system, user);
  });

export const generatePrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ dna: DnaSchema, target: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const system = `You are a prompt engineer. Produce 6 excellent ready-to-copy prompts optimized for ${data.target}, all rooted in the user's Style DNA.`;
    const user = `DNA: ${JSON.stringify(data.dna)}\n\nReturn JSON: {"prompts":[{"tag","text"} x 6]}`;
    return callChatJson(system, user);
  });

// ---------- Project workspace ----------

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        kind: z.string().default("ai-studio"),
        dna_profile_id: z.string().uuid().optional(),
        data: z.record(z.string(), z.any()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({
        name: data.name,
        kind: data.kind,
        dna_profile_id: data.dna_profile_id ?? null,
        user_id: context.userId,
        data: data.data ?? {},
      })
      .select("id, name, kind, created_at, updated_at, data")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("id, name, kind, created_at, updated_at, data, archived")
      .eq("archived", false)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(120).optional(),
        data: z.record(z.string(), z.any()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: { updated_at: string; name?: string; data?: Record<string, unknown> } = {
      updated_at: new Date().toISOString(),
    };
    if (data.name) patch.name = data.name;
    if (data.data) patch.data = data.data;
    const { error } = await context.supabase.from("projects").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: src, error: e1 } = await context.supabase
      .from("projects")
      .select("name, kind, dna_profile_id, data")
      .eq("id", data.id)
      .single();
    if (e1 || !src) throw new Error(e1?.message ?? "Not found");
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({
        name: `${src.name} (copy)`,
        kind: src.kind,
        dna_profile_id: src.dna_profile_id,
        user_id: context.userId,
        data: src.data ?? {},
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
