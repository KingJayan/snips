<script lang="ts">
  import { LoaderCircle, Palette } from "@lucide/svelte";
  import { CODE_THEMES, DEFAULT_CODE_THEME, cacheKey, cachedHighlight, codeTheme, highlight, type CodeTheme } from "#lib/code-highlight.ts";
  import { boolSetting, SETTINGS_KEYS, stringSetting } from "#lib/settings.ts";
  import { cn } from "#lib/utils.ts";

  let { code, language, class: className }: { code: string; language: string; class?: string } = $props();

  const themeSetting = stringSetting<CodeTheme>(SETTINGS_KEYS.codeTheme, DEFAULT_CODE_THEME);
  const wrap = boolSetting(SETTINGS_KEYS.wrapCodeLines);
  const colors = $derived(codeTheme(themeSetting.value));
  const key = $derived(cacheKey(code, language, colors.value));

  let result = $state<{ key: string; html: string | null; error: string | null } | null>(null);
  let showThemes = $state(false);

  const html = $derived(cachedHighlight(key) ?? (result?.key === key ? result.html : null));
  const error = $derived(!html && result?.key === key ? result.error : null);

  $effect(() => {
    const current = key;
    let cancelled = false;
    highlight(code, language, colors.value)
      .then((output) => !cancelled && (result = { key: current, html: output, error: null }))
      .catch(() => !cancelled && (result = { key: current, html: null, error: "highlight unavailable. showing plain code." }));
    return () => (cancelled = true);
  });

  function closeThemes(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest("[data-theme-selector]")) showThemes = false;
  }
</script>

<svelte:document onclick={showThemes ? closeThemes : undefined} />

<section
  class={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl shadow-xs", className)}
  style:background-color={colors.bg}
  style:border="1px solid {colors.border}"
>
  <div class="relative z-20 flex items-center justify-between px-3 py-2" style:border-bottom="1px solid {colors.border}">
    <span class="font-mono text-xs" style:color={colors.text}>{language}</span>
    <div class="flex items-center gap-1" style:color={colors.text}>
      <div class="relative" data-theme-selector>
        <button class="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs opacity-70 hover:opacity-100" onclick={() => (showThemes = !showThemes)} aria-label="change theme">
          <Palette class="size-3" />
        </button>
        {#if showThemes}
          <div class="absolute top-full right-0 z-[60] mt-1 min-w-32 rounded-lg py-1 shadow-lg" style:background-color={colors.bg} style:border="1px solid {colors.border}">
            {#each CODE_THEMES as theme (theme.value)}
              <button
                class="w-full px-3 py-1.5 text-left text-xs hover:brightness-125"
                style:color={theme.text}
                style:background-color={theme.value === colors.value ? theme.border : "transparent"}
                onclick={() => {
                  themeSetting.value = theme.value;
                  showThemes = false;
                }}
              >
                {theme.label}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if error}
    <p class="px-3 py-2 text-xs opacity-70" style:color={colors.text} style:border-bottom="1px solid {colors.border}">{error}</p>
  {/if}

  {#if html}
    <div class={cn("min-h-0 flex-1", wrap.value ? "overflow-x-hidden overflow-y-auto" : "overflow-auto")}>
      <div class={cn("shiki-wrap text-sm", wrap.value && "wrap-lines")}>{@html html}</div>
    </div>
  {:else}
    <div class="min-h-0 flex-1 space-y-3 overflow-auto p-4">
      {#if !error}
        <div class="flex items-center gap-2 text-xs text-zinc-300">
          <LoaderCircle class="size-3 animate-spin" />
          rendering syntax highlight...
        </div>
      {/if}
      <pre class="overflow-x-auto font-mono text-xs leading-relaxed text-zinc-100">{code}</pre>
    </div>
  {/if}
</section>
