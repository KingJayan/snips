<script lang="ts">
  import { LoaderCircle, Sparkles } from "@lucide/svelte";
  import { generateDescriptionForSnippet, generateTagsForSnippet } from "#lib/ai/client-tools.ts";
  import { LANGUAGE_OPTIONS } from "#lib/constants.ts";
  import { parseTags } from "#lib/snippet-draft.ts";
  import type { SnippetDraft } from "#lib/types.ts";
  import Button from "./ui/Button.svelte";
  import Input from "./ui/Input.svelte";
  import Select from "./ui/Select.svelte";
  import Textarea from "./ui/Textarea.svelte";

  type Props = { draft: SnippetDraft; tagsInput: string; error: string | null; disabled?: boolean; autofocus?: boolean };

  let { draft = $bindable(), tagsInput = $bindable(), error = $bindable(), disabled = false, autofocus = false }: Props = $props();
  let busy = $state<"tags" | "docs" | null>(null);

  async function assist(kind: "tags" | "docs") {
    if (!draft.code.trim()) return (error = `paste code first to generate ${kind}`);
    busy = kind;
    error = null;
    try {
      if (kind === "tags") tagsInput = [...new Set([...parseTags(tagsInput), ...(await generateTagsForSnippet(draft))])].join(", ");
      else draft.description = await generateDescriptionForSnippet(draft);
    } catch (aiError) {
      const message = aiError instanceof Error ? aiError.message : `failed to generate ${kind}`;
      error = message.includes("api key is required") ? "no api key — open settings → AI to add one" : message;
    } finally {
      busy = null;
    }
  }
</script>

{#snippet aiButton(kind: "tags" | "docs")}
  <Button variant="ghost" size="xs" onclick={() => assist(kind)} disabled={busy !== null || disabled}>
    {#if busy === kind}<LoaderCircle class="size-3 animate-spin" />{:else}<Sparkles class="size-3" />{/if}
    ai {kind}
  </Button>
{/snippet}

<label class="flex flex-col gap-1.5">
  <div class="flex items-center justify-between">
    <span class="text-xs text-muted-foreground">title</span>
    <span class="text-[10px] text-muted-foreground">{draft.title.length}/120</span>
  </div>
  <Input bind:value={draft.title} placeholder="title" maxlength={120} {autofocus} />
</label>

<div class="grid gap-3 sm:grid-cols-2">
  <label class="flex flex-col gap-1.5">
    <span class="text-xs text-muted-foreground">language</span>
    <Select bind:value={draft.language} options={LANGUAGE_OPTIONS} class="h-9 px-3 text-sm" />
  </label>
  <label class="flex flex-col gap-1.5">
    <div class="flex items-center justify-between">
      <span class="text-xs text-muted-foreground">tags (comma separated)</span>
      {@render aiButton("tags")}
    </div>
    <Input bind:value={tagsInput} placeholder="react, robotics, algorithms" />
  </label>
</div>

<label class="flex flex-col gap-1.5">
  <div class="flex items-center justify-between">
    <span class="text-xs text-muted-foreground">description</span>
    <div class="flex items-center gap-2">
      {@render aiButton("docs")}
      <span class="text-[10px] text-muted-foreground">{draft.description.length}/1000</span>
    </div>
  </div>
  <Textarea bind:value={draft.description} placeholder="short description" class="min-h-20" maxlength={1000} />
</label>
