/**
 * Local & Offline authentication system for Palette Print.
 * Provides resilient authentication when the Supabase project is offline or paused.
 * Supports:
 * - User Sign Up (storing credentials in local store)
 * - User Sign In (validating credentials against local store)
 * - 1-Click Default Demo User
 * - Preset Demo Personas (Fashion Director, Bauhaus Printmaker, Kinetic Colorist)
 * - Custom Demo User Creation
 * - Reactive session management across SiteNav, router guards, and profile
 */

export interface PaletteUser {
  id: string;
  email: string;
  full_name: string;
  role?: string;
  avatar_url?: string;
  plan?: string;
  credits?: number;
  created_at: string;
  is_demo?: boolean;
}

export interface PaletteSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at: string;
    confirmed_at: string;
    last_sign_in_at: string;
    app_metadata: { provider: string; providers: string[] };
    user_metadata: {
      full_name: string;
      role?: string;
      is_demo?: boolean;
      plan?: string;
      credits?: number;
    };
    created_at: string;
    updated_at: string;
  };
}

export interface DemoPersona {
  id: string;
  name: string;
  role: string;
  email: string;
  tagline: string;
  archetype: string;
}

export const DEMO_PRESETS: DemoPersona[] = [
  {
    id: "demo-studio-designer",
    name: "Studio Designer",
    role: "Lead Creative Technologist",
    email: "designer@paletteprint.studio",
    tagline: "Multidisciplinary visual intelligence & generative aesthetics",
    archetype: "Contemporary Editorial",
  },
  {
    id: "demo-elena-rostova",
    name: "Elena Rostova",
    role: "Luxury Fashion Director",
    email: "elena.rostova@atelier-vogue.design",
    tagline: "Haute couture palettes, tactile textures, and sculptural silhouettes",
    archetype: "Modern Haute Minimalist",
  },
  {
    id: "demo-marcus-chen",
    name: "Marcus Chen",
    role: "Bauhaus Printmaker",
    email: "marcus.chen@bauhaus-lab.io",
    tagline: "Constructivist geometries, primary rhythms, and risograph grain",
    archetype: "Bauhaus Constructivism",
  },
  {
    id: "demo-aria-sol",
    name: "Aria Sol",
    role: "Kinetic Colorist",
    email: "aria.sol@chroma-studio.art",
    tagline: "Iridescent prisms, neon gradients, and fluid chromatic fields",
    archetype: "Chromatic Futurism",
  },
];

const LOCAL_USERS_KEY = "palette_local_users";
const SESSION_KEY = "palette_demo_session";
const AUTH_EVENT = "palette-auth-state-change";

function base64UrlEncode(str: string): string {
  if (typeof window !== "undefined" && typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  return Buffer.from(str, "utf-8").toString("base64url");
}

function getProjectId(): string {
  if (typeof window === "undefined") return "vlxqeulmsyuqflbdxgkb";
  const fromEnv =
    import.meta.env.VITE_SUPABASE_PROJECT_ID ||
    (import.meta.env.VITE_SUPABASE_URL
      ? new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split(".")[0]
      : "vlxqeulmsyuqflbdxgkb");
  return fromEnv || "vlxqeulmsyuqflbdxgkb";
}

function notifyAuthChange(session: PaletteSession | null) {
  if (typeof window === "undefined") return;
  try {
    const event = new CustomEvent(AUTH_EVENT, { detail: { session } });
    window.dispatchEvent(event);
  } catch {
    // ignore
  }
}

function generateLocalToken(userId: string, email: string, name: string, isDemo = false): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 365 * 24 * 3600;

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: userId,
    email,
    aud: "authenticated",
    role: "authenticated",
    user_metadata: {
      full_name: name,
      is_demo: isDemo,
    },
    iat: now,
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedHeader}.${encodedPayload}.${isDemo ? "palette_dev_signature" : "palette_local_signature"}`;
}

function createSessionObject(
  user: PaletteUser,
  token: string,
): PaletteSession {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 365 * 24 * 3600;

  return {
    access_token: token,
    token_type: "bearer",
    expires_in: 31536000,
    expires_at: exp,
    refresh_token: token,
    user: {
      id: user.id,
      aud: "authenticated",
      role: "authenticated",
      email: user.email,
      email_confirmed_at: user.created_at,
      confirmed_at: user.created_at,
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {
        full_name: user.full_name,
        role: user.role,
        is_demo: user.is_demo ?? false,
        plan: user.plan || "pro",
        credits: user.credits ?? 250,
      },
      created_at: user.created_at,
      updated_at: new Date().toISOString(),
    },
  };
}

function persistSession(session: PaletteSession) {
  if (typeof window === "undefined") return;
  const projectId = getProjectId();
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(`sb-${projectId}-auth-token`, JSON.stringify(session));
  } catch (e) {
    console.warn("Failed to persist session to localStorage", e);
  }
  notifyAuthChange(session);
}

// Local accounts storage
interface StoredAccount extends PaletteUser {
  password_hash: string;
}

function getStoredAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredAccounts(accounts: StoredAccount[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn("Failed to save accounts to localStorage", e);
  }
}

// Minimal portable string hash for local dev accounts
function hashPassword(pwd: string): string {
  let hash = 0;
  for (let i = 0; i < pwd.length; i++) {
    hash = (hash << 5) - hash + pwd.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}`;
}

