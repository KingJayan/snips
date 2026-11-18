<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { dev } from "$app/env";
  import DevDebugPanel from "#lib/components/DevDebugPanel.svelte";
  import SettingsDialog from "#lib/components/settings/SettingsDialog.svelte";
  import ThemeToggle from "#lib/components/ThemeToggle.svelte";
  import Toaster from "#lib/components/Toaster.svelte";
  import { cursorEffects } from "#lib/effects/cursor.ts";
  import { syncRootClasses } from "#lib/settings.ts";

  let { children } = $props();

  onMount(cursorEffects);
  $effect(syncRootClasses);
</script>

<svelte:head>
  <title>snips - code snippet library</title>
  <meta name="description" content="personal vault for reusable code" />
</svelte:head>

{@render children()}
<Toaster />
{#if dev}<DevDebugPanel />{/if}
<SettingsDialog />
<ThemeToggle />
