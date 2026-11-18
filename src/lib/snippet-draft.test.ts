import { describe, expect, it } from "vitest";
import { draftChanged, parseTags, toDraft, validateDraft } from "./snippet-draft";

describe("snippet draft", () => {
  it("normalizes tags", () => {
    expect(parseTags(" React, react ,, Hooks")).toEqual(["react", "hooks"]);
  });

  it("validates required fields", () => {
    expect(validateDraft(toDraft(), "").error).toBe("title is required");
    const ok = validateDraft({ ...toDraft(), title: " t ", code: "x" }, "a, b");
    expect(ok.data).toMatchObject({ title: "t", tags: ["a", "b"] });
  });

  it("detects unsaved changes", () => {
    const base = { ...toDraft(), title: "t", tags: ["a"] };
    expect(draftChanged(toDraft(), "")).toBe(false);
    expect(draftChanged({ ...base }, "A, a", base)).toBe(false);
    expect(draftChanged({ ...base, code: "x" }, "a", base)).toBe(true);
    expect(draftChanged({ ...base }, "a, b", base)).toBe(true);
  });
});
