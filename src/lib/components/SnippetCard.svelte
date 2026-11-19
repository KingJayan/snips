<script lang="ts">
  import { Globe, Pin, Play, Trash } from "@lucide/svelte";
  import { canRun, extraTags } from "#lib/constants.ts";
  import { timeAgo } from "#lib/time.ts";
  import type { SnippetSummaryWithTags } from "#lib/types.ts";
  import { ask } from "#lib/confirm.svelte.ts";
  import { badgeVariants } from "./ui/variants";
  import { cn } from "#lib/utils.ts";

  type Props = {
    snippet: SnippetSummaryWithTags;
    basePath?: "/snippets" | "/public";
    selected?: boolean;
    onTagClick?: (tag: string) => void;
    onTogglePin?: (id: string, pinned: boolean) => void;
    onDelete?: (id: string) => void;
    onDragStart?: (id: string) => void;
    onDragEnd?: () => void;
  };

  let { snippet, basePath = "/snippets", selected = false, onTagClick, onTogglePin, onDelete, onDragStart, onDragEnd }: Props = $props();

  const tags = $derived(extraTags(snippet.tags, snippet.language));

  function dragStart(event: DragEvent) {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/snips-snippet-id", snippet.id);
    event.dataTransfer.setData("text/plain", snippet.id);
    onDragStart?.(snippet.id);
  }
</script>

<article
  draggable="true"
  ondragstart={dragStart}
  ondragend={() => onDragEnd?.()}
  class="snippet-card-shell group relative flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-within:ring-2 focus-within:ring-ring sm:gap-3 sm:p-4 motion-safe-enter"
  data-selected={selected}
  aria-current={selected ? "true" : undefined}
  style:contain="layout style"
  style:box-shadow={selected ? "0 0 0 2px color-mix(in oklch, var(--ring) 72%, transparent 28%)" : undefined}
>
  <div class="flex items-start justify-between gap-2 sm:gap-3">
    <div class="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1">
      <h3 class="truncate text-xs leading-tight font-semibold tracking-tight text-foreground sm:text-sm">
        <a href="{basePath}/{snippet.id}" class="outline-none after:absolute after:inset-0" title={snippet.title}>{snippet.title}</a>
      </h3>
      <p class="line-clamp-1 text-xs text-muted-foreground">{timeAgo(snippet.updated_at)}{snippet.description ? ` · ${snippet.description}` : ""}</p>
    </div>

    <div class="relative z-10 flex shrink-0 items-center gap-1">
      {#if canRun(snippet.language)}
        <a href="/playground/{snippet.id}" class="inline-flex items-center gap-1 rounded border border-border/70 px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Play class="size-3" /> run
        </a>
      {/if}

      {#if onTogglePin}
        <button
          onclick={() => onTogglePin(snippet.id, !snippet.pinned)}
          class="rounded p-1 transition-colors hover:bg-accent {snippet.pinned ? 'text-yellow-500' : 'text-muted-foreground'}"
          aria-label={snippet.pinned ? "unpin" : "pin"}
        >
          <Pin class="size-3 {snippet.pinned ? 'fill-current' : ''}" />
        </button>
      {/if}

      {#if onDelete}
        <button
          onclick={async () => (await ask(`delete "${snippet.title}"?`, "delete")) && onDelete(snippet.id)}
          class="rounded p-1 text-muted-foreground transition-colors pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100"
          aria-label="delete snippet"
        >
          <Trash class="size-3" />
        </button>
      {/if}

      {#if snippet.public && basePath !== "/public"}
        <span class="p-1 text-muted-foreground" title="public"><Globe class="size-3" /><span class="sr-only">public</span></span>
      {/if}
      <span class="font-mono text-xs text-muted-foreground">{snippet.language}</span>
    </div>
  </div>

  {#if tags.length}
    <div class="relative z-10 flex flex-wrap gap-1">
      {#each tags.slice(0, 4) as tag (tag.id)}
        <button
          type="button"
          class={cn(badgeVariants({ variant: "outline" }), "max-w-28 cursor-pointer truncate text-xs transition-colors hover:bg-accent")}
          onclick={() => onTagClick?.(tag.name)}
          aria-label="filter by {tag.name}"
          title={tag.name.length > 20 ? tag.name : undefined}
        >
          {tag.name}
        </button>
      {/each}
      {#if tags.length > 4}
        <span class="text-xs text-muted-foreground">+{tags.length - 4}</span>
      {/if}
    </div>
  {/if}
</article>
