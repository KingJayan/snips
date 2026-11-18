<script lang="ts">
  import { cn } from "#lib/utils.ts";

  let { message, class: className }: { message: string | null; class?: string } = $props();
</script>

{#if message}
  <p class={cn("rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive", className)}>{message}</p>
{/if}
