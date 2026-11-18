<script lang="ts">
  import type { Snippet } from "svelte";
  import { ArrowLeft, Copy, Download, Eye } from "@lucide/svelte";
  import { formatSnippetForCopy, type SnippetCopyMode } from "#lib/copy-modes.ts";
  import { incrementSnippetCounter } from "#lib/snippet-service.ts";
  import { downloadSnippet, viewRaw } from "#lib/snippet-file.ts";
  import { toast } from "#lib/toast.svelte.ts";
  import type { SnippetWithTags } from "#lib/types.ts";
  import Button from "./ui/Button.svelte";
  import Select from "./ui/Select.svelte";

  let { snippet, back = "/snippets", onCopied, children }: { snippet: SnippetWithTags; back?: string; onCopied: () => void; children?: Snippet } = $props();

  const MODES: Array<{ value: SnippetCopyMode; label: string }> = [
    { value: "raw", label: "raw code" },
    { value: "markdown", label: "markdown block" },
    { value: "line-numbers", label: "with line numbers" },
  ];

  let mode = $state<SnippetCopyMode>("raw");

  export async function copy() {
    try {
      await navigator.clipboard.writeText(formatSnippetForCopy({ code: snippet.code, language: snippet.language, mode }));
      toast(`copied (${mode})`, "success");
      const { data: counted } = await incrementSnippetCounter(snippet.id, "copy");
      if (counted) onCopied();
    } catch {
      toast("copy failed", "error");
    }
  }
</script>

<section class="sticky top-2 z-20 rounded-2xl border border-border/70 bg-card/90 p-2.5 backdrop-blur supports-[backdrop-filter]:bg-card/70 sm:p-3">
  <div class="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
    <a href={back} class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:text-sm"><ArrowLeft class="size-4" /> back</a>
    <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <Select bind:value={mode} options={MODES} class="h-7 w-auto px-1.5 sm:h-8 sm:px-2" aria-label="copy mode" />
      <Button variant="outline" size="icon-sm" onclick={copy} aria-label="copy" tip="copy"><Copy class="size-4" /></Button>
      <Button variant="outline" size="icon-sm" onclick={() => viewRaw(snippet.code)} aria-label="view raw" tip="view raw"><Eye class="size-4" /></Button>
      <Button
        variant="outline"
        size="icon-sm"
        onclick={() => {
          downloadSnippet(snippet);
          toast("download started", "success");
        }}
        aria-label="download"
        tip="download"
      >
        <Download class="size-4" />
      </Button>
      {@render children?.()}
    </div>
  </div>
</section>
