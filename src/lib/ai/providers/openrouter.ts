import type { ChatRequestBody, ChatMessage } from "#lib/ai/chat-types.ts";
import { fetchWithTimeout, parseOpenAIStyleReply, readProviderResponse, type ProviderResult } from "#lib/ai/providers/shared.ts";

export async function callOpenRouterProvider(params: {
  body: ChatRequestBody;
  messages: ChatMessage[];
}): Promise<ProviderResult> {
  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.body.apiKey ?? ""}`,
      "HTTP-Referer": "https://localhost",
      "X-Title": "snips ai editor",
    },
    body: JSON.stringify({
      model: params.body.model,
      messages: params.messages,
      temperature: 0.1,
      top_p: 0.9,
    }),
  });

  return readProviderResponse(response, parseOpenAIStyleReply);
}
