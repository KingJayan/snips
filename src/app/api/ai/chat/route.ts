import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeMessages } from "@/lib/ai/chat-normalize";
import { providers } from "@/lib/ai/providers";
import { validateAiBaseUrl } from "@/lib/ai/url-security";
import type { ChatMode, ChatRequestBody } from "@/lib/ai/chat-types";

const ALLOWED_MODES: ChatMode[] = ["improve", "refactor", "debug", "explain"];
const AI_CHAT_WINDOW_SECONDS = 60;
const AI_CHAT_MAX_REQUESTS_PER_WINDOW = 24;

function getUserSupabaseClient(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function authenticate(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return { client: null, error: "authorization required" };
  }

  const client = getUserSupabaseClient(token);
  if (!client) {
    return { client: null, error: "supabase auth is not configured" };
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { client: null, error: "invalid or expired session" };
  }

  return { client, error: null };
}

async function consumeRateLimit(client: NonNullable<ReturnType<typeof getUserSupabaseClient>>) {
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
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    "openai-compatible": process.env.OPENAI_COMPATIBLE_API_KEY,
  };

  return envByProvider[providerId]?.trim() || "";
}

export async function POST(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth.client) {
      return NextResponse.json({ error: auth.error ?? "unauthorized" }, { status: 401 });
    }

    const rateLimit = await consumeRateLimit(auth.client);
    if (!rateLimit.allowed) {
      return NextResponse.json(
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
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    if (!body.provider || !body.model || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "provider, model, and messages are required" }, { status: 400 });
    }

    const mode = body.mode ?? "improve";
    if (!ALLOWED_MODES.includes(mode)) {
      return NextResponse.json({ error: "invalid mode" }, { status: 400 });
    }

    const messages = normalizeMessages({
      messages: body.messages,
      snippet: body.snippet,
      mode,
    });
    if (!messages.length) {
      return NextResponse.json({ error: "at least one message is required" }, { status: 400 });
    }

    const provider = providers[body.provider];
    if (!provider) {
      return NextResponse.json({ error: "unsupported provider" }, { status: 400 });
    }

    const resolvedApiKey = resolveApiKey(body.provider, body.apiKey);
    if (provider.requiresApiKey && !resolvedApiKey) {
      return NextResponse.json({ error: "api key is required for this provider" }, { status: 400 });
    }

    let sanitizedBaseUrl = "";
    if (provider.requiresBaseUrl) {
      const result = await validateAiBaseUrl(body.baseUrl ?? "");
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
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
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    if (!result.reply) {
      return NextResponse.json({ error: "empty response from provider" }, { status: 502 });
    }

    return NextResponse.json({ reply: result.reply });
  } catch {
    return NextResponse.json({ error: "request failed" }, { status: 500 });
  }
}
