import { json, type RequestHandler } from "@sveltejs/kit";
import { executeCode, type ExecuteCodeRequest, type SupportedExecutionLanguage } from "#lib/server/sandbox.ts";
import { authenticate } from "#lib/server/supabase.ts";

const EXECUTE_WINDOW_MS = 60_000;
const EXECUTE_MAX_REQUESTS_PER_WINDOW = 20;
const MAX_CODE_CHARS = 100_000;
const MAX_STDIN_CHARS = 20_000;

const ALLOWED_LANGUAGES: SupportedExecutionLanguage[] = [
  "python",
  "cpp",
  "txt",
  "md",
];

type RateWindow = {
  count: number;
  windowStart: number;
};

const executionRateWindows = new Map<string, RateWindow>();

function enforceExecutionRateLimit(rateKey: string) {
  const now = Date.now();
  const existing = executionRateWindows.get(rateKey);

  if (!existing || now - existing.windowStart >= EXECUTE_WINDOW_MS) {
    executionRateWindows.set(rateKey, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= EXECUTE_MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, EXECUTE_WINDOW_MS - (now - existing.windowStart)),
    };
  }

  executionRateWindows.set(rateKey, {
    count: existing.count + 1,
    windowStart: existing.windowStart,
  });

  return { allowed: true, retryAfterMs: 0 };
}

function validatePayload(payload: unknown): { data: ExecuteCodeRequest | null; error: string | null } {
  if (!payload || typeof payload !== "object") {
    return { data: null, error: "invalid payload" };
  }

  const input = payload as {
    language?: string;
    code?: string;
    stdin?: string;
  };

  const language = input.language as SupportedExecutionLanguage;
  if (!ALLOWED_LANGUAGES.includes(language)) {
    return { data: null, error: "unsupported language" };
  }

  const code = typeof input.code === "string" ? input.code : "";
  if (!code.trim()) {
    return { data: null, error: "code is required" };
  }

  if (code.length > MAX_CODE_CHARS) {
    return { data: null, error: `code exceeds max length of ${MAX_CODE_CHARS}` };
  }

  const stdin = typeof input.stdin === "string" ? input.stdin : "";
  if (stdin.length > MAX_STDIN_CHARS) {
    return { data: null, error: `input exceeds max length of ${MAX_STDIN_CHARS}` };
  }

  return {
    data: {
      language,
      code,
      stdin,
    },
    error: null,
  };
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    const auth = await authenticate(request);
    if (!auth.userId) {
      return json({ error: auth.error ?? "unauthorized" }, { status: 401 });
    }

    const rateKey = `${auth.userId}:${getClientAddress()}`;
    const rateLimit = enforceExecutionRateLimit(rateKey);
    if (!rateLimit.allowed) {
      return json(
        {
          error: "execution rate limit exceeded. please wait before running again.",
          retryAfterMs: rateLimit.retryAfterMs,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = validatePayload(body);
    if (parsed.error || !parsed.data) {
      return json({ error: parsed.error ?? "invalid request" }, { status: 400 });
    }

    const result = await executeCode(parsed.data);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "execution failed";
    return json({ error: message }, { status: 500 });
  }
};
