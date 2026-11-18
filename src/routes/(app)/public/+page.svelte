<script lang="ts">
  import AppHeader from "#lib/components/AppHeader.svelte";
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
  <AppHeader />

  <main class="mx-auto w-full max-w-4xl flex-1 space-y-4 px-4 py-6 animate-subtle-fade-up sm:px-6">
    <div>
      <h1 class="text-lg font-semibold tracking-tight">public snippets</h1>
      <p class="text-xs text-muted-foreground">snippets people have shared</p>
    </div>
    <SearchBar bind:value={search} />
    <TagFilter {tags} bind:active={activeTag} />

    {#if loading}
      <div class="space-y-2">
        {#each { length: 5 }, index (index)}
          <div class="h-24 animate-pulse rounded-lg border border-border/40 bg-muted/20"></div>
        {/each}
      </div>
    {:else if !filtered.length}
      <section class="flex flex-col items-center justify-center space-y-3 py-12 text-center">
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

  <footer class="flex items-center justify-center gap-6 border-t border-border/60 py-6 text-xs text-muted-foreground">
    <a href="https://github.com/KingJayan/code-snippet-library" class="hover:text-foreground">source</a>
    <a href="https://github.com/KingJayan/code-snippet-library/blob/master/CONTRIBUTING.md" class="hover:text-foreground">contribute</a>
  </footer>
</div>
