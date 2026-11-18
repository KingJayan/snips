<script lang="ts">
  import Button from "./ui/Button.svelte";
  import Dialog from "./ui/Dialog.svelte";
  import Input from "./ui/Input.svelte";

  type Props = { open: boolean; title: string; description: string; initial: string; submitLabel: string; busy: boolean; onSubmit: (name: string) => void };

  let { open = $bindable(), title, description, initial, submitLabel, busy, onSubmit }: Props = $props();
  let name = $state("");

  $effect(() => {
    if (open) name = initial;
  });
</script>

<Dialog bind:open {title} {description} class="max-w-md rounded-2xl border-border/70">
  <form
    class="space-y-4 px-6 pb-6"
    onsubmit={(e) => {
      e.preventDefault();
      onSubmit(name.trim());
    }}
  >
    <label class="block space-y-2">
      <span class="text-xs text-muted-foreground">workspace name</span>
      <Input bind:value={name} placeholder="workspace name" maxlength={80} autofocus />
    </label>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" onclick={() => (open = false)} disabled={busy}>cancel</Button>
      <Button type="submit" disabled={busy}>{submitLabel}</Button>
    </div>
  </form>
</Dialog>
