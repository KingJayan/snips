import { callAnthropicProvider } from "#lib/ai/providers/anthropic.ts";
import { callGeminiProvider } from "#lib/ai/providers/gemini.ts";
import { callOpenAICompatibleProvider } from "#lib/ai/providers/openai-compatible.ts";
import { callOpenAIProvider } from "#lib/ai/providers/openai.ts";
import { callOpenRouterProvider } from "#lib/ai/providers/openrouter.ts";
import type { ProviderResult } from "#lib/ai/providers/shared.ts";
import type { ChatMessage, ChatProvider, ChatRequestBody } from "#lib/ai/chat-types.ts";

export type ProviderCapabilities = {
  streaming: boolean;
  systemMessages: boolean;
  tools: boolean;
};

type ProviderHandler = (params: {
  body: ChatRequestBody;
  messages: ChatMessage[];
}) => Promise<ProviderResult>;

type ProviderAdapter = {
  handler: ProviderHandler;
  capabilities: ProviderCapabilities;
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
};

export const providers: Record<ChatProvider, ProviderAdapter> = {
  openai: {
    handler: callOpenAIProvider,
    requiresApiKey: true,
    requiresBaseUrl: false,
    capabilities: {
      streaming: true,
      systemMessages: true,
      tools: true,
    },
  },
  anthropic: {
    handler: callAnthropicProvider,
    requiresApiKey: true,
    requiresBaseUrl: false,
    capabilities: {
      streaming: true,
      systemMessages: true,
      tools: true,
    },
  },
  gemini: {
    handler: callGeminiProvider,
    requiresApiKey: true,
    requiresBaseUrl: false,
    capabilities: {
      streaming: true,
      systemMessages: true,
      tools: true,
    },
  },
  openrouter: {
    handler: callOpenRouterProvider,
    requiresApiKey: true,
    requiresBaseUrl: false,
    capabilities: {
      streaming: true,
      systemMessages: true,
      tools: true,
    },
  },
  "openai-compatible": {
    handler: callOpenAICompatibleProvider,
    requiresApiKey: true,
    requiresBaseUrl: true,
    capabilities: {
      streaming: true,
      systemMessages: true,
      tools: true,
    },
  },
};
