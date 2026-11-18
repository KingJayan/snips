import { json, type RequestHandler } from "@sveltejs/kit";
import { ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY, OPENAI_COMPATIBLE_API_KEY, OPENROUTER_API_KEY } from "$app/env/private";
import { normalizeMessages } from "#lib/ai/chat-normalize.ts";
import { providers } from "#lib/ai/providers/index.ts";
import { validateAiBaseUrl } from "#lib/ai/url-security.ts";
import type { ChatMode, ChatRequestBody } from "#lib/ai/chat-types.ts";
import { authenticate } from "#lib/server/supabase.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_MODES: ChatMode[] = ["improve", "refactor", "debug", "explain"];
const AI_CHAT_WINDOW_SECONDS = 60;
const AI_CHAT_MAX_REQUESTS_PER_WINDOW = 24;

async function consumeRateLimit(client: SupabaseClient) {
  const { data, error } = await client.rpc("consume_ai_rate_limit", {
    p_window_seconds: AI_CHAT_WINDOW_SECONDS,
    p_max: AI_CHAT_MAX_REQUESTS_PER_WINDOW,
  });

  if (error || typeof data !== "number") {
    return { allowed: false, retryAfterSeconds: AI_CHAT_WINDOW_SECONDS };
  }

  return { allowed: data === 0, retryAfterSeconds: data };
}

function resolveApiKey(providerId: ChatRequestBody["provider"], requestApiKey?: string) {
  if (requestApiKey?.trim()) {
    return requestApiKey.trim();
  }

  const envByProvider: Partial<Record<ChatRequestBody["provider"], string | undefined>> = {
    openai: OPENAI_API_KEY,
    anthropic: ANTHROPIC_API_KEY,
    gemini: GEMINI_API_KEY,
    openrouter: OPENROUTER_API_KEY,
    "openai-compatible": OPENAI_COMPATIBLE_API_KEY,
  };

  return envByProvider[providerId]?.trim() || "";
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const auth = await authenticate(request);
    if (!auth.client) {
      return json({ error: auth.error ?? "unauthorized" }, { status: 401 });
    }

    const rateLimit = await consumeRateLimit(auth.client);
    if (!rateLimit.allowed) {
      return json(
        {
          error: "rate limit exceeded. please wait before sending another request.",
          retryAfterMs: rateLimit.retryAfterSeconds * 1000,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = (await request.json()) as ChatRequestBody;

    if (!body || typeof body !== "object") {
      return json({ error: "invalid payload" }, { status: 400 });
    }

    if (!body.provider || !body.model || !Array.isArray(body.messages)) {
      return json({ error: "provider, model, and messages are required" }, { status: 400 });
    }

    const mode = body.mode ?? "improve";
    if (!ALLOWED_MODES.includes(mode)) {
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

    const resolvedApiKey = resolveApiKey(body.provider, body.apiKey);
    if (provider.requiresApiKey && !resolvedApiKey) {
      return json({ error: "api key is required for this provider" }, { status: 400 });
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
