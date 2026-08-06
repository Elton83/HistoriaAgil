import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = "SUPABASE_URL";
const STORAGE_ANON_KEY = "SUPABASE_ANON_KEY";

export const getSupabaseConfig = (): { url: string; key: string; isFromEnv: boolean } => {
  const env = (import.meta as any).env || {};
  const envUrl = env.VITE_SUPABASE_URL as string | undefined;
  const envKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (
    envUrl &&
    envKey &&
    envUrl.trim().length > 0 &&
    envKey.trim().length > 0 &&
    !envUrl.includes("your-supabase-project")
  ) {
    return { url: envUrl.trim(), key: envKey.trim(), isFromEnv: true };
  }

  const localUrl = typeof window !== "undefined" ? localStorage.getItem(STORAGE_URL_KEY) || "" : "";
  const localKey = typeof window !== "undefined" ? localStorage.getItem(STORAGE_ANON_KEY) || "" : "";

  return { url: localUrl.trim(), key: localKey.trim(), isFromEnv: false };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(
    url &&
    key &&
    url.trim().length > 0 &&
    key.trim().length > 0 &&
    !url.includes("your-supabase-project")
  );
};

let supabaseInstance: SupabaseClient | null = null;
let currentConfiguredUrl = "";

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();

  if (!url || !key || url.includes("your-supabase-project")) {
    supabaseInstance = null;
    return null;
  }

  if (!supabaseInstance || currentConfiguredUrl !== url) {
    currentConfiguredUrl = url;
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabaseInstance;
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_ANON_KEY, key.trim());
    supabaseInstance = null;
    currentConfiguredUrl = "";
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_ANON_KEY);
    supabaseInstance = null;
    currentConfiguredUrl = "";
  }
};

export const supabase = getSupabaseClient();

