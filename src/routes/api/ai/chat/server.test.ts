import { beforeEach, describe, expect, it, vi } from "vitest";

const handler = vi.fn(async (_params: { body: { apiKey?: string } }) => ({ error: null, reply: "ok" }));
const rpc = vi.fn(async (_name: string, _args: { p_bucket: string }) => ({ data: 0, error: null }));

vi.mock("$app/env/private", () => ({ OPENAI_API_KEY: "server-openai", ANTHROPIC_API_KEY: "", GEMINI_API_KEY: "", OPENROUTER_API_KEY: "" }));
vi.mock("#lib/server/supabase.ts", () => ({ authenticate: async () => ({ client: { rpc }, userId: "u", error: null }) }));
vi.mock("#lib/ai/url-security.ts", () => ({ validateAiBaseUrl: async (url: string) => ({ ok: true, normalized: url }) }));
vi.mock("#lib/ai/providers/index.ts", () => ({
  providers: {
    openai: { handler, requiresApiKey: true, requiresBaseUrl: false },
    "openai-compatible": { handler, requiresApiKey: true, requiresBaseUrl: true },
  },
}));

const { POST } = await import("./+server");

const call = (body: object) =>
  POST({ request: new Request("http://x", { method: "POST", body: JSON.stringify({ model: "m", messages: [{ role: "user", content: "hi" }], ...body }) }) } as never);

describe("ai chat key handling", () => {
  beforeEach(() => {
    handler.mockClear();
    rpc.mockClear();
  });

  it("never sends a server key to a user-supplied base url", async () => {
    const response = await call({ provider: "openai-compatible", baseUrl: "https://evil.example" });
    expect(response.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it("uses the caller's key for custom urls", async () => {
    await call({ provider: "openai-compatible", baseUrl: "https://ok.example", apiKey: "mine" });
    expect(handler.mock.calls[0]?.[0].body.apiKey).toBe("mine");
  });

  it("applies the daily cap only to server keys", async () => {
    await call({ provider: "openai" });
    expect(rpc.mock.calls.map((c) => c[1].p_bucket)).toEqual(["minute", "day"]);
    rpc.mockClear();
    await call({ provider: "openai", apiKey: "mine" });
    expect(rpc.mock.calls.map((c) => c[1].p_bucket)).toEqual(["minute"]);
  });
});
