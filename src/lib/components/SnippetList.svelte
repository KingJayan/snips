<script lang="ts">
  import type { SnippetSummaryWithTags } from "#lib/types.ts";
  import SnippetCard from "./SnippetCard.svelte";

  type Props = {
    snippets: SnippetSummaryWithTags[];
    selected: number | null;
    onTagClick: (tag: string) => void;
    onTogglePin: (id: string, pinned: boolean) => void;
    onDelete: (id: string) => void;
    onDragStart: (id: string) => void;
    onDragEnd: () => void;
  };

  let { snippets, selected, ...handlers }: Props = $props();
  let list = $state<HTMLElement | null>(null);

  $effect(() => {
    if (selected !== null) list?.children[selected]?.scrollIntoView({ block: "nearest" });
  });
</script>

<section bind:this={list} class="grid gap-1.5">
  {#each snippets as snippet, index (snippet.id)}
    <SnippetCard {snippet} selected={index === selected} {...handlers} />
  {/each}
</section>
