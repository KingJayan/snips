import { describe, expect, it } from "vitest";
import { snippetFileName } from "./snippet-file";

describe("snippetFileName", () => {
  it("slugs the title and maps the extension", () => {
    expect(snippetFileName({ title: "Use Debounce!", language: "typescript" })).toBe("use-debounce.ts");
    expect(snippetFileName({ title: "", language: "unknown" })).toBe("snippet.txt");
  });
});
