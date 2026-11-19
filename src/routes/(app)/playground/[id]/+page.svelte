<script lang="ts">
  import { ArrowLeft } from "@lucide/svelte";
  import { page } from "$app/state";
  import AppHeader from "#lib/components/AppHeader.svelte";
  import Loading from "#lib/components/Loading.svelte";
  import NotFound from "#lib/components/NotFound.svelte";
  import SnippetPlayground from "#lib/components/SnippetPlayground.svelte";
  import { confirmLeave } from "#lib/confirm.svelte.ts";
  import { writeCachedSnippet } from "#lib/snippet-cache.ts";
  import { toDraft } from "#lib/snippet-draft.ts";
  import { getSnippetById, updateSnippet } from "#lib/snippet-service.ts";
  import { getCurrentUser } from "#lib/supabase.ts";
  import { toast } from "#lib/toast.svelte.ts";
  import type { SnippetWithTags } from "#lib/types.ts";

  let snippet = $state<SnippetWithTags | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let dirty = $state(false);
  let owned = $state(false);

  confirmLeave(() => owned && dirty);

  $effect(() => {
    const id = page.params.id ?? "";
    let active = true;
    loading = true;
    Promise.all([getSnippetById(id), getCurrentUser()]).then(([{ data, error: loadError }, user]) => {
      if (!active) return;
      snippet = data;
      owned = Boolean(data && data.user_id === user?.id);
      error = loadError;
      loading = false;
    });
    return () => (active = false);
  });

  async function save(code: string) {
    if (!snippet) return;
    const { data, error: saveError } = await updateSnippet(snippet.id, { ...toDraft(snippet), code });
    if (!data) return void toast(saveError ?? "failed to save", "error");
    snippet = data;
    writeCachedSnippet(data);
    toast("saved", "success");
  }
</script>

{#if loading}
  <Loading label="loading snippet..." />
{:else if !snippet}
  <NotFound message={error ?? "snippet not found"} />
{:else}
  <div class="flex min-h-screen flex-col bg-background motion-safe-enter">
    <AppHeader />
    <main class="mx-auto w-full max-w-4xl flex-1 space-y-4 px-4 py-6 animate-subtle-fade-up sm:px-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-lg font-semibold tracking-tight">{snippet.title || "playground"}</h1>
          <p class="font-mono text-xs text-muted-foreground">{snippet.language}</p>
        </div>
        <a href="/{owned ? "snippets" : "public"}/{snippet.id}" class="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft class="size-4" /> view snippet</a>
      </div>
      <SnippetPlayground initialCode={snippet.code} initialLanguage={snippet.language} bind:dirty onSave={owned ? save : undefined} />
    </main>
  </div>
{/if}
