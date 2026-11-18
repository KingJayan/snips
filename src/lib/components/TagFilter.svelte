<script lang="ts">
  import Badge from "./ui/Badge.svelte";
  import Button from "./ui/Button.svelte";

  let { tags, active = $bindable() }: { tags: string[]; active: string | null } = $props();
</script>

{#if tags.length}
  <div class="flex flex-wrap items-center gap-2">
    {#each tags as tag (tag)}
      {@const isActive = active === tag}
      <Button
        variant={isActive ? "secondary" : "ghost"}
        size="xs"
        class="rounded-full"
        onclick={() => (active = isActive ? null : tag)}
        aria-pressed={isActive}
        aria-label="filter by tag {tag}"
      >
        <Badge variant={isActive ? "secondary" : "outline"} class="max-w-32 truncate" title={tag.length > 20 ? tag : undefined}>{tag}</Badge>
      </Button>
    {/each}
    {#if active}
      <Button variant="ghost" size="xs" onclick={() => (active = null)}>clear</Button>
    {/if}
  </div>
{/if}
