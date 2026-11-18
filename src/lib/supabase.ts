import { createClient } from "@supabase/supabase-js";
import { APP_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "$app/env/public";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;

function magicLinkRedirectUrl() {
  const { origin, hostname } = window.location;
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  const base = (local && APP_URL) || origin;
  return `${base.trim().replace(/\/$/, "")}/snippets`;
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function sendMagicLink(email: string) {
  if (!supabase) return "supabase is not configured";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: magicLinkRedirectUrl() },
  });
  return error?.message ?? null;
}

export async function signOutUser() {
  if (!supabase) return "supabase is not configured";
  const { error } = await supabase.auth.signOut();
  return error?.message ?? null;
}
