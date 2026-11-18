<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "#lib/utils.ts";
  import { badgeVariants, type BadgeVariants } from "./variants";

  let { class: className, variant, children, ...rest }: HTMLAttributes<HTMLSpanElement> & BadgeVariants = $props();
</script>

<span class={cn(badgeVariants({ variant }), className)} {...rest}>{@render children?.()}</span>
