<script lang="ts">
  import { Check } from "@lucide/svelte";
  import { boolSetting, readStringSetting, SETTINGS_KEYS, stringSetting, writeBoolSetting, writeStringSetting } from "#lib/settings.ts";
  import Select from "../ui/Select.svelte";
  import { PRESETS, type SettingItem } from "./schema";

  let { item }: { item: SettingItem } = $props();

  const bool = $derived(item.kind === "toggle" ? boolSetting(item.key, item.fallback) : null);
  const text = $derived(item.kind === "select" ? stringSetting(item.key, item.fallback) : null);

  function markCustom() {
    if (item.preset && readStringSetting(SETTINGS_KEYS.personalizationPreset, "balanced") !== "custom") {
      writeStringSetting(SETTINGS_KEYS.personalizationPreset, "custom");
    }
  }

  function applyPreset(name: string) {
    for (const [key, value] of Object.entries(PRESETS[name] ?? {})) {
      if (typeof value === "boolean") writeBoolSetting(key, value);
      else writeStringSetting(key, value);
    }
  }

  function select(value: string) {
    if (!text) return;
    text.value = value;
    if (item.key === SETTINGS_KEYS.personalizationPreset) applyPreset(value);
    else markCustom();
  }

  function toggle() {
    if (!bool) return;
    bool.value = !bool.value;
    markCustom();
  }
</script>

{#if bool}
  <button onclick={toggle} class="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:bg-accent">
    <div>
      <p class="text-sm font-medium">{item.label}</p>
      {#if item.desc}<p class="text-xs text-muted-foreground">{item.desc}</p>{/if}
    </div>
    {#if bool.value}<Check class="size-4 text-foreground" />{/if}
  </button>
{:else if text && item.kind === "select"}
  <label class="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2">
    <span class="text-sm font-medium">{item.label}</span>
    <Select value={text.value} options={item.options} class="mt-1" onchange={(e) => select(e.currentTarget.value)} />
    {#if item.desc}<p class="mt-1 text-xs text-muted-foreground">{item.desc}</p>{/if}
  </label>
{/if}
