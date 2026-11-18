import type { ChatRequestBody, ChatMessage } from "@/lib/ai/chat-types";
import { fetchWithTimeout, parseOpenAIStyleReply, readProviderResponse, type ProviderResult } from "@/lib/ai/providers/shared";

export async function callOpenAICompatibleProvider(params: {
  body: ChatRequestBody;
  messages: ChatMessage[];
}): Promise<ProviderResult> {
  const baseUrl = params.body.baseUrl?.trim();
  if (!baseUrl) {
    return { error: "base url is required for openai-compatible provider", reply: null };
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.body.apiKey ?? ""}`,
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
