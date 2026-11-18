import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./utils";

describe("renderMarkdown", () => {
  it("leaves asterisks inside inline code alone", () => {
    expect(renderMarkdown("`a*b*c` and *x*")).toBe(
      '<code class="rounded bg-muted px-1 font-mono text-[0.85em]">a*b*c</code> and <em>x</em>'
    );
  });

  it("escapes html", () => {
    expect(renderMarkdown("<b>`<i>`")).toBe(
      '&lt;b&gt;<code class="rounded bg-muted px-1 font-mono text-[0.85em]">&lt;i&gt;</code>'
    );
  });
});
