<script lang="ts">
  import { answer, confirmState } from "#lib/confirm.svelte.ts";
  import Button from "./ui/Button.svelte";
  import Dialog from "./ui/Dialog.svelte";
</script>

<Dialog bind:open={() => confirmState.pending !== null, (open) => !open && answer(false)} title="are you sure?" description={confirmState.pending?.message} class="max-w-md rounded-2xl border-border/70">
  <div class="flex flex-col-reverse gap-2 px-6 pb-6 sm:flex-row sm:justify-end">
    <Button variant="outline" onclick={() => answer(false)}>cancel</Button>
    <Button variant={confirmState.pending?.action === "delete" ? "destructive" : "default"} onclick={() => answer(true)} autofocus>{confirmState.pending?.action}</Button>
  </div>
</Dialog>