export const paletteAuth = {
  /**
   * Register a new user in the local studio store and log them in immediately.
   */
  async signUp(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ user: PaletteUser; session: PaletteSession }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const name = input.name.trim() || "Studio Creator";

    if (!normalizedEmail || !input.password) {
      throw new Error("Email and password are required.");
    }
    if (input.password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const accounts = getStoredAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);

    if (existing) {
      // If account already exists with same password, log them in
      if (existing.password_hash === hashPassword(input.password)) {
        const token = generateLocalToken(existing.id, existing.email, existing.full_name, false);
        const session = createSessionObject(existing, token);
        persistSession(session);
        return { user: existing, session };
      }
      throw new Error("An account with this email already exists. Please sign in.");
    }

    const newUserId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newUser: StoredAccount = {
      id: newUserId,
      email: normalizedEmail,
      full_name: name,
      role: "Studio Creator",
      plan: "pro",
      credits: 250,
      created_at: new Date().toISOString(),
      is_demo: false,
      password_hash: hashPassword(input.password),
    };

    accounts.push(newUser);
    saveStoredAccounts(accounts);

    const token = generateLocalToken(newUser.id, newUser.email, newUser.full_name, false);
    const session = createSessionObject(newUser, token);
    persistSession(session);

    return { user: newUser, session };
  },

  /**
   * Sign in using email and password against local accounts or demo profiles.
   */
  async signInWithPassword(input: {
    email: string;
    password: string;
  }): Promise<{ user: PaletteUser; session: PaletteSession }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const accounts = getStoredAccounts();

    // Check registered accounts
    const account = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);
    if (account) {
      if (account.password_hash !== hashPassword(input.password)) {
        throw new Error("Invalid password for this account.");
      }
      const token = generateLocalToken(account.id, account.email, account.full_name, false);
      const session = createSessionObject(account, token);
      persistSession(session);
      return { user: account, session };
    }

    // Check demo presets (allow demo passwords like 'demo123' or any password)
    const preset = DEMO_PRESETS.find((p) => p.email.toLowerCase() === normalizedEmail);
    if (preset) {
      const demoUser: PaletteUser = {
        id: preset.id,
        email: preset.email,
        full_name: preset.name,
        role: preset.role,
        plan: "studio",
        credits: 500,
        created_at: new Date().toISOString(),
        is_demo: true,
      };
      const token = generateLocalToken(demoUser.id, demoUser.email, demoUser.full_name, true);
      const session = createSessionObject(demoUser, token);
      persistSession(session);
      return { user: demoUser, session };
    }

    throw new Error(
      "No account found with this email. Please check your spelling or create a new account.",
    );
  },

  /**
   * Create or activate a demo session with custom or preset parameters.
   */
  createDemoSession(
    fullName = "Studio Designer",
    email = "designer@paletteprint.studio",
    role = "Lead Designer",
  ): PaletteSession {
    const userId = "00000000-0000-4000-a000-000000000001";
    const demoUser: PaletteUser = {
      id: userId,
      email: email.trim(),
      full_name: fullName.trim(),
      role,
      plan: "studio",
      credits: 500,
      created_at: new Date().toISOString(),
      is_demo: true,
    };

    const token = generateLocalToken(userId, demoUser.email, demoUser.full_name, true);
    const session = createSessionObject(demoUser, token);
    persistSession(session);
    return session;
  },

  /**
   * Create a new custom demo user persona.
   */
  createCustomDemoUser(input: {
    name: string;
    role?: string;
    email?: string;
  }): PaletteSession {
    const name = input.name.trim() || "Creative Explorer";
    const role = input.role?.trim() || "Independent Designer";
    const email =
      input.email?.trim() ||
      `${name.toLowerCase().replace(/[^a-z0-9]/g, "") || "demo"}@paletteprint.studio`;

    const customId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `demo_${Date.now()}`;

    const demoUser: PaletteUser = {
      id: customId,
      email,
      full_name: name,
      role,
      plan: "studio",
      credits: 500,
      created_at: new Date().toISOString(),
      is_demo: true,
    };

    const token = generateLocalToken(customId, email, name, true);
    const session = createSessionObject(demoUser, token);
    persistSession(session);
    return session;
  },

  /**
   * Retrieve current active session from localStorage.
   */
  getSession(): PaletteSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  },

  /**
   * Retrieve current active user.
   */
  getUser(): PaletteSession["user"] | null {
    const s = this.getSession();
    return s?.user ?? null;
  },

  /**
   * Sign out and clear all sessions.
   */
  signOut() {
    if (typeof window === "undefined") return;
    const projectId = getProjectId();
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(`sb-${projectId}-auth-token`);
    } catch {
      // ignore
    }
    notifyAuthChange(null);
  },

  /**
   * Listen to local auth state changes.
   */
  onAuthStateChange(callback: (session: PaletteSession | null) => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ session: PaletteSession | null }>;
      callback(customEvent.detail?.session ?? null);
    };

    const storageHandler = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) {
        try {
          const session = e.newValue ? JSON.parse(e.newValue) : null;
          callback(session);
        } catch {
          callback(null);
        }
      }
    };

    window.addEventListener(AUTH_EVENT, handler);
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener(AUTH_EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  },

  getDemoPresets(): DemoPersona[] {
    return DEMO_PRESETS;
  },
};

// Legacy exports for backwards compatibility
export function createDemoSession(fullName?: string, email?: string) {
  return paletteAuth.createDemoSession(fullName, email);
}

export function clearDemoSession() {
  paletteAuth.signOut();
}
