<script lang="ts">
  import { LoaderCircle, Plus, RefreshCw } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import AppHeader from "#lib/components/AppHeader.svelte";
  import NameDialog from "#lib/components/NameDialog.svelte";
  import SearchBar from "#lib/components/SearchBar.svelte";
  import ShortcutsPanel from "#lib/components/ShortcutsPanel.svelte";
  import SignIn from "#lib/components/SignIn.svelte";
  import SnippetDialog from "#lib/components/SnippetDialog.svelte";
  import SnippetList from "#lib/components/SnippetList.svelte";
  import TagFilter from "#lib/components/TagFilter.svelte";
  import UserChip from "#lib/components/UserChip.svelte";
  import WorkspaceNav, { type WorkspaceAction } from "#lib/components/WorkspaceNav.svelte";
  import Button from "#lib/components/ui/Button.svelte";
  import { ask } from "#lib/confirm.svelte.ts";
  import { Library } from "#lib/library.svelte.ts";
  import { collectTags, filterSnippets } from "#lib/search.ts";
  import { boolSetting, SETTINGS_KEYS } from "#lib/settings.ts";
  import { sendMagicLink, signOutUser, supabase } from "#lib/supabase.ts";
  import { toast } from "#lib/toast.svelte.ts";
  import { ignoresShortcuts } from "#lib/utils.ts";

  const SHORTCUTS = [
    { key: "/", action: "focus search" },
    { key: "n", action: "new snippet" },
    { key: "r", action: "refresh snippets" },
    { key: "?", action: "show shortcuts" },
    { key: "esc", action: "close dialog / clear search / clear tag filter" },
  ];
  const VIM_SHORTCUTS = [
    { key: "j / k", action: "move through the list" },
    { key: "enter", action: "open snippet" },
    { key: "p", action: "pin / unpin" },
  ];

  const library = new Library();
  const hints = boolSetting(SETTINGS_KEYS.showHints, true);
  const vim = boolSetting(SETTINGS_KEYS.vimShortcuts);

  let search = $state("");
  let activeTag = $state<string | null>(null);
  let searchInput = $state<HTMLInputElement | null>(null);
  let dragging = $state<string | null>(null);
  let cursor = $state(0);
  let snippetDialog = $state(false);
  let shortcuts = $state(false);
  let nameDialog = $state<"create" | "rename" | null>(null);
  let auth = $state({ busy: false, message: null as string | null, error: null as string | null });

  const filtered = $derived(filterSnippets(library.snippets, search, activeTag));
  const tags = $derived(collectTags(library.snippets));
  const canCreate = $derived(library.authenticated && Boolean(library.activeId));
  const selected = $derived(vim.value && filtered.length ? Math.min(cursor, filtered.length - 1) : null);

  const actions: WorkspaceAction[] = $derived.by(() => {
    const blocked = !library.authenticated || library.busy;
    return [
      { id: "new", label: "new", onClick: () => (nameDialog = "create"), disabled: blocked },
      { id: "rename", label: "rename", onClick: () => (nameDialog = "rename"), disabled: blocked || !library.active },
      { id: "share", label: library.active?.is_public ? "make private" : "make public", onClick: toggleShare, disabled: blocked || !library.active },
      ...(library.active?.is_public ? [{ id: "link", label: "copy public link", onClick: () => library.activeId && copyWorkspaceLink(library.activeId) }] : []),
      { id: "delete", label: "delete", onClick: async () => (await ask(`delete ${library.active?.name} and all its snippets? this cannot be undone.`, "delete")) && library.deleteWorkspace(), disabled: blocked || !library.active || library.workspaces.length <= 1, destructive: true },
    ];
  });

  onMount(() => {
    if (!supabase) {
      void library.refresh();
      return;
    }
    const { subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "TOKEN_REFRESHED") void library.refresh();
    }).data;
    return () => {
      subscription.unsubscribe();
      library.dispose();
    };
  });

  async function refresh() {
    toast("syncing...");
    await library.refresh();
    if (!library.error) toast("synced", "success");
  }

  function copyWorkspaceLink(id: string) {
    return navigator.clipboard.writeText(`${location.origin}/public?workspace=${id}`).then(
      () => toast("public link copied", "success"),
      () => toast("copy failed", "error")
    );
  }

  async function toggleShare() {
    const workspace = library.active;
    if (!workspace) return;
    if (!workspace.is_public && !(await ask("make this workspace public? every snippet in it, including private ones, will be readable by anyone.", "make public"))) return;
    if (!(await library.toggleShare()) && !workspace.is_public) await copyWorkspaceLink(workspace.id);
  }

  async function submitName(name: string) {
    if (!name) return toast("workspace name is required", "error");
    const error = await (nameDialog === "create" ? library.createWorkspace(name) : library.renameWorkspace(name));
    if (!error) nameDialog = null;
  }

  async function signIn() {
    auth = { busy: true, message: null, error: null };
    const error = await sendMagicLink(library.email.trim());
    auth = { busy: false, message: error ? null : `check ${library.email.trim()} for your sign-in link.`, error };
  }

  async function signOut() {
    const error = await signOutUser();
    toast(error ?? "signed out", error ? "error" : "success");
  }

  function onKeydown(event: KeyboardEvent) {
    if (!library.authenticated || ignoresShortcuts(event.target)) return;
    const key = event.key.toLowerCase();

    if (vim.value && (key === "j" || key === "k") && filtered.length) {
      event.preventDefault();
      cursor = Math.max(0, Math.min(filtered.length - 1, (selected ?? 0) + (key === "j" ? 1 : -1)));
    } else if (selected !== null && (key === "p" || (key === "enter" && event.target === document.body))) {
      event.preventDefault();
      const snippet = filtered[selected];
      if (key === "enter") void goto(`/snippets/${snippet.id}`);
      else void library.togglePin(snippet.id, !snippet.pinned);
    } else if (key === "/") {
      event.preventDefault();
      searchInput?.focus();
    } else if (key === "n" && canCreate) {
      event.preventDefault();
      snippetDialog = true;
    } else if (key === "r" && library.authenticated) {
      event.preventDefault();
      void refresh();
    } else if (key === "?") {
      event.preventDefault();
      shortcuts = true;
    } else if (key === "escape") {
      if (search) search = "";
      else activeTag = null;
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<AppHeader>
  {#if library.authenticated}
    {#if library.email}<span class="hidden sm:block"><UserChip email={library.email} /></span>{/if}
    <Button variant="ghost" size="sm" onclick={signOut}>sign out</Button>
  {/if}
</AppHeader>

{#if !library.authenticated}
  {#if !library.loading}
    <main class="px-4"><SignIn bind:email={library.email} busy={auth.busy} message={auth.message} error={auth.error ?? library.error} onSubmit={signIn} /></main>
  {/if}
{:else}
  <div class="mx-auto flex w-full max-w-6xl gap-6 px-4 pt-6 pb-24 sm:px-6 lg:pb-8">
    <WorkspaceNav
      workspaces={library.workspaces}
      activeId={library.activeId}
      dragging={dragging !== null}
      {actions}
      onSelect={(id) => library.select(id)}
      onDrop={(snippetId, workspaceId) => {
        dragging = null;
        void library.move(snippetId, workspaceId);
      }}
    />

    <main class="flex min-w-0 flex-1 flex-col gap-4 motion-safe-enter">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-lg font-semibold tracking-tight">{library.active?.name ?? "snippets"}</h1>
          <p class="text-xs text-muted-foreground">{filtered.length} snippet{filtered.length === 1 ? "" : "s"}{activeTag ? ` tagged ${activeTag}` : ""}</p>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="icon" onclick={refresh} disabled={library.loading} aria-label="refresh" tip="refresh">
            <RefreshCw class="size-4 {library.loading || library.refreshing ? 'animate-spin' : ''}" />
          </Button>
          <Button onclick={() => (snippetDialog = true)} disabled={!canCreate} tip={canCreate ? undefined : "create a workspace first"}><Plus class="size-4" /> new snippet</Button>
        </div>
      </header>

      <section class="space-y-3">
        <SearchBar bind:value={search} bind:ref={searchInput} placeholder={hints.value ? "search, or try tag:react  lang:ts  is:pinned" : undefined} />
        <TagFilter {tags} bind:active={activeTag} />
      </section>

      {#if library.error}
        <section class="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{library.error}</section>
      {/if}

      {#if library.loading}
        <section class="grid gap-3" aria-live="polite">
          <LoaderCircle class="size-3.5 animate-spin text-muted-foreground" />
          <span class="sr-only">loading snippets</span>
          {#each { length: 6 }, index (index)}
            <div class="h-28 animate-pulse rounded-xl border border-border/50 bg-muted/40"></div>
          {/each}
        </section>
      {:else if !library.activeId}
        <section class="rounded-2xl border border-dashed border-border/70 p-12 text-center">
          <h2 class="text-sm font-medium">no workspace yet</h2>
          <p class="mt-1 text-sm text-muted-foreground">create one to start saving snippets.</p>
          <Button class="mt-4" onclick={() => (nameDialog = "create")}><Plus class="size-4" /> create workspace</Button>
        </section>
      {:else if !filtered.length}
        <section class="rounded-2xl border border-dashed border-border/70 p-12 text-center">
          <h2 class="text-sm font-medium">{library.snippets.length ? "no matching snippets" : "no snippets yet"}</h2>
          <p class="mt-1 text-sm text-muted-foreground">{library.snippets.length ? "try a different search or tag." : "snippets you save will show up here."}</p>
        </section>
      {:else}
        <SnippetList
          snippets={filtered}
          {selected}
          onTagClick={(tag) => (activeTag = tag)}
          onTogglePin={(id, pinned) => library.togglePin(id, pinned)}
          onDelete={(id) => library.remove(id)}
          onDragStart={(id) => (dragging = id)}
          onDragEnd={() => (dragging = null)}
        />
      {/if}
      {#if library.hasMore && !library.loading}
        <Button variant="outline" class="self-center" onclick={() => library.loadMore()}>load more</Button>
      {/if}
    </main>
  </div>
{/if}

<SnippetDialog bind:open={snippetDialog} onSave={(draft) => library.create(draft)} />

<NameDialog
  bind:open={() => nameDialog !== null, (open) => !open && (nameDialog = null)}
  title={nameDialog === "rename" ? "rename workspace" : "new workspace"}
  description={nameDialog === "rename" ? "update the workspace name" : "create a focused workspace for your snippets"}
  initial={nameDialog === "rename" ? (library.active?.name ?? "") : ""}
  submitLabel={nameDialog === "rename" ? "save" : "create"}
  busy={library.busy}
  onSubmit={submitName}
/>

<ShortcutsPanel bind:open={shortcuts} shortcuts={vim.value ? [...SHORTCUTS, ...VIM_SHORTCUTS] : SHORTCUTS} />

