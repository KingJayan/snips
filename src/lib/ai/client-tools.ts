import type { ChatMode } from "#lib/ai/chat-types.ts";
import { postChat, readChatConfig } from "#lib/ai/chat-config.ts";
import type { SnippetWithTags } from "#lib/types.ts";

export type SimilarSnippetResult = {
  id: string;
  title: string;
  score: number;
  reason: string;
};

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

export async function rankSimilarSnippets(params: {
  target: SnippetWithTags;
  candidates: SnippetWithTags[];
}): Promise<SimilarSnippetResult[]> {
  const lightweightCandidates = params.candidates.slice(0, 12).map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
    language: candidate.language,
    description: candidate.description,
    tags: candidate.tags.map((tag) => tag.name),
    code: candidate.code.slice(0, 2400),
  }));

  const prompt = [
    "Rank the most similar snippets to the target based on behavior, intent, and code structure.",
    "Return strict JSON array only.",
    "Format:",
    '[{"id":"<snippet-id>","score":0-100,"reason":"short reason"}]',
    "Return up to 5 results.",
    "Candidates JSON:",
    JSON.stringify(lightweightCandidates),
  ].join("\n\n");

  const reply = await callAi({
    mode: "explain",
    prompt,
    snippet: {
      title: params.target.title,
      language: params.target.language,
      description: params.target.description,
      code: params.target.code.slice(0, 3200),
    },
  });

  const cleaned = extractTextFromAiResponse(reply);
  const jsonPayload = cleaned.match(/\[[\s\S]*\]/)?.[0] ?? "[]";
  const parsed = JSON.parse(jsonPayload) as Array<{ id?: string; score?: number; reason?: string }>;

  const titleById = new Map<string, string>();
  for (const candidate of params.candidates) {
    titleById.set(candidate.id, candidate.title);
  }

  return parsed
    .filter((item) => typeof item.id === "string" && titleById.has(item.id))
    .slice(0, 5)
    .map((item) => ({
      id: item.id as string,
      title: titleById.get(item.id as string) ?? "snippet",
      score: typeof item.score === "number" ? Math.max(0, Math.min(100, Math.round(item.score))) : 50,
      reason: typeof item.reason === "string" && item.reason.trim() ? item.reason : "similar coding pattern",
    }));
}
