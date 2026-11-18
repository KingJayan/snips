<script lang="ts">
  import { createVirtualizer } from "@tanstack/svelte-virtual";
  import { get } from "svelte/store";
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
  let scroller = $state<HTMLElement | null>(null);

  const virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({ count: 0, getScrollElement: () => scroller, estimateSize: () => 156, overscan: 8 });

  $effect(() => {
    const count = snippets.length;
    get(virtualizer).setOptions({ count });
  });

  $effect(() => {
    if (selected !== null) get(virtualizer).scrollToIndex(selected, { align: "auto" });
  });
</script>

<section bind:this={scroller} class="h-[62vh] overflow-y-auto rounded-2xl border border-border/70 bg-card/30 p-2 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
  <div class="relative w-full" style:height="{$virtualizer.getTotalSize()}px">
    {#each $virtualizer.getVirtualItems() as row (snippets[row.index]?.id ?? row.key)}
      {@const snippet = snippets[row.index]}
      {#if snippet}
        <div class="absolute top-0 left-0 w-full px-1 pb-1.5" style:transform="translateY({row.start}px)">
          <SnippetCard {snippet} selected={row.index === selected} {...handlers} />
        </div>
      {/if}
    {/each}
  </div>
</section>
