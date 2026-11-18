<script lang="ts">
  import type { Snippet } from "svelte";
  import { Globe } from "@lucide/svelte";
  import { timeAgo } from "#lib/time.ts";
  import type { SnippetWithTags } from "#lib/types.ts";
  import { renderMarkdown } from "#lib/utils.ts";
  import Badge from "./ui/Badge.svelte";

  let { snippet, status, children }: { snippet: SnippetWithTags; status?: string; children?: Snippet } = $props();

  const stats = $derived([
    ["chars", snippet.benchmark_chars ?? 0],
    ["bytes", snippet.benchmark_bytes ?? 0],
    ["bits", snippet.benchmark_bits ?? 0],
    ["lines", snippet.benchmark_lines ?? 0],
    ["views", snippet.view_count],
    ["copies", snippet.copy_count],
  ]);
</script>

<div class="flex items-start justify-between gap-3">
  <div class="flex-1 space-y-2">
    <h1 class="text-xl font-semibold tracking-tight">{snippet.title}</h1>
    {#if snippet.description}
      <div class="text-sm text-muted-foreground">{@html renderMarkdown(snippet.description)}</div>
    {/if}
  </div>
  {#if snippet.public}
    <Badge class="shrink-0"><Globe class="mr-1 size-3" /> public</Badge>
  {/if}
</div>

<div class="flex flex-wrap items-center gap-2">
  <Badge variant="secondary">{snippet.language}</Badge>
  {#each stats as [label, value] (label)}
    <Badge variant="outline" class="text-[10px]">{label} {value}</Badge>
  {/each}
  {#each snippet.tags as tag (tag.id)}
    <Badge variant="outline" class="max-w-32 truncate" title={tag.name.length > 20 ? tag.name : undefined}>{tag.name}</Badge>
  {/each}
  <span class="ml-auto text-xs text-muted-foreground">{status ?? `updated ${timeAgo(snippet.updated_at)}`}</span>
</div>

{@render children?.()}
