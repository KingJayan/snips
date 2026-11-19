import { normalizeMessages } from "#lib/ai/chat-normalize.ts";
import type { ChatMessage, ChatMode, ChatSnippet } from "#lib/ai/chat-types.ts";

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

export const PUTER_AUTH_ERROR = "puterjs requires an authenticated puter session. sign in to puter, then retry, or use another provider.";

export async function puterChat(params: {
  messages: ChatMessage[];
  snippet: ChatSnippet;
  mode: ChatMode;
  model: string;
}) {
  const { snippet, messages, mode, model } = params;
  const prompt = normalizeMessages({ messages, snippet, mode })
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

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
