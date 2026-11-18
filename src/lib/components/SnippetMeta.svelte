<script lang="ts">
  import type { Snippet } from "svelte";
  import { Globe } from "@lucide/svelte";
  import { timeAgo } from "#lib/time.ts";
  import type { SnippetWithTags } from "#lib/types.ts";
  import { renderMarkdown } from "#lib/utils.ts";
  import Badge from "./ui/Badge.svelte";

  let { snippet, status, children }: { snippet: SnippetWithTags; status?: string; children?: Snippet } = $props();

  const stats = $derived(
    [
      snippet.language,
      `${snippet.code ? snippet.code.split("\n").length : 0} lines`,
      `${snippet.code.length} chars`,
      `${snippet.view_count} views`,
      `${snippet.copy_count} copies`,
      status ?? `updated ${timeAgo(snippet.updated_at)}`,
    ].join(" · ")
  );
</script>

<div class="flex items-start justify-between gap-3">
  <div class="flex-1 space-y-2">
    <h1 class="text-xl font-semibold tracking-tight">{snippet.title}</h1>
    {#if snippet.description}
      <div class="text-sm text-muted-foreground">{@html renderMarkdown(snippet.description)}</div>
    {/if}
  </div>
  {#if snippet.public}
    <Badge variant="outline" class="shrink-0"><Globe class="size-3" /> public</Badge>
  {/if}
</div>

<p class="font-mono text-xs text-muted-foreground">{stats}</p>

{#if snippet.tags.length}
  <div class="flex flex-wrap gap-1.5">
    {#each snippet.tags as tag (tag.id)}
      <Badge variant="outline" class="max-w-32 truncate" title={tag.name.length > 20 ? tag.name : undefined}>{tag.name}</Badge>
    {/each}
  </div>
{/if}

{@render children?.()}
