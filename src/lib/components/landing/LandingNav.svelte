<script lang="ts">
  import AppControls from "../AppControls.svelte";
  import AppLogo from "../AppLogo.svelte";
  import Button from "../ui/Button.svelte";

  let scrollY = $state(0);
</script>

<svelte:window bind:scrollY />

<nav class="fixed inset-x-0 top-0 z-50 transition-all duration-300 {scrollY > 24 ? 'border-b border-border/60 bg-background/85 backdrop-blur-md' : ''}">
  <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-8">
    <AppLogo />
    <div class="flex items-center gap-2">
      <a href="/public" class="px-2 text-xs text-muted-foreground transition-colors hover:text-foreground">explore</a>
      <AppControls />
      <Button href="/snippets" variant="outline" size="sm" class="text-xs">sign in</Button>
    </div>
  </div>
</nav>
