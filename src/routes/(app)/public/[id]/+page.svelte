<script lang="ts">
  import { ArrowUpRight, Globe } from "@lucide/svelte";
  import { page } from "$app/state";
  import CodeBlock from "#lib/components/CodeBlock.svelte";
  import CompactNav from "#lib/components/CompactNav.svelte";
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
  <main class="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:py-8 motion-safe-enter">
    <CompactNav />
    <SnippetActions snippet={current} onCopied={() => (current.copy_count += 1)} />
    <header class="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
      <SnippetMeta snippet={current} />
    </header>
    <CodeBlock code={current.code} language={current.language} />
    <footer class="flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
      <span class="inline-flex size-6 items-center justify-center rounded-md vfx-icon-chip" title="public snippet"><Globe class="size-3.5" /></span>
      <a href="/snippets" class="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:text-foreground vfx-icon-chip" title="create your own" aria-label="create your own"><ArrowUpRight class="size-3.5" /></a>
    </footer>
  </main>
{/if}
