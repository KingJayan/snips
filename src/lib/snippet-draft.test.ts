import { describe, expect, it } from "vitest";
import { parseTags, toDraft, validateDraft } from "./snippet-draft";

describe("snippet draft", () => {
  it("normalizes tags", () => {
    expect(parseTags(" React, react ,, Hooks")).toEqual(["react", "hooks"]);
  });

  it("validates required fields", () => {
    expect(validateDraft(toDraft(), "").error).toBe("title is required");
    const ok = validateDraft({ ...toDraft(), title: " t ", code: "x" }, "a, b");
    expect(ok.data).toMatchObject({ title: "t", tags: ["a", "b"] });
  });
});
