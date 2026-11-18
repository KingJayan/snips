<script lang="ts">
  import { untrack } from "svelte";
  import { LoaderCircle, Play } from "@lucide/svelte";
  import { languageId } from "#lib/constants.ts";
  import { RUN_TIMEOUT_MS, runPython, type RunResult } from "#lib/execution/browser-runner.ts";
  import { renderMarkdown } from "#lib/utils.ts";
  import CodeEditor from "./CodeEditor.svelte";
  import ErrorNote from "./ErrorNote.svelte";
  import Button from "./ui/Button.svelte";
  import Select from "./ui/Select.svelte";
  import Textarea from "./ui/Textarea.svelte";

  let { initialCode, initialLanguage, dirty = $bindable(false) }: { initialCode: string; initialLanguage: string; dirty?: boolean } = $props();

  const initial = untrack(() => languageId(initialLanguage));
  const OPTIONS = [...new Set([initial, "python", "markdown", "plaintext"])].map((value) => ({ value, label: value }));

  let language = $state(initial);
  let code = $state(untrack(() => initialCode));
  let stdin = $state("");
  let running = $state(false);
  let error = $state<string | null>(null);
  let result = $state<RunResult | null>(null);

  const runnable = $derived(language === "python");
  const lineCount = $derived(code ? code.split("\n").length : 0);
  const note = $derived(
    runnable
      ? `python runs in your browser and stops after ${RUN_TIMEOUT_MS / 1000}s.`
      : language === "markdown"
        ? "markdown renders in the preview below."
        : language === "plaintext"
          ? "plain text has no output."
          : `can't run ${language} in the browser.`
  );

  $effect(() => {
    dirty = code !== initialCode;
  });

  async function run() {
    running = true;
    error = null;
    try {
      result = await runPython(code, stdin);
    } catch (executionError) {
      result = null;
      error = executionError instanceof Error ? executionError.message : "execution failed";
    } finally {
      running = false;
    }
  }
</script>

<svelte:window onbeforeunload={(e) => dirty && e.preventDefault()} />

<section class="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-3 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <h2 class="text-sm font-semibold tracking-tight">playground</h2>
    <div class="flex items-center gap-2">
      <Select bind:value={language} options={OPTIONS} class="w-auto" />
      <Button size="sm" onclick={run} disabled={running || !runnable}>
        {#if running}<LoaderCircle class="size-4 animate-spin" /> running...{:else}<Play class="size-4" /> run{/if}
      </Button>
    </div>
  </div>

  <p class="text-xs text-muted-foreground">{note}</p>

  <div class="grid gap-3 {runnable ? 'lg:grid-cols-[minmax(0,1fr)_300px]' : ''}">
    <label class="flex min-h-0 flex-col gap-1.5">
      <span class="text-xs text-muted-foreground">code ({lineCount} lines)</span>
      <CodeEditor bind:value={code} {language} placeholder="write or paste code" class="min-h-64 overflow-hidden rounded-md border border-input" />
    </label>
    {#if runnable}
      <label class="flex min-h-0 flex-col gap-1.5">
        <span class="text-xs text-muted-foreground">input panel (stdin)</span>
        <Textarea bind:value={stdin} class="min-h-64 font-mono text-xs leading-relaxed" placeholder="optional stdin input" />
      </label>
    {/if}
  </div>

  {#if language === "markdown"}
    <div class="rounded-xl border border-border/70 bg-background/40 p-4">
      <h3 class="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">preview</h3>
      {#if code.trim()}
        <div class="prose prose-sm max-w-none text-sm text-foreground dark:prose-invert">{@html renderMarkdown(code)}</div>
      {:else}
        <p class="text-xs text-muted-foreground">(nothing to preview)</p>
      {/if}
    </div>
  {/if}

  <ErrorNote message={error} />

  {#if runnable}
    <div class="space-y-2 rounded-xl border border-border/70 bg-background/40 p-3">
      <p class="text-xs text-muted-foreground">runtime: {result?.runtimeMs ?? "-"} ms</p>
      <div class="grid gap-2 lg:grid-cols-2">
        {#each [{ label: "output", text: result?.stdout || "(empty)", tone: "" }, { label: "errors", text: result?.stderr || "(none)", tone: "text-destructive" }] as pane (pane.label)}
          <section class="max-h-96 min-h-28 resize-y overflow-auto rounded-lg border border-border/70 bg-background/70 p-2">
            <h3 class="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{pane.label}</h3>
            <pre class="font-mono text-xs break-words whitespace-pre-wrap {pane.tone}">{pane.text}</pre>
          </section>
        {/each}
      </div>
    </div>
  {/if}
</section>
