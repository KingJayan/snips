<script lang="ts">
  import "../app.css";
  import { dev } from "$app/env";
  import DevDebugPanel from "#lib/components/DevDebugPanel.svelte";
  import SettingsDialog from "#lib/components/settings/SettingsDialog.svelte";
  import Toaster from "#lib/components/Toaster.svelte";
  import { syncRootClasses } from "#lib/settings.ts";

  let { children } = $props();

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
