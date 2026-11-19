<script lang="ts">
  import { LoaderCircle, Save } from "@lucide/svelte";
  import { on } from "svelte/events";
  import { ask } from "#lib/confirm.svelte.ts";
  import { draftChanged, toDraft, validateDraft } from "#lib/snippet-draft.ts";
  import type { SnippetDraft } from "#lib/types.ts";
  import CodeEditor from "./CodeEditor.svelte";
  import ErrorNote from "./ErrorNote.svelte";
  import SnippetFields from "./SnippetFields.svelte";
  import Button from "./ui/Button.svelte";
  import Dialog from "./ui/Dialog.svelte";

  let { open = $bindable(), onSave }: { open: boolean; onSave: (draft: SnippetDraft) => Promise<string | null> } = $props();

  let draft = $state(toDraft());
  let tagsInput = $state("");
  let error = $state<string | null>(null);
  let submitting = $state(false);

  $effect(() => {
    if (!open) return;
    draft = toDraft();
    tagsInput = "";
    error = null;
  });

  async function submit() {
    const parsed = validateDraft(draft, tagsInput);
    if (!parsed.data) return (error = parsed.error);
    submitting = true;
    error = await onSave(parsed.data);
    submitting = false;
    if (!error) open = false;
  }
</script>

{#snippet description()}paste code, add metadata, then save with <span class="font-medium">cmd/ctrl+enter</span>{/snippet}

<Dialog bind:open title="new snippet" {description} canClose={() => !submitting && (!draftChanged(draft, tagsInput) || ask("discard this snippet?", "discard"))} class="max-h-[92vh] max-w-3xl rounded-2xl border-border/70 sm:max-w-3xl" headerClass="border-b border-border/60 px-5 py-4">
  <form
    class="flex min-h-0 flex-1 flex-col"
    onsubmit={(e) => {
      e.preventDefault();
      submit();
    }}
    {@attach (form) => on(form, "keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    })}
  >
    <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4 theme-scrollbar">
      <SnippetFields bind:draft bind:tagsInput bind:error disabled={submitting} autofocus />
      <CodeEditor bind:value={draft.code} language={draft.language} placeholder="paste code..." class="max-h-[50vh] min-h-72 overflow-hidden rounded-md border border-input" />
      <ErrorNote message={error} />
    </div>
    <footer class="flex justify-end border-t border-border/60 px-5 py-4">
      <Button type="submit" disabled={submitting}>
        {#if submitting}<LoaderCircle class="size-4 animate-spin" /> saving...{:else}<Save class="size-4" /> save snippet{/if}
      </Button>
    </footer>
  </form>
</Dialog>
