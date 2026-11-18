import { fetch, type RequestInit, type Response } from "undici";
import { publicAgent } from "#lib/ai/url-security.ts";

const REQUEST_TIMEOUT_MS = 45_000;

export type ProviderResult = {
  error: string | null;
  reply: string | null;
};

export async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "manual",
      dispatcher: publicAgent,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function readProviderResponse(
  response: Response,
  parse: (payload: unknown) => string | null
): Promise<ProviderResult> {
  if (!response.ok) {
    return { error: `provider returned ${response.status}`, reply: null };
  }
  const payload = await response.json().catch(() => null);
  return { error: null, reply: parse(payload) };
}

export function parseOpenAIStyleReply(payload: unknown): string | null {
  const data = payload as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? content : null;
}

export function parseAnthropicReply(payload: unknown): string | null {
  const data = payload as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const text = data?.content
    ?.filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");

  return text && text.trim() ? text : null;
}

export function parseGeminiReply(payload: unknown): string | null {
  const data = payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((part) => part.text ?? "").join("\n");
  return text && text.trim() ? text : null;
}
