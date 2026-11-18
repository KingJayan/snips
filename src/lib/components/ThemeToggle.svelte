<script lang="ts">
  import { onMount } from "svelte";
  import { Moon, Sun } from "@lucide/svelte";
  import Button from "./ui/Button.svelte";

  let dark = $state(true);

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

  const label = $derived(dark ? "switch to light mode" : "switch to dark mode");
</script>

<Button
  variant="outline"
  size="icon"
  class="fixed right-4 bottom-4 z-[60] rounded-full border-border/70 bg-card/90 shadow-lg backdrop-blur"
  onclick={toggle}
  aria-label={label}
  title={label}
>
  {#if dark}<Sun class="size-4" />{:else}<Moon class="size-4" />{/if}
</Button>
