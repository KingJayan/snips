<script lang="ts">
  import { boolSetting, stringSetting } from "#lib/settings.ts";
  import Select from "../ui/Select.svelte";
  import type { SettingItem } from "./schema";

  let { item }: { item: SettingItem } = $props();

  const bool = $derived(item.kind === "toggle" ? boolSetting(item.key, item.fallback) : null);
  const text = $derived(item.kind === "select" ? stringSetting(item.key, item.fallback) : null);
</script>

{#if bool}
  <button role="switch" aria-checked={bool.value} onclick={() => (bool.value = !bool.value)} class="flex w-full items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-colors hover:bg-accent">
    <div>
      <p class="text-sm font-medium">{item.label}</p>
      {#if item.desc}<p class="text-xs text-muted-foreground">{item.desc}</p>{/if}
    </div>
    <span class="flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors {bool.value ? 'bg-primary' : 'bg-input'}">
      <span class="size-4 rounded-full bg-background shadow-sm transition-transform {bool.value ? 'translate-x-4' : ''}"></span>
    </span>
  </button>
{:else if text && item.kind === "select"}
  <label class="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2">
    <span class="text-sm font-medium">{item.label}</span>
    <Select value={text.value} options={item.options} class="mt-1" onchange={(e) => (text.value = e.currentTarget.value)} />
    {#if item.desc}<p class="mt-1 text-xs text-muted-foreground">{item.desc}</p>{/if}
  </label>
{/if}
