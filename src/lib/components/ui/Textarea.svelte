<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { cn } from "#lib/utils.ts";
  import { fieldClass } from "./variants";

  let { value = $bindable(), class: className, ...rest }: HTMLTextareaAttributes = $props();
</script>

<textarea bind:value class={cn(fieldClass, "flex field-sizing-content min-h-16 py-2", className)} {...rest}></textarea>
