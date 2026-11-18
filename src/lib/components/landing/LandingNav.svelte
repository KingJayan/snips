<script lang="ts">
  import AppLogo from "../AppLogo.svelte";
  import Button from "../ui/Button.svelte";

  let scrollY = $state(0);
</script>

<svelte:window bind:scrollY />

<nav
  class="fixed inset-x-0 top-0 z-50 transition-all duration-300 {scrollY > 24 ? 'border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur-md' : ''}"
>
  <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-8">
    <div class="flex items-center gap-3">
      <AppLogo />
      <span class="hidden items-center rounded-full border border-indigo-800/60 bg-indigo-950/50 px-2 py-0.5 font-mono text-[9px] tracking-widest text-indigo-500 uppercase sm:inline-flex">beta</span>
    </div>
    <div class="flex items-center gap-3">
      <a href="/public" class="hidden text-xs text-zinc-500 transition-colors hover:text-zinc-300 sm:block">explore</a>
      <Button href="/snippets" variant="outline" size="sm" class="border-zinc-700 bg-transparent text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white">sign in</Button>
    </div>
  </div>
</nav>
