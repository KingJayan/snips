import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "$app/env/public";

export function serverClient(token?: string) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
}

export async function authenticate(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return { client: null, userId: null, error: "authorization required" };

  const client = serverClient(token);
  if (!client) return { client: null, userId: null, error: "supabase auth is not configured" };

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { client: null, userId: null, error: "invalid or expired session" };

  return { client, userId: data.user.id, error: null };
}
