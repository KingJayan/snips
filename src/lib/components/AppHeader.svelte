<script lang="ts">
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { cn } from "#lib/utils.ts";
  import AppControls from "./AppControls.svelte";
  import AppLogo from "./AppLogo.svelte";

  let { children }: { children?: Snippet } = $props();

  const LINKS = [
    { href: "/snippets", label: "library" },
    { href: "/public", label: "explore" },
  ];
</script>

<header class="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
  <div class="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
    <a href="/snippets" aria-label="snips home"><AppLogo /></a>
    <nav class="flex items-center gap-1 text-sm">
      {#each LINKS as link (link.href)}
        <a
          href={link.href}
          class={cn("rounded-md px-2.5 py-1 transition-colors", page.url.pathname.startsWith(link.href) ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {link.label}
        </a>
      {/each}
    </nav>
    <div class="ml-auto flex items-center gap-2">
      {@render children?.()}
      <AppControls />
    </div>
  </div>
</header>
