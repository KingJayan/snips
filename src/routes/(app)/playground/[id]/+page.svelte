<script lang="ts">
  import { ArrowLeft } from "@lucide/svelte";
  import { beforeNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import CompactNav from "#lib/components/CompactNav.svelte";
  import Loading from "#lib/components/Loading.svelte";
  import NotFound from "#lib/components/NotFound.svelte";
  import SnippetPlayground from "#lib/components/SnippetPlayground.svelte";
  import { getPublicSnippetById, getSnippetById } from "#lib/snippet-service.ts";
  import type { SnippetWithTags } from "#lib/types.ts";

  let snippet = $state<SnippetWithTags | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let dirty = $state(false);

  beforeNavigate((navigation) => {
    if (dirty && navigation.type !== "leave" && !confirm("you have unsaved changes. leave anyway?")) navigation.cancel();
  });

  $effect(() => {
    const id = page.params.id ?? "";
    let active = true;
    loading = true;
    getSnippetById(id)
      .then((own) => (own.data ? own : getPublicSnippetById(id)))
      .then(({ data, error: loadError }) => {
        if (!active) return;
        snippet = data;
        error = loadError;
        loading = false;
      });
    return () => (active = false);
  });
</script>

{#if loading}
  <Loading label="loading snippet..." />
{:else if !snippet}
  <NotFound message={error ?? "snippet not found"} />
{:else}
  <div class="flex min-h-screen flex-col bg-background motion-safe-enter">
    <CompactNav />
    <header class="sticky top-0 border-b border-border/60 bg-background/95 backdrop-blur-sm vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
      <div class="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <h1 class="text-xl font-semibold">{snippet.title || "playground"}</h1>
          <p class="mt-1 text-sm text-muted-foreground">{snippet.language}</p>
        </div>
        <a href="/snippets/{snippet.id}" class="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft class="size-4" /> view snippet</a>
      </div>
    </header>
    <main class="mx-auto w-full max-w-4xl flex-1 px-4 py-4 animate-subtle-fade-up sm:px-6 sm:py-6">
      <SnippetPlayground initialCode={snippet.code} initialLanguage={snippet.language} bind:dirty />
    </main>
  </div>
{/if}
