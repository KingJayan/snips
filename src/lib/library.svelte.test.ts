import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SnippetSummaryWithTags, Workspace } from "#lib/types.ts";

const workspaces: Workspace[] = [];
const service = vi.hoisted(() => ({
  listWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  listSnippets: vi.fn(),
  createSnippet: vi.fn(),
  PAGE_SIZE: 100,
}));

vi.mock("#lib/snippet-service.ts", () => service);
vi.mock("#lib/supabase.ts", () => ({ getCurrentUser: async () => ({ id: "u", email: "a@b.c" }) }));
vi.mock("#lib/toast.svelte.ts", () => ({ toast: () => {} }));
vi.mock("#lib/snippet-cache.ts", () => ({ readCachedList: () => [], writeCachedList: () => {} }));

const { Library } = await import("./library.svelte");

const workspace = (id: string): Workspace => ({ id, owner_id: "u", name: id, is_public: false, created_at: "", updated_at: "" });
const summary = (id: string, pinned: boolean, updated_at: string) => ({ id, pinned, updated_at, workspace_id: "w", title: id, tags: [] }) as unknown as SnippetSummaryWithTags;

describe("Library", () => {
  beforeEach(() => {
    workspaces.length = 0;
    service.listWorkspaces.mockImplementation(async () => ({ data: [...workspaces], error: null }));
    service.createWorkspace.mockImplementation(async (name: string) => {
      workspaces.push(workspace(name));
      return { data: workspace(name), error: null };
    });
    service.listSnippets.mockResolvedValue({ data: [summary("pinned", true, "2020-01-01")], error: null });
  });

  it("creates a default workspace for new users", async () => {
    const library = new Library();
    await library.refresh();
    expect(service.createWorkspace).toHaveBeenCalledWith("default");
    expect(library.activeId).toBe("default");
  });

  it("keeps pinned snippets above a new one", async () => {
    workspaces.push(workspace("w"));
    const library = new Library();
    await library.refresh();
    service.createSnippet.mockResolvedValue({ data: { ...summary("new", false, "2030-01-01"), code: "x" }, error: null });
    await library.create({ title: "new", language: "ts", description: "", code: "x", tags: [] });
    expect(library.snippets.map((s) => s.id)).toEqual(["pinned", "new"]);
  });
});
