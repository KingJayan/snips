import { readCachedList, writeCachedList } from "#lib/snippet-cache.ts";
import {
  createSnippet,
  createWorkspace,
  deleteSnippet,
  deleteWorkspace,
  listSnippets,
  listWorkspaces,
  moveSnippetToWorkspace,
  renameWorkspace,
  togglePinSnippet,
  toggleWorkspacePublic,
} from "#lib/snippet-service.ts";
import { getCurrentUser } from "#lib/supabase.ts";
import { nowIso } from "#lib/time.ts";
import { toast } from "#lib/toast.svelte.ts";
import type { ServiceResult, SnippetDraft, SnippetSummaryWithTags, Workspace } from "#lib/types.ts";

const byPinThenRecent = (a: SnippetSummaryWithTags, b: SnippetSummaryWithTags) =>
  a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : Date.parse(b.updated_at) - Date.parse(a.updated_at);

export class Library {
  snippets = $state<SnippetSummaryWithTags[]>([]);
  workspaces = $state<Workspace[]>([]);
  activeId = $state<string | null>(null);
  email = $state("");
  authenticated = $state(false);
  loading = $state(true);
  refreshing = $state(false);
  busy = $state(false);
  error = $state<string | null>(null);

  active = $derived(this.workspaces.find((w) => w.id === this.activeId) ?? null);

  pinnedTitles = $derived.by(() => {
    const titles: Record<string, string[]> = {};
    const lists = [...this.workspaces.map((w) => readCachedList(w.id)), this.snippets];
    for (const snippet of lists.flat()) {
      if (!snippet.pinned || !snippet.workspace_id) continue;
      const list = (titles[snippet.workspace_id] ??= []);
      const title = snippet.title.trim() || "untitled";
      if (list.length < 3 && !list.includes(title)) list.push(title);
    }
    return titles;
  });

  #controller: AbortController | null = null;

  async refresh(background = false) {
    const user = await getCurrentUser().catch(() => null);
    this.authenticated = Boolean(user);
    if (user?.email) this.email = user.email;

    if (!user) {
      Object.assign(this, { snippets: [], workspaces: [], activeId: null, loading: false, refreshing: false, error: null });
      return;
    }

    const { data, error } = await listWorkspaces();
    this.error = error;
    this.workspaces = data ?? [];
    const keep = this.workspaces.some((w) => w.id === this.activeId);
    await this.select(keep ? this.activeId : (this.workspaces[0]?.id ?? null), background);
  }

  async select(id: string | null, useCache = true) {
    this.#controller?.abort();
    this.activeId = id;
    if (!id) {
      Object.assign(this, { snippets: [], loading: false, refreshing: false });
      return;
    }

    const cached = useCache ? readCachedList(id) : [];
    if (cached.length) this.snippets = cached;
    Object.assign(this, { loading: !cached.length, refreshing: Boolean(cached.length), error: null });

    const controller = (this.#controller = new AbortController());
    const { data, error } = await listSnippets({ workspaceId: id, signal: controller.signal });
    if (controller.signal.aborted) return;

    Object.assign(this, { loading: false, refreshing: false, error });
    this.#setSnippets(error ? [] : (data ?? []));
  }

  dispose() {
    this.#controller?.abort();
  }

  #setSnippets(next: SnippetSummaryWithTags[], workspaceId = this.activeId) {
    if (workspaceId === this.activeId) this.snippets = next;
    writeCachedList(workspaceId, next);
  }

  async #run<T>(pending: string | null, request: Promise<ServiceResult<T>>, success: string, apply: (data: T) => void) {
    if (pending) toast(pending);
    this.busy = true;
    const { data, error } = await request;
    this.busy = false;
    if (error || data === null) {
      toast(error ?? "something went wrong", "error");
      return error ?? "something went wrong";
    }
    apply(data);
    toast(success, "success");
    return null;
  }

  create(draft: SnippetDraft) {
    if (!this.authenticated) return Promise.resolve("sign in first to create snippets");
    if (!this.activeId) return Promise.resolve("create a workspace first");
    return this.#run("saving snippet...", createSnippet({ ...draft, workspace_id: this.activeId }), "snippet saved", (snippet) => {
      const { code, ...summary } = snippet;
      this.#setSnippets([summary, ...this.snippets]);
    });
  }

  togglePin(id: string, pinned: boolean) {
    return this.#run(pinned ? "pinning..." : "unpinning...", togglePinSnippet(id, pinned), pinned ? "pinned" : "unpinned", () =>
      this.#setSnippets(this.snippets.map((s) => (s.id === id ? { ...s, pinned } : s)).sort(byPinThenRecent))
    );
  }

  remove(id: string) {
    return this.#run("deleting...", deleteSnippet(id), "snippet deleted", () => this.#setSnippets(this.snippets.filter((s) => s.id !== id)));
  }

  move(id: string, workspaceId: string) {
    const snippet = this.snippets.find((s) => s.id === id);
    if (!snippet || workspaceId === this.activeId) return Promise.resolve(null);
    const target = this.workspaces.find((w) => w.id === workspaceId)?.name ?? "workspace";
    return this.#run("moving snippet...", moveSnippetToWorkspace(id, workspaceId), `moved to ${target}`, () => {
      this.#setSnippets(this.snippets.filter((s) => s.id !== id));
      const moved = { ...snippet, workspace_id: workspaceId, updated_at: nowIso() };
      this.#setSnippets([moved, ...readCachedList(workspaceId).filter((s) => s.id !== id)], workspaceId);
    });
  }

  createWorkspace(name: string) {
    return this.#run(null, createWorkspace(name), "workspace created", (workspace) => {
      this.workspaces = [workspace, ...this.workspaces.filter((w) => w.id !== workspace.id)];
      void this.select(workspace.id);
    });
  }

  renameWorkspace(name: string) {
    const id = this.activeId;
    if (!id) return Promise.resolve("select a workspace first");
    return this.#run(null, renameWorkspace(id, name), "workspace renamed", () => {
      this.workspaces = this.workspaces.map((w) => (w.id === id ? { ...w, name } : w));
    });
  }

  toggleShare() {
    const workspace = this.active;
    if (!workspace) return Promise.resolve(null);
    const next = !workspace.is_public;
    return this.#run(null, toggleWorkspacePublic(workspace.id, next), next ? "workspace is now public" : "workspace is now private", () => {
      this.workspaces = this.workspaces.map((w) => (w.id === workspace.id ? { ...w, is_public: next } : w));
    });
  }

  deleteWorkspace() {
    const workspace = this.active;
    if (!workspace) return Promise.resolve(null);
    if (this.workspaces.length <= 1) return Promise.resolve("you must keep at least one workspace");
    return this.#run(null, deleteWorkspace(workspace.id), "workspace deleted", () => {
      this.workspaces = this.workspaces.filter((w) => w.id !== workspace.id);
      void this.select(this.workspaces[0]?.id ?? null);
    });
  }
}
