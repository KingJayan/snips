<script lang="ts">
  import { ArrowUpRight, CodeXml, Compass } from "@lucide/svelte";
  import CompactNav from "#lib/components/CompactNav.svelte";
  import SearchBar from "#lib/components/SearchBar.svelte";
  import SnippetCard from "#lib/components/SnippetCard.svelte";
  import TagFilter from "#lib/components/TagFilter.svelte";
  import { collectTags, filterSnippets } from "#lib/search.ts";
  import { listPublicSnippets } from "#lib/snippet-service.ts";
  import { toast } from "#lib/toast.svelte.ts";
  import type { SnippetSummaryWithTags } from "#lib/types.ts";

  let snippets = $state<SnippetSummaryWithTags[]>([]);
  let loading = $state(true);
  let search = $state("");
  let activeTag = $state<string | null>(null);

  const filtered = $derived(filterSnippets(snippets, search, activeTag));
  const tags = $derived(collectTags(snippets));

  $effect(() => {
    const controller = new AbortController();
    listPublicSnippets({ signal: controller.signal }).then(({ data, error }) => {
      if (controller.signal.aborted) return;
      loading = false;
      if (error) toast(error, "error");
      snippets = data ?? [];
    });
    return () => controller.abort();
  });

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    if (search) search = "";
    else activeTag = null;
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="flex min-h-screen flex-col bg-background motion-safe-enter">
  <CompactNav />

  <header class="sticky top-0 border-b border-border/60 bg-background/95 backdrop-blur-sm vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
    <div class="mx-auto max-w-4xl px-4 py-4 sm:px-6">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold">public snippets</h1>
          <span class="mt-1 inline-flex size-5 items-center justify-center rounded-md text-muted-foreground vfx-icon-chip" title="browse and discover"><Compass class="size-3" /></span>
        </div>
        <a href="/snippets" class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground vfx-icon-chip" title="create your own" aria-label="create your own">
          <ArrowUpRight class="size-4" />
        </a>
      </div>
      <SearchBar bind:value={search} />
    </div>
  </header>

  <main class="mx-auto w-full max-w-4xl flex-1 px-4 py-6 animate-subtle-fade-up sm:px-6">
    <div class="mb-6"><TagFilter {tags} bind:active={activeTag} /></div>

    {#if loading}
      <div class="space-y-2">
        {#each { length: 5 }, index (index)}
          <div class="h-24 animate-pulse rounded-lg border border-border/40 bg-muted/20"></div>
        {/each}
      </div>
    {:else if !filtered.length}
      <section class="flex flex-col items-center justify-center space-y-3 py-12 text-center">
        <CodeXml class="size-12 text-muted-foreground/50" />
        <h2 class="font-medium">{snippets.length ? "no snippets found" : "no public snippets yet"}</h2>
        <p class="text-sm text-muted-foreground">{snippets.length ? "adjust search or filters to find more" : "create and share your snippets to see them here"}</p>
      </section>
    {:else}
      <div class="space-y-3">
        {#each filtered as snippet (snippet.id)}
          <SnippetCard {snippet} basePath="/public" />
        {/each}
      </div>
    {/if}
  </main>

  <footer class="flex items-center justify-center gap-2 border-t border-border/60 bg-muted/30 py-6 text-sm text-muted-foreground">
    <a href="https://github.com/kingjayan/code-snippet-library" class="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:text-foreground vfx-icon-chip" title="see the code" aria-label="see the code"><CodeXml class="size-4" /></a>
    <a href="https://github.com/KingJayan/code-snippet-library/blob/master/CONTRIBUTING.md" class="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:text-foreground vfx-icon-chip" title="contribute" aria-label="contribute"><ArrowUpRight class="size-4" /></a>
  </footer>
</div>
