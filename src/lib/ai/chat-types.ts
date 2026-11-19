export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "openai-compatible";

export const CHAT_MODES = ["improve", "refactor", "debug", "explain"] as const;
export type ChatMode = (typeof CHAT_MODES)[number];

export type ChatSnippet = {
  title?: string;
  language?: string;
  description?: string;
  code?: string;
};

export type ChatRequestBody = {
  provider: ChatProvider;
  model: string;
  mode?: ChatMode;
  apiKey?: string;
  baseUrl?: string;
  messages: ChatMessage[];
  snippet?: ChatSnippet;
};
