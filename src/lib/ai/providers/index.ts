import { callAnthropicProvider } from "#lib/ai/providers/anthropic.ts";
import { callGeminiProvider } from "#lib/ai/providers/gemini.ts";
import { callOpenAICompatibleProvider } from "#lib/ai/providers/openai-compatible.ts";
import { callOpenAIProvider } from "#lib/ai/providers/openai.ts";
import { callOpenRouterProvider } from "#lib/ai/providers/openrouter.ts";
import type { ProviderResult } from "#lib/ai/providers/shared.ts";
import type { ChatMessage, ChatProvider, ChatRequestBody } from "#lib/ai/chat-types.ts";

type ProviderHandler = (params: { body: ChatRequestBody; messages: ChatMessage[] }) => Promise<ProviderResult>;

export const providers: Record<ChatProvider, { handler: ProviderHandler; requiresBaseUrl: boolean }> = {
  openai: { handler: callOpenAIProvider, requiresBaseUrl: false },
  anthropic: { handler: callAnthropicProvider, requiresBaseUrl: false },
  gemini: { handler: callGeminiProvider, requiresBaseUrl: false },
  openrouter: { handler: callOpenRouterProvider, requiresBaseUrl: false },
  "openai-compatible": { handler: callOpenAICompatibleProvider, requiresBaseUrl: true },
};
