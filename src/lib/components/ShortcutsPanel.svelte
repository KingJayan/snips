<script lang="ts">
  import Dialog from "./ui/Dialog.svelte";

  let { open = $bindable(), shortcuts }: { open: boolean; shortcuts: Array<{ key: string; action: string }> } = $props();
</script>

<Dialog bind:open title="keyboard shortcuts" class="max-w-md rounded-2xl">
  <div class="space-y-2 px-6 pb-6">
    {#each shortcuts as { key, action } (key)}
      <div class="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
        <span class="text-sm text-muted-foreground">{action}</span>
        <kbd class="rounded border border-border bg-background px-2 py-1 font-mono text-xs">{key}</kbd>
      </div>
    {/each}
  </div>
</Dialog>
