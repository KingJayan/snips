<script lang="ts">
  import { LoaderCircle } from "@lucide/svelte";
  import { rankSimilarSnippets, type SimilarSnippetResult } from "#lib/ai/client-tools.ts";
  import { getSnippetById, listSnippets } from "#lib/snippet-service.ts";
  import type { SnippetWithTags } from "#lib/types.ts";
  import ErrorNote from "./ErrorNote.svelte";
  import Badge from "./ui/Badge.svelte";
  import Button from "./ui/Button.svelte";

  let { snippet }: { snippet: SnippetWithTags } = $props();

  let loading = $state(false);
  let error = $state<string | null>(null);
  let results = $state<SimilarSnippetResult[]>([]);

  async function find() {
    loading = true;
    error = null;
    try {
      const { data, error: listError } = await listSnippets({ workspaceId: snippet.workspace_id, limit: 30 });
      if (listError) throw new Error(listError);
      const ids = (data ?? []).filter((c) => c.id !== snippet.id).slice(0, 12).map((c) => c.id);
      const candidates = (await Promise.all(ids.map(async (id) => (await getSnippetById(id)).data))).filter((c): c is SnippetWithTags => Boolean(c));
      results = candidates.length ? await rankSimilarSnippets({ target: snippet, candidates }) : [];
    } catch (findError) {
      error = findError instanceof Error ? findError.message : "failed to find similar snippets";
    } finally {
      loading = false;
    }
  }
</script>

<section class="space-y-2 rounded-2xl border border-border/70 bg-card/60 p-3 animate-subtle-fade-up vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
  <div class="flex items-center justify-between gap-2">
    <h2 class="text-sm font-semibold tracking-tight">ai similar snippets</h2>
    <Button variant="outline" size="sm" onclick={find} disabled={loading}>
      {#if loading}<LoaderCircle class="size-4 animate-spin" /> searching...{:else}find similar{/if}
    </Button>
  </div>
  <ErrorNote message={error} class="px-2 py-1" />
  {#each results as item (item.id)}
    <div class="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
      <div class="flex items-center justify-between gap-2">
        <a href="/snippets/{item.id}" class="truncate text-sm font-medium hover:underline">{item.title}</a>
        <Badge variant="outline" class="text-[10px]">{item.score}%</Badge>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">{item.reason}</p>
    </div>
  {:else}
    <p class="text-xs text-muted-foreground">run search to discover related snippets.</p>
  {/each}
</section>
