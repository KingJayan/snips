<script lang="ts">
  import { Accessibility, Palette, Search, SlidersHorizontal, Sparkles } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { APP_VERSION } from "#lib/app-version.ts";
  import { settingsDialog } from "#lib/settings-dialog.svelte.ts";
  import { cn } from "#lib/utils.ts";
  import Dialog from "../ui/Dialog.svelte";
  import SettingRow from "./SettingRow.svelte";
  import { GROUPS, LABELS, type SettingsGroup } from "./schema";

  const RECENT_KEY = "snips.pref.recent-changes";
  const NAV: Array<{ id: SettingsGroup; label: string; icon: typeof Palette }> = [
    { id: "personalization", label: "personal", icon: Palette },
    { id: "ai", label: "ai", icon: Sparkles },
    { id: "preferences", label: "prefs", icon: SlidersHorizontal },
    { id: "accessibility", label: "a11y", icon: Accessibility },
  ];

  let group = $state<SettingsGroup>("personalization");
  let query = $state("");
  let recent = $state<string[]>([]);

  const needle = $derived(query.trim().toLowerCase());
  const items = $derived(GROUPS[group].filter((item) => !needle || item.terms.some((term) => term.includes(needle))));

  function remember(label: string) {
    recent = [label, ...recent.filter((entry) => entry !== label)].slice(0, 6);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch {
      return;
    }
  }

  onMount(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
      recent = Array.isArray(stored) ? stored.map((entry) => entry?.label ?? entry).filter((entry) => typeof entry === "string").slice(0, 6) : [];
    } catch {
      recent = [];
    }
    const onSetting = (event: Event) => {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (key) remember(LABELS[key] ?? key);
    };
    window.addEventListener("snips-settings-changed", onSetting);
    return () => {
      window.removeEventListener("snips-settings-changed", onSetting);
      };
  });
</script>

<Dialog bind:open={settingsDialog.open} title="settings" description="configure ai features, personalization, and accessibility preferences." class="max-h-[85vh] max-w-2xl rounded-2xl border-border/70 sm:max-w-2xl" headerClass="border-b border-border/70 px-5 py-4">
  <div class="border-b border-border/70 px-4 py-2.5">
    <div class="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-1.5">
      <Search class="size-3.5 shrink-0 text-muted-foreground" />
      <input bind:value={query} placeholder="search all settings…" class="h-6 w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60" />
    </div>
  </div>

  <div class="grid min-h-0 flex-1 grid-cols-[130px_minmax(0,1fr)]">
    <nav class="space-y-1 border-r border-border/70 bg-muted/20 p-2">
      {#each NAV as entry (entry.id)}
        <button
          class={cn("w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors", group === entry.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}
          onclick={() => (group = entry.id)}
        >
          <span class="inline-flex items-center gap-1"><entry.icon class="size-3" /> {entry.label}</span>
        </button>
      {/each}
    </nav>

    {#key group}
      <div class="max-h-[60vh] space-y-2 overflow-y-auto p-4 theme-scrollbar animate-subtle-fade-up">
        {#if recent.length && (group === "personalization" || !needle)}
          <section class="mb-3 rounded-lg border border-border/70 bg-card px-3 py-2">
            <p class="text-xs font-medium">recently changed</p>
            {#each recent.slice(0, 4) as label (label)}
              <p class="mt-1 text-xs text-muted-foreground">{label}</p>
            {/each}
          </section>
        {/if}
          {#each items as item (item.key)}
            <SettingRow {item} />
          {/each}
      </div>
    {/key}
  </div>

  <div class="border-t border-border/70 px-4 py-2">
    <p class="text-xs text-muted-foreground">{APP_VERSION}</p>
  </div>
</Dialog>
