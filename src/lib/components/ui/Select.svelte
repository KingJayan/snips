<script lang="ts" generics="T extends string">
  import type { HTMLSelectAttributes } from "svelte/elements";
  import { cn } from "#lib/utils.ts";
  import { selectClass } from "./variants";

  type Props = Omit<HTMLSelectAttributes, "value"> & {
    value: T;
    options: ReadonlyArray<{ value: T; label: string }>;
  };

  let { value = $bindable(), options, class: className, ...rest }: Props = $props();
</script>

<select bind:value class={cn(selectClass, className)} {...rest}>
  {#each options as option (option.value)}
    <option value={option.value}>{option.label}</option>
  {/each}
</select>
