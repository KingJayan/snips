<script lang="ts">
  import { House, Play } from "@lucide/svelte";

  let { home = "/snippets", playgroundId = null }: { home?: string; playgroundId?: string | null } = $props();

  const links = $derived([
    { href: home, label: "go to snips", icon: House },
    ...(playgroundId ? [{ href: `/playground/${playgroundId}`, label: "open playground", icon: Play }] : []),
  ]);
</script>

{#snippet items(direction: string)}
  <div class="flex {direction} justify-center gap-2 rounded-2xl border border-border/45 bg-card/80 p-2 shadow-[0_10px_24px_-18px_hsl(var(--foreground)/0.35)] backdrop-blur vfx-surface vfx-glass">
    {#each links as link (link.href)}
      <a href={link.href} class="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground animate-subtle-pop-in vfx-icon-chip" title={link.label} aria-label={link.label}>
        <link.icon class="size-4" />
      </a>
    {/each}
  </div>
{/snippet}

<aside class="fixed top-1/2 left-4 z-40 hidden -translate-y-1/2 lg:block">{@render items("flex-col")}</aside>
<aside class="fixed inset-x-3 bottom-4 z-40 lg:hidden">{@render items("flex-row")}</aside>
