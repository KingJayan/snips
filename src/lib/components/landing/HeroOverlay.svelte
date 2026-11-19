<script lang="ts">
  import Button from "../ui/Button.svelte";
</script>

<div aria-hidden="true" class="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_64%_58%_at_50%_50%,color-mix(in_oklch,var(--background)_94%,transparent)_0%,transparent_72%)]"></div>

<div class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
  <div class="pointer-events-auto flex max-w-3xl flex-col items-center text-center [&>*]:animate-subtle-fade-up [&>*]:[animation-fill-mode:both]">
    <p class="mb-6 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">code snippet vault &amp; playground</p>

    <h1 style:animation-delay="100ms" style:font-family="var(--font-display)">
      <span class="block text-[clamp(2.4rem,5.8vw,4rem)] leading-[1.1] font-light tracking-[0.055em] text-muted-foreground">stop losing</span>
      <span class="block text-[clamp(3rem,8vw,5.5rem)] leading-[0.92] font-bold tracking-tight text-foreground">the good&nbsp;<span class="text-indigo-500">stuff.</span></span>
    </h1>

    <p class="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground" style:animation-delay="240ms">
      one place for every snippet worth keeping, with AI, workspaces, and a live playground.
    </p>

    <div class="mt-8 flex flex-col items-center gap-3 sm:flex-row" style:animation-delay="360ms">
      <Button href="/snippets" size="lg" class="w-full sm:w-auto">start for free</Button>
      <Button href="/public" variant="ghost" size="lg" class="text-muted-foreground">browse public snippets</Button>
    </div>

    <p class="mt-5 text-xs text-muted-foreground/80" style:animation-delay="480ms">no card required &middot; free forever</p>
  </div>
</div>
