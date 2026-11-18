import type { ChatMode } from "#lib/ai/chat-types.ts";
import { postChat, readChatConfig } from "#lib/ai/chat-config.ts";
import type { SnippetWithTags } from "#lib/types.ts";

function extractTextFromAiResponse(text: string) {
  return text.replace(/^```[\w-]*\n?|```$/g, "").trim();
}

async function callAi(params: {
  mode: ChatMode;
  prompt: string;
  snippet: Pick<SnippetWithTags, "title" | "language" | "description" | "code">;
}) {
  const config = readChatConfig();
  if (config.provider === "puterjs") {
    throw new Error("switch provider from puterjs to a server-backed provider for this action");
  }
  return postChat({ ...config, mode: params.mode }, [{ role: "user", content: params.prompt }], params.snippet);
}

export async function generateTagsForSnippet(snippet: Pick<SnippetWithTags, "title" | "language" | "description" | "code">) {
  const reply = await callAi({
    mode: "improve",
    prompt: [
      "Generate up to 8 concise tags for this snippet.",
      "Rules:",
      "- lowercase",
      "- no spaces (use hyphen if needed)",
      "- return comma-separated tags only",
      "- no explanation",
    ].join("\n"),
    snippet,
  });

  return extractTextFromAiResponse(reply)
    .split(/[,\n]/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

export async function generateDescriptionForSnippet(snippet: Pick<SnippetWithTags, "title" | "language" | "description" | "code">) {
  const reply = await callAi({
    mode: "explain",
    prompt: [
      "Write a concise snippet description suitable for a snippet library.",
      "Rules:",
      "- max 280 characters",
      "- plain text only",
      "- mention purpose and key behavior",
      "- no markdown",
    ].join("\n"),
    snippet,
  });

  return extractTextFromAiResponse(reply).slice(0, 280);
}

