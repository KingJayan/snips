import { readStringSetting, SETTINGS_KEYS } from "#lib/settings.ts";
import { CHAT_MODES, type ChatMessage, type ChatMode, type ChatProvider, type ChatSnippet } from "#lib/ai/chat-types.ts";
import { supabase } from "#lib/supabase.ts";

export type ProviderId = ChatProvider | "puterjs";

export type ProviderOption = {
  id: ProviderId;
  label: string;
  description: string;
  models: string[];
  requiresApiKey: boolean;
  supportsBaseUrl: boolean;
};

export const PROVIDERS: ProviderOption[] = [
  { id: "openai", label: "openai (gpt / codex)", description: "use openai models including gpt and codex variants.", models: ["gpt-5-mini", "gpt-5", "codex-mini-latest", "gpt-4.1-mini"], requiresApiKey: true, supportsBaseUrl: false },
  { id: "anthropic", label: "anthropic (claude)", description: "use anthropic claude models.", models: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"], requiresApiKey: true, supportsBaseUrl: false },
  { id: "gemini", label: "google gemini", description: "use gemini models from google ai studio.", models: ["gemini-pro-latest", "gemini-flash-latest", "gemini-3.5-flash"], requiresApiKey: true, supportsBaseUrl: false },
  { id: "openrouter", label: "openrouter (qwen / llama / etc)", description: "access many model families including qwen and llama.", models: ["qwen/qwen3-coder", "meta-llama/llama-3.1-70b-instruct", "deepseek/deepseek-r1"], requiresApiKey: true, supportsBaseUrl: false },
  { id: "openai-compatible", label: "openai-compatible (custom)", description: "any endpoint that supports /chat/completions.", models: ["llama-3.1-70b-instruct", "mistral-large-latest", "gpt-4.1-mini"], requiresApiKey: true, supportsBaseUrl: true },
  { id: "puterjs", label: "puterjs ai", description: "use puterjs browser ai models.", models: ["gpt-4.1-mini", "gpt-4o-mini"], requiresApiKey: false, supportsBaseUrl: false },
];

export const providerById = (id: string) => PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];

const KEYS = { provider: "snips.ai.provider", model: "snips.ai.model", baseUrl: "snips.ai.baseUrl", apiKey: "snips.ai.apiKey.session" };

export type ChatConfig = { provider: ProviderId; model: string; mode: ChatMode; apiKey: string; baseUrl: string };

export function readChatConfig(): ChatConfig {
  const fallback: ChatConfig = { provider: "openai", model: "gpt-5-mini", mode: "improve", apiKey: "", baseUrl: "" };
  try {
    const provider = providerById(localStorage.getItem(KEYS.provider) ?? "").id;
    const mode = readStringSetting(SETTINGS_KEYS.aiDefaultMode, "improve") as ChatMode;
    return {
      provider,
      model: localStorage.getItem(KEYS.model) || providerById(provider).models[0],
      mode: CHAT_MODES.includes(mode) ? mode : "improve",
      apiKey: sessionStorage.getItem(KEYS.apiKey) ?? "",
      baseUrl: localStorage.getItem(KEYS.baseUrl) ?? "",
    };
  } catch {
    return fallback;
  }
}

export function writeChatConfig({ provider, model, mode, apiKey, baseUrl }: ChatConfig) {
  try {
    localStorage.setItem(SETTINGS_KEYS.aiDefaultMode, mode);
    localStorage.setItem(KEYS.provider, provider);
    localStorage.setItem(KEYS.model, model);
    localStorage.setItem(KEYS.baseUrl, baseUrl);
    if (apiKey.trim()) sessionStorage.setItem(KEYS.apiKey, apiKey);
    else sessionStorage.removeItem(KEYS.apiKey);
  } catch {
    return;
  }
}

let serverKeys: Promise<string[]> | null = null;

export function fetchServerKeys() {
  serverKeys ??= fetch("/api/ai/chat")
    .then((response) => response.json())
    .then((payload: { serverKeys?: string[] }) => payload.serverKeys ?? [])
    .catch(() => []);
  return serverKeys;
}

export async function postChat(config: ChatConfig, messages: ChatMessage[], snippet: ChatSnippet) {
  const { data } = (await supabase?.auth.getSession()) ?? { data: null };
  const token = data?.session?.access_token;
  if (!token) throw new Error("your session expired. refresh and sign in again.");

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...config, messages, snippet }),
  });
  const payload = (await response.json().catch(() => ({}))) as { reply?: string; error?: string };
  if (!response.ok || !payload.reply) throw new Error(payload.error ?? "chat request failed");
  return payload.reply;
}
