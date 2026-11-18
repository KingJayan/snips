import { describe, expect, it } from "vitest";
import { isPrivateAddress, validateAiBaseUrl } from "./url-security";

describe("validateAiBaseUrl", () => {
  it("accepts public https endpoints", async () => {
    const result = await validateAiBaseUrl("https://8.8.8.8/v1/");
    expect(result).toEqual({ ok: true, normalized: "https://8.8.8.8/v1" });
  });

  it("rejects private and metadata endpoints", async () => {
    for (const url of ["https://127.0.0.1:9999/v1", "https://169.254.169.254", "https://[::ffff:10.0.0.1]", "https://localhost"]) {
      expect((await validateAiBaseUrl(url)).ok).toBe(false);
    }
  });

  it("rejects http and invalid urls", async () => {
    expect((await validateAiBaseUrl("http://8.8.8.8")).ok).toBe(false);
    expect((await validateAiBaseUrl("not-a-url")).ok).toBe(false);
  });
});

describe("isPrivateAddress", () => {
  it("classifies addresses", () => {
    expect(isPrivateAddress("100.64.0.1")).toBe(true);
    expect(isPrivateAddress("fd00::1")).toBe(true);
    expect(isPrivateAddress("1.1.1.1")).toBe(false);
    expect(isPrivateAddress("2606:4700::1111")).toBe(false);
  });
});
