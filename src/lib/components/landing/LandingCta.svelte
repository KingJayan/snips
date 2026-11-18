<script lang="ts">
  import AppLogo from "../AppLogo.svelte";
  import Button from "../ui/Button.svelte";
</script>

<div class="border-t border-zinc-800/50 bg-zinc-950">
  <section class="mx-auto flex max-w-5xl flex-col items-start gap-8 px-8 py-24 sm:flex-row sm:items-end sm:justify-between">
    <div class="max-w-md">
      <p class="mb-3 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">get started</p>
      <h2 class="text-3xl leading-[1.05] font-bold tracking-tight text-white" style:font-family="var(--font-display)">
        your snippets deserve<br /><span class="text-zinc-500">a better home.</span>
      </h2>
      <p class="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">free, open, no vendor lock-in. sign up in ten seconds and start saving the code you keep rewriting.</p>
    </div>
    <div class="flex shrink-0 flex-col items-start gap-3 sm:items-end">
      <Button href="/snippets" size="lg" class="bg-white text-zinc-950 hover:bg-zinc-100">open the vault</Button>
      <p class="text-xs text-zinc-700">just click the button already</p>
      <p class="text-xs text-zinc-700">you know you want to</p>
    </div>
  </section>
</div>

<footer class="border-t border-zinc-800/40 bg-zinc-950 py-6">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-8">
    <AppLogo />
    <div class="flex items-center gap-6">
      <a href="/public" class="text-xs text-zinc-700 transition-colors hover:text-zinc-400">explore public snippets</a>
      <p class="text-xs text-zinc-700">&copy; {new Date().getFullYear()} Snips</p>
    </div>
  </div>
</footer>
