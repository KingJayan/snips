<script lang="ts">
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
  import { cn } from "#lib/utils.ts";
  import { buttonVariants, type ButtonVariants } from "./variants";

  type Props = HTMLButtonAttributes & ButtonVariants & { href?: string; tip?: string };

  let { class: className, variant, size, href, tip, type = "button", children, ...rest }: Props = $props();
  const classes = $derived(cn(buttonVariants({ variant, size }), className));
</script>

{#if href}
  <a {href} class={classes} data-tip={tip} {...rest as HTMLAnchorAttributes}>{@render children?.()}</a>
{:else}
  <button {type} class={classes} data-tip={tip} {...rest}>{@render children?.()}</button>
{/if}
