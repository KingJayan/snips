<script lang="ts">
  import { CodeXml, Keyboard, LoaderCircle, Plus, RefreshCw, Search } from "@lucide/svelte";
  import { onMount } from "svelte";
  import AppLogo from "#lib/components/AppLogo.svelte";
  import AuthPanel from "#lib/components/AuthPanel.svelte";
  import NameDialog from "#lib/components/NameDialog.svelte";
  import SearchBar from "#lib/components/SearchBar.svelte";
  import ShortcutsPanel from "#lib/components/ShortcutsPanel.svelte";
  import SnippetDialog from "#lib/components/SnippetDialog.svelte";
  import SnippetList from "#lib/components/SnippetList.svelte";
  import TagFilter from "#lib/components/TagFilter.svelte";
  import UserChip from "#lib/components/UserChip.svelte";
  import WorkspaceNav, { type WorkspaceAction } from "#lib/components/WorkspaceNav.svelte";
  import Button from "#lib/components/ui/Button.svelte";
  import Dialog from "#lib/components/ui/Dialog.svelte";
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
  let deleteDialog = $state(false);
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
      { id: "delete", label: "delete", onClick: () => (deleteDialog = true), disabled: blocked || !library.active || library.workspaces.length <= 1, destructive: true },
    ];
  });

  onMount(() => {
    if (!supabase) {
      void library.refresh(true);
      return;
    }
    const { subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "TOKEN_REFRESHED") void library.refresh(true);
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

  function toggleShare() {
    if (!library.active?.is_public && !confirm("make this workspace public? every snippet in it, including private ones, will be readable by anyone with its link.")) return;
    void library.toggleShare();
  }

  async function submitName(name: string) {
    if (!name) return toast("workspace name is required", "error");
    const error = await (nameDialog === "create" ? library.createWorkspace(name) : library.renameWorkspace(name));
    if (!error) nameDialog = null;
  }

  async function authAction(action: () => Promise<string | null>, success: string) {
    auth = { busy: true, message: null, error: null };
    const error = await action();
    auth = { busy: false, message: error ? null : success, error };
  }

  function onKeydown(event: KeyboardEvent) {
    if (ignoresShortcuts(event.target)) return;
    const key = event.key.toLowerCase();

    if (vim.value && (key === "j" || key === "k") && filtered.length) {
      event.preventDefault();
      cursor = Math.max(0, Math.min(filtered.length - 1, (selected ?? 0) + (key === "j" ? 1 : -1)));
    } else if (key === "/") {
      event.preventDefault();
      searchInput?.focus();
    } else if (key === "n" && canCreate) {
      event.preventDefault();
      snippetDialog = true;
    } else if (key === "r") {
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

<main class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 motion-safe-enter">
  <WorkspaceNav
    workspaces={library.workspaces}
    activeId={library.activeId}
    canSelect={library.authenticated}
    dragging={dragging !== null}
    {actions}
    pinnedTitles={library.pinnedTitles}
    onSelect={(id) => library.select(id)}
    onDrop={(snippetId, workspaceId) => {
      dragging = null;
      void library.move(snippetId, workspaceId);
    }}
  />

  <header class="flex flex-wrap items-center justify-between gap-3">
    <div class="space-y-1">
      <AppLogo />
      {#if hints.value}
        <div class="inline-flex items-center gap-1 rounded-md border border-border/40 bg-background/60 px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground select-none animate-subtle-pop-in">
          <Keyboard class="size-2.5 shrink-0" /> n · cmd+↵
        </div>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      {#if library.authenticated && library.email}<UserChip email={library.email} />{/if}
      <Button variant="outline" onclick={refresh} disabled={library.loading}>
        <RefreshCw class="size-4 {library.loading || library.refreshing ? 'animate-spin' : ''}" /> refresh
      </Button>
      <Button onclick={() => (snippetDialog = true)} disabled={!canCreate}><Plus class="size-4" /> new snippet</Button>
    </div>
  </header>

  {#if !library.authenticated || auth.error || auth.message}
    <AuthPanel
      bind:email={library.email}
      authenticated={library.authenticated}
      busy={auth.busy}
      message={auth.message}
      error={auth.error}
      onRefresh={refresh}
      onSendMagicLink={() => authAction(() => (library.email.trim() ? sendMagicLink(library.email.trim()) : Promise.resolve("email is required")), "magic link sent. check your inbox.")}
      onSignOut={() => authAction(signOutUser, "signed out")}
    />
  {/if}

  <section class="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-3 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
    <SearchBar bind:value={search} bind:ref={searchInput} />
    {#if hints.value}
      <p class="inline-flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground select-none animate-subtle-pop-in">
        <Search class="size-3 shrink-0" />
        power search: <span class="font-mono">tag:react</span> · <span class="font-mono">lang:ts</span> · <span class="font-mono">is:pinned</span>
      </p>
    {/if}
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
        <div class="h-40 animate-pulse rounded-xl border border-border/50 bg-muted/40"></div>
      {/each}
    </section>
  {:else if !filtered.length}
    <section class="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-12 text-center">
      <CodeXml class="mx-auto size-12 text-muted-foreground/50" />
      <h2 class="mt-4 text-sm font-medium">{library.snippets.length ? "no snippets found" : "no snippets yet"}</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {#if library.snippets.length}
          adjust search/filter or add a new snippet
        {:else}
          press <kbd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">n</kbd> to create your first one
        {/if}
      </p>
    </section>
  {:else}
    {#if library.authenticated}
      <section class="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>{filtered.length} snippets</span>
        {#if activeTag}<span>filter: {activeTag}</span>{/if}
      </section>
    {/if}
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

  {#snippet deleteDescription()}delete <span class="font-medium">{library.active?.name ?? "workspace"}</span> and all snippets in it. this cannot be undone.{/snippet}

  <Dialog bind:open={deleteDialog} title="delete workspace" description={deleteDescription} class="max-w-md rounded-2xl border-border/70">
    <div class="flex flex-col-reverse gap-2 px-6 pb-6 sm:flex-row sm:justify-end">
      <Button variant="outline" onclick={() => (deleteDialog = false)} disabled={library.busy}>cancel</Button>
      <Button variant="destructive" disabled={library.busy} onclick={async () => !(await library.deleteWorkspace()) && (deleteDialog = false)}>delete</Button>
    </div>
  </Dialog>

  <ShortcutsPanel bind:open={shortcuts} shortcuts={SHORTCUTS} />

  <Button size="icon" onclick={() => (snippetDialog = true)} disabled={!canCreate} class="fixed right-6 bottom-6 z-40 size-14 rounded-full shadow-lg md:hidden" aria-label="new snippet">
    <Plus class="size-6" />
  </Button>
</main>
