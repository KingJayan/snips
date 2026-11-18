<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "#lib/utils.ts";
  import { fieldClass } from "./variants";

  let { value = $bindable(), ref = $bindable(null), class: className, ...rest }: HTMLInputAttributes & { ref?: HTMLInputElement | null } = $props();
</script>

<input bind:value bind:this={ref} class={cn(fieldClass, "h-9 py-1", className)} {...rest} />
