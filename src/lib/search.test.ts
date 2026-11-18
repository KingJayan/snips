import { describe, expect, it } from "vitest";
import { filterSnippets, parseSearchTokens } from "./search";
import type { SnippetSummaryWithTags } from "./types";

const snippet = (over: Partial<SnippetSummaryWithTags>) =>
  ({ title: "", description: "", language: "typescript", pinned: false, tags: [], ...over }) as SnippetSummaryWithTags;

describe("parseSearchTokens", () => {
  it("extracts operators", () => {
    expect(parseSearchTokens("debounce tag:React lang:ts is:pinned")).toEqual({
      query: "debounce",
      tag: "react",
      language: "ts",
      pinnedOnly: true,
    });
  });
});

describe("filterSnippets", () => {
  const list = [
    snippet({ title: "useDebounce", pinned: true, tags: [{ id: "1", name: "react" }] }),
    snippet({ title: "retry", language: "python" }),
  ];

  it("filters by text, tag, language and pin", () => {
    expect(filterSnippets(list, "debounce", null)).toHaveLength(1);
    expect(filterSnippets(list, "lang:python", null)[0].title).toBe("retry");
    expect(filterSnippets(list, "is:pinned", null)[0].title).toBe("useDebounce");
    expect(filterSnippets(list, "", "react")).toHaveLength(1);
  });
});
