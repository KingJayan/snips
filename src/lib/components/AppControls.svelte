<script lang="ts">
  import { Moon, Settings2, Sun } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { settingsDialog } from "#lib/settings-dialog.svelte.ts";
  import Button from "./ui/Button.svelte";

  let dark = $state(true);
  const theme = $derived(dark ? "light mode" : "dark mode");

  onMount(() => {
    dark = document.documentElement.classList.contains("dark");
  });

  function toggle() {
    dark = !dark;
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("snips.theme", dark ? "dark" : "light");
    } catch {
      return;
    }
  }
</script>

<div class="flex items-center gap-1">
  <Button variant="ghost" size="icon-sm" onclick={toggle} aria-label={theme} tip={theme}>
    {#if dark}<Sun class="size-4" />{:else}<Moon class="size-4" />{/if}
  </Button>
  <Button variant="ghost" size="icon-sm" onclick={() => (settingsDialog.open = true)} aria-label="settings" tip="settings">
    <Settings2 class="size-4" />
  </Button>
</div>
