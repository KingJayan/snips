import { json, type RequestHandler } from "@sveltejs/kit";
import { ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY } from "$app/env/private";
import { normalizeMessages } from "#lib/ai/chat-normalize.ts";
import { providers } from "#lib/ai/providers/index.ts";
import { validateAiBaseUrl } from "#lib/ai/url-security.ts";
import { CHAT_MODES, type ChatRequestBody } from "#lib/ai/chat-types.ts";
import { authenticate } from "#lib/server/supabase.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

const LIMITS = {
  minute: { window: 60, max: 24 },
  day: { window: 86_400, max: 100 },
};

const SERVER_KEYS: Partial<Record<ChatRequestBody["provider"], string | undefined>> = {
  openai: OPENAI_API_KEY,
  anthropic: ANTHROPIC_API_KEY,
  gemini: GEMINI_API_KEY,
  openrouter: OPENROUTER_API_KEY,
};

export const GET: RequestHandler = () => json({ serverKeys: Object.keys(SERVER_KEYS).filter((id) => SERVER_KEYS[id as keyof typeof SERVER_KEYS]) });

async function consumeRateLimit(client: SupabaseClient, bucket: keyof typeof LIMITS) {
  const { window, max } = LIMITS[bucket];
  const { data, error } = await client.rpc("consume_ai_rate_limit", { p_bucket: bucket, p_window_seconds: window, p_max: max });
  return error || typeof data !== "number" ? window : data;
}

function rateLimited(retryAfterSeconds: number) {
  return json(
    { error: "rate limit exceeded. please wait before sending another request.", retryAfterMs: retryAfterSeconds * 1000 },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const auth = await authenticate(request);
    if (!auth.client) {
      return json({ error: auth.error ?? "unauthorized" }, { status: 401 });
    }

    const minuteWait = await consumeRateLimit(auth.client, "minute");
    if (minuteWait) return rateLimited(minuteWait);

    const body = (await request.json()) as ChatRequestBody;

    if (!body || typeof body !== "object") {
      return json({ error: "invalid payload" }, { status: 400 });
    }

    if (!body.provider || !body.model || !Array.isArray(body.messages)) {
      return json({ error: "provider, model, and messages are required" }, { status: 400 });
    }

    const mode = body.mode ?? "improve";
    if (!CHAT_MODES.includes(mode)) {
      return json({ error: "invalid mode" }, { status: 400 });
    }

    const messages = normalizeMessages({
      messages: body.messages,
      snippet: body.snippet,
      mode,
    });
    if (!messages.length) {
      return json({ error: "at least one message is required" }, { status: 400 });
    }

    const provider = providers[body.provider];
    if (!provider) {
      return json({ error: "unsupported provider" }, { status: 400 });
    }

    const ownKey = body.apiKey?.trim() ?? "";
    const resolvedApiKey = ownKey || SERVER_KEYS[body.provider]?.trim() || "";
    if (!resolvedApiKey) {
      return json({ error: "api key is required for this provider" }, { status: 400 });
    }

    if (!ownKey) {
      const dayWait = await consumeRateLimit(auth.client, "day");
      if (dayWait) return rateLimited(dayWait);
    }

    let sanitizedBaseUrl = "";
    if (provider.requiresBaseUrl) {
      const result = await validateAiBaseUrl(body.baseUrl ?? "");
      if (!result.ok) {
        return json({ error: result.error }, { status: 400 });
      }
      sanitizedBaseUrl = result.normalized;
    }

    const result = await provider.handler({
      body: {
        ...body,
        apiKey: resolvedApiKey || undefined,
        baseUrl: sanitizedBaseUrl,
      },
      messages,
    });
    if (result.error) {
      return json({ error: result.error }, { status: 502 });
    }

    if (!result.reply) {
      return json({ error: "empty response from provider" }, { status: 502 });
    }

    return json({ reply: result.reply });
  } catch {
    return json({ error: "request failed" }, { status: 500 });
  }
};
