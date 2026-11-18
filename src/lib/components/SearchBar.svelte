<script lang="ts">
  import { Search, X } from "@lucide/svelte";
  import Button from "./ui/Button.svelte";
  import Input from "./ui/Input.svelte";

  let { value = $bindable(), ref = $bindable(null) }: { value: string; ref?: HTMLInputElement | null } = $props();
</script>

<div class="relative w-full motion-safe-enter">
  <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
  <Input
    bind:value
    bind:ref
    placeholder="search title, description, tags..."
    aria-label="search snippets"
    class="h-10 rounded-xl border-border/70 bg-background pr-10 pl-9 transition-all duration-200 ease-out focus-visible:-translate-y-0.5 focus-visible:shadow-sm"
  />
  {#if value}
    <Button
      variant="ghost"
      size="icon-xs"
      class="absolute top-1/2 right-2 -translate-y-1/2 animate-subtle-pop-in"
      onclick={() => (value = "")}
      aria-label="clear search"
    >
      <X class="size-3" />
    </Button>
  {/if}
</div>
