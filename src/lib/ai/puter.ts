import type { ChatMode } from "#lib/ai/chat-types.ts";
import type { SnippetWithTags } from "#lib/types.ts";

type PuterWindow = Window & { puter?: { ai?: { chat?: (prompt: string, options?: { model?: string }) => Promise<unknown> } } };

let loading: Promise<void> | null = null;

function loadPuter() {
  loading ??= new Promise<void>((resolve, reject) => {
    const script = Object.assign(document.createElement("script"), { id: "puterjs-sdk", src: "https://js.puter.com/v2/", async: true });
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("failed to load puterjs sdk"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

function replyText(value: unknown): string {
  if (typeof value === "string") return value;
  const v = (value ?? {}) as { text?: unknown; content?: unknown; output?: unknown; message?: { content?: unknown } };
  const text = [v.text, v.content, v.output, v.message?.content].find((x) => typeof x === "string");
  return (text as string | undefined) ?? "";
}

const MODE_INSTRUCTION: Record<ChatMode, string> = {
  improve: "Task mode: Improve this snippet for correctness, performance, and maintainability.",
  refactor: "Task mode: Refactor this snippet while preserving behavior.",
  debug: "Task mode: Debug this snippet and provide fixed code.",
  explain: "Task mode: Explain this snippet clearly. Only provide edits if explicitly requested.",
};

export const PUTER_AUTH_ERROR = "puterjs requires an authenticated puter session. sign in to puter, then retry, or use another provider.";

export async function puterChat(params: {
  messages: Array<{ role: string; content: string }>;
  snippet: SnippetWithTags;
  mode: ChatMode;
  model: string;
}) {
  const { snippet, messages, mode, model } = params;
  const prompt = [
    "You are a senior software engineer helping improve code snippets.",
    "Give concrete fixes and include full updated code when an edit is requested.",
    MODE_INSTRUCTION[mode],
    "",
    `Snippet title: ${snippet.title}`,
    `Language: ${snippet.language}`,
    `Description: ${snippet.description || ""}`,
    "Current code:",
    "```",
    snippet.code,
    "```",
    "",
    "Conversation:",
    messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n"),
  ].join("\n");

  try {
    await loadPuter();
    const chat = (window as PuterWindow).puter?.ai?.chat;
    if (!chat) throw new Error("puterjs sdk loaded but ai.chat is unavailable");
    const reply = replyText(await chat(prompt, { model })).trim();
    if (!reply) throw new Error("empty response from puterjs");
    return reply;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/401|unauthorized|whoami/i.test(message)) throw new Error(PUTER_AUTH_ERROR, { cause: error });
    throw new Error(message || "puterjs request failed. try another provider or re-authenticate with puter.", { cause: error });
  }
}
