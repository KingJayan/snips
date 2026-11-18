<script lang="ts">
  import { page } from "$app/state";
  import CodeBlock from "#lib/components/CodeBlock.svelte";
  import AppHeader from "#lib/components/AppHeader.svelte";
  import Loading from "#lib/components/Loading.svelte";
  import NotFound from "#lib/components/NotFound.svelte";
  import SnippetActions from "#lib/components/SnippetActions.svelte";
  import SnippetMeta from "#lib/components/SnippetMeta.svelte";
  import { getPublicSnippetById, incrementSnippetCounter } from "#lib/snippet-service.ts";
  import type { SnippetWithTags } from "#lib/types.ts";

  let snippet = $state<SnippetWithTags | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    const id = page.params.id ?? "";
    let active = true;
    loading = true;
    getPublicSnippetById(id).then(async ({ data, error: loadError }) => {
      if (!active) return;
      snippet = data;
      error = loadError;
      loading = false;
      if (!data) return;
      const { data: counted } = await incrementSnippetCounter(id, "view");
      if (counted && snippet?.id === id) snippet.view_count += 1;
    });
    return () => (active = false);
  });
</script>

{#if loading}
  <Loading label="loading snippet..." />
{:else if !snippet}
  <NotFound message={error ?? "snippet not found or not public"} />
{:else}
  {@const current = snippet}
  <AppHeader />
  <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:py-8 motion-safe-enter">
    <SnippetActions snippet={current} onCopied={() => (current.copy_count += 1)} />
    <header class="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
      <SnippetMeta snippet={current} />
    </header>
    <CodeBlock code={current.code} language={current.language} />
    <p class="text-center text-xs text-muted-foreground"><a href="/snippets" class="underline underline-offset-4 hover:text-foreground">save your own snippets with snips</a></p>
  </main>
{/if}
