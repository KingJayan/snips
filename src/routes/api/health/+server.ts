import { json } from "@sveltejs/kit";
import { serverClient } from "#lib/server/supabase.ts";

export async function GET() {
  const client = serverClient();
  if (!client) return json({ ok: true, db: "not-configured" });

  const { error } = await client.from("snippets").select("id").limit(1);
  return json(error ? { ok: true, db: "query-error", error: error.message } : { ok: true, db: "ok" });
}
