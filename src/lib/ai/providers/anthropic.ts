import type { ChatRequestBody, ChatMessage } from "@/lib/ai/chat-types";
import { fetchWithTimeout, parseAnthropicReply, readProviderResponse, type ProviderResult } from "@/lib/ai/providers/shared";

export async function callAnthropicProvider(params: {
  body: ChatRequestBody;
  messages: ChatMessage[];
}): Promise<ProviderResult> {
  const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": params.body.apiKey ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.body.model,
      max_tokens: 1500,
      temperature: 0.1,
      top_p: 0.9,
      messages: params.messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        })),
      system: params.messages.find((message) => message.role === "system")?.content,
    }),
  });

  return readProviderResponse(response, parseAnthropicReply);
}
