<script lang="ts">
  import { Globe, LoaderCircle, Lock, PanelRightOpen, Pencil, Pin, Share2, Trash } from "@lucide/svelte";
  import { fly } from "svelte/transition";
  import { beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import AiChat from "#lib/components/AiChat.svelte";
  import CodeBlock from "#lib/components/CodeBlock.svelte";
  import CodeEditor from "#lib/components/CodeEditor.svelte";
  import AppHeader from "#lib/components/AppHeader.svelte";
  import ErrorNote from "#lib/components/ErrorNote.svelte";
  import Loading from "#lib/components/Loading.svelte";
  import NotFound from "#lib/components/NotFound.svelte";
  import SnippetActions from "#lib/components/SnippetActions.svelte";
  import SnippetFields from "#lib/components/SnippetFields.svelte";
  import SnippetMeta from "#lib/components/SnippetMeta.svelte";
  import Button from "#lib/components/ui/Button.svelte";
  import { boolSetting, SETTINGS_KEYS } from "#lib/settings.ts";
  import { readCachedSnippet, writeCachedSnippet } from "#lib/snippet-cache.ts";
  import { draftChanged, toDraft, validateDraft } from "#lib/snippet-draft.ts";
  import { deleteSnippet, getSnippetById, incrementSnippetCounter, togglePinSnippet, togglePublicSnippet, updateSnippet } from "#lib/snippet-service.ts";
  import { getCurrentUser } from "#lib/supabase.ts";
  import { toast } from "#lib/toast.svelte.ts";
  import type { ServiceResult, SnippetDraft, SnippetWithTags } from "#lib/types.ts";
  import { ignoresShortcuts } from "#lib/utils.ts";

  const TOGGLE = "text-muted-foreground aria-pressed:bg-accent aria-pressed:text-foreground";
  const CODE_HEIGHT ="h-[50vh] min-h-[280px] sm:h-[56vh] sm:min-h-[360px] lg:h-[62vh] lg:max-h-[780px]";

  const aiDefault = boolSetting(SETTINGS_KEYS.aiPanelOpenByDefault);
  const vim = boolSetting(SETTINGS_KEYS.vimShortcuts);

  let snippet = $state<SnippetWithTags | null>(null);
  let loading = $state(true);
  let refreshing = $state(false);
  let error = $state<string | null>(null);
  let actionError = $state<string | null>(null);
  let deleting = $state(false);
  let editing = $state<{ draft: SnippetDraft; tags: string; error: string | null; saving: boolean } | null>(null);
  let aiOverride = $state<boolean | null>(null);
  let actions = $state<ReturnType<typeof SnippetActions>>();

  const aiMinimized = $derived(aiOverride ?? !aiDefault.value);
  const dirty = $derived(Boolean(editing && snippet && draftChanged(editing.draft, editing.tags, toDraft(snippet))));

  beforeNavigate((navigation) => {
    if (dirty && navigation.type !== "leave" && !confirm("you have unsaved changes. leave anyway?")) navigation.cancel();
  });

  function cancelEditing() {
    if (!dirty || confirm("discard your changes?")) editing = null;
  }

  $effect(() => {
    void aiDefault.value;
    aiOverride = null;
  });

  $effect(() => {
    const id = page.params.id ?? "";
    const cached = readCachedSnippet(id);
    const controller = new AbortController();
    snippet = cached;
    loading = !cached;
    refreshing = Boolean(cached);
    editing = null;

    Promise.all([getSnippetById(id, { signal: controller.signal }), getCurrentUser()]).then(async ([{ data, error: loadError }, user]) => {
      if (controller.signal.aborted) return;
      if (data && data.user_id !== user?.id) return goto(`/public/${id}`, { replaceState: true });
      loading = refreshing = false;
      error = loadError;
      if (!data) return;
      snippet = data;
      writeCachedSnippet(data);
      const { data: counted } = await incrementSnippetCounter(id, "view");
      if (counted && snippet?.id === id) snippet.view_count += 1;
    });

    return () => controller.abort();
  });

  async function mutate(pending: string, request: Promise<ServiceResult<unknown>>, success: string, patch: Partial<SnippetWithTags>) {
    if (!snippet) return;
    actionError = null;
    toast(pending);
    const { error: serviceError } = await request;
    if (serviceError) {
      actionError = serviceError;
      return toast(serviceError, "error");
    }
    Object.assign(snippet, patch);
    writeCachedSnippet($state.snapshot(snippet));
    toast(success, "success");
  }

  const togglePin = (s: SnippetWithTags) => mutate(s.pinned ? "unpinning..." : "pinning...", togglePinSnippet(s.id, !s.pinned), s.pinned ? "unpinned" : "pinned", { pinned: !s.pinned });

  const togglePublic = (s: SnippetWithTags) =>
    mutate(s.public ? "making private..." : "making public...", togglePublicSnippet(s.id, !s.public), s.public ? "snippet is now private" : "snippet is now public", { public: !s.public });

  async function share(s: SnippetWithTags) {
    const url = `${location.origin}/${s.public ? "public" : "snippets"}/${s.id}`;
    await navigator.clipboard.writeText(url).then(
      () => toast(s.public ? "public link copied" : "link copied", "success"),
      () => toast("share failed", "error")
    );
  }

  async function remove(s: SnippetWithTags) {
    if (deleting || !confirm("delete this snippet?")) return;
    deleting = true;
    toast("deleting snippet...");
    const { error: serviceError } = await deleteSnippet(s.id);
    if (serviceError) {
      deleting = false;
      actionError = serviceError;
      return toast(serviceError, "error");
    }
    toast("snippet deleted", "success");
    await goto("/snippets");
  }

  function startEditing(code?: string) {
    if (!snippet) return;
    const draft = toDraft(snippet);
    editing = { draft: { ...draft, code: code ?? draft.code }, tags: draft.tags.join(", "), error: null, saving: false };
  }

  async function save() {
    if (!snippet || !editing) return;
    const parsed = validateDraft(editing.draft, editing.tags);
    if (!parsed.data) return (editing.error = parsed.error);
    editing.saving = true;
    toast("saving changes...");
    const { data, error: serviceError } = await updateSnippet(snippet.id, parsed.data);
    if (serviceError || !data) {
      editing.saving = false;
      editing.error = serviceError;
      return toast(serviceError ?? "failed to save", "error");
    }
    snippet = data;
    writeCachedSnippet(data);
    editing = null;
    toast("changes saved", "success");
  }

  function onKeydown(event: KeyboardEvent) {
    if (!snippet) return;
    const key = event.key.toLowerCase();
    if (key === "escape" && editing) {
      event.preventDefault();
      cancelEditing();
      return;
    }
    if (ignoresShortcuts(event.target)) return;
    if (key === "e" && !editing) startEditing();
    else if (key === "c" || (vim.value && key === "y")) actions?.copy();
    else if (vim.value && key === "p") togglePin(snippet);
    else return;
    event.preventDefault();
  }
</script>

<svelte:window onkeydown={onKeydown} onbeforeunload={(e) => dirty && e.preventDefault()} />

{#if loading}
  <Loading label="loading snippet..." />
{:else if !snippet}
  <NotFound message={error ?? "snippet not found"} />
{:else}
  {@const current = snippet}
  <AppHeader />
  <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:gap-6 sm:py-8">

    <SnippetActions bind:this={actions} snippet={current} onCopied={() => (current.copy_count += 1)}>
      <Button variant="outline" size="icon-sm" onclick={() => share(current)} aria-label="copy link" tip="copy link"><Share2 class="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" class={TOGGLE} onclick={() => togglePublic(current)} aria-pressed={current.public} aria-label="public" tip={current.public ? "public" : "private"}>
        {#if current.public}<Globe class="size-4" />{:else}<Lock class="size-4" />{/if}
      </Button>
      <Button variant="ghost" size="icon-sm" class={TOGGLE} onclick={() => togglePin(current)} aria-pressed={current.pinned} aria-label="pinned" tip={current.pinned ? "pinned" : "pin"}>
        <Pin class="size-4 {current.pinned ? 'fill-current' : ''}" />
      </Button>
      <Button variant="outline" size="icon-sm" onclick={() => startEditing()} aria-label="edit" tip="edit"><Pencil class="size-4" /></Button>
      <span class="mx-1 h-5 w-px bg-border" aria-hidden="true"></span>
      <Button variant="ghost" size="icon-sm" class="text-destructive hover:bg-destructive/10 hover:text-destructive" onclick={() => remove(current)} disabled={deleting} aria-label="delete" tip="delete">
        {#if deleting}<LoaderCircle class="size-4 animate-spin" />{:else}<Trash class="size-4" />{/if}
      </Button>
    </SnippetActions>

    <header class="space-y-2 rounded-2xl border border-border/70 p-3 sm:space-y-3 sm:p-4 {editing ? 'border-accent/50 bg-card/80' : 'bg-card/70'}">
      {#if editing}
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold tracking-tight text-muted-foreground">editing snippet</span>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" onclick={cancelEditing} disabled={editing.saving}>cancel</Button>
            <Button size="sm" onclick={save} disabled={editing.saving}>
              {#if editing.saving}<LoaderCircle class="size-4 animate-spin" /> saving...{:else}save{/if}
            </Button>
          </div>
        </div>
        <ErrorNote message={editing.error} />
        <SnippetFields bind:draft={editing.draft} bind:tagsInput={editing.tags} bind:error={editing.error} disabled={editing.saving} />
      {:else}
        <SnippetMeta snippet={current} status={refreshing ? "refreshing..." : undefined}>
          <ErrorNote message={actionError} />
        </SnippetMeta>
      {/if}
    </header>

    <section class={!aiMinimized ? "grid items-start gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_380px]" : "space-y-3"}>
      <div class="space-y-2 sm:space-y-3">
        {#if aiMinimized}
          <div class="flex justify-end animate-subtle-fade-up">
            <Button variant="outline" size="sm" onclick={() => (aiOverride = false)}><PanelRightOpen class="size-4" /> open ai chat</Button>
          </div>
        {/if}

        {#if editing}
          <section class="rounded-2xl border border-accent/50 bg-card/70 p-3">
            <span class="mb-2 block text-xs font-semibold text-muted-foreground">code</span>
            <CodeEditor bind:value={editing.draft.code} language={editing.draft.language} class="{CODE_HEIGHT} overflow-hidden rounded-md border border-input" />
          </section>
        {:else}
          <CodeBlock code={current.code} language={current.language} class={CODE_HEIGHT} />
        {/if}
      </div>

      {#if !aiMinimized}
        <div class="h-[50vh] min-h-[320px] overflow-hidden sm:h-[56vh] sm:min-h-[420px] lg:h-[62vh] lg:max-h-[780px] lg:min-h-[520px] xl:sticky xl:top-24" transition:fly={{ y: 8, duration: 240 }}>
          <AiChat
            snippet={current}
            onMinimize={() => (aiOverride = true)}
            onApplyCode={(code) => {
              toast("ai suggestion loaded into editor", "success");
              if (editing) editing.draft.code = code;
              else startEditing(code);
            }}
          />
        </div>
      {/if}
    </section>
  </main>
{/if}
