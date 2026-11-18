<script lang="ts">
  import AppLogo from "../AppLogo.svelte";
  import Button from "../ui/Button.svelte";
</script>

<div aria-hidden="true" class="pointer-events-none absolute inset-0 z-[5]" style="background: radial-gradient(ellipse 58% 52% at 50% 50%, rgba(9,9,11,0.78) 0%, transparent 68%)"></div>

<div class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
  <div class="pointer-events-auto flex max-w-3xl flex-col items-center text-center [&>*]:animate-subtle-fade-up [&>*]:[animation-fill-mode:both]">
    <div class="mb-7"><AppLogo /></div>

    <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/70 px-3 py-1 text-[10px] tracking-widest text-zinc-500 uppercase backdrop-blur-sm" style:animation-delay="60ms">
      <span class="inline-block size-1.5 rounded-full bg-indigo-500 opacity-90"></span>
      code snippet vault &amp; playground
    </div>

    <h1 style:animation-delay="140ms" style:font-family="var(--font-display)">
      <span class="block text-[clamp(2.4rem,5.8vw,4rem)] leading-[1.1] font-light tracking-[0.055em] text-zinc-400">stop losing</span>
      <span class="block text-[clamp(3rem,8vw,5.5rem)] leading-[0.92] font-bold tracking-tight text-white">the good&nbsp;<span class="text-indigo-500">stuff.</span></span>
    </h1>

    <p class="mt-6 max-w-xs text-[13px] leading-relaxed text-zinc-500" style:animation-delay="280ms">
      one place for every snippet worth keeping — with AI, workspaces, and a live playground.
    </p>

    <div class="mt-8 flex flex-col items-center gap-3 sm:flex-row" style:animation-delay="400ms">
      <Button href="/snippets" size="lg" class="w-full bg-white text-zinc-950 hover:bg-zinc-100 sm:w-auto">start for free</Button>
      <Button href="/snippets" variant="ghost" size="lg" class="text-zinc-600 hover:text-zinc-300">sign in</Button>
    </div>

    <p class="mt-5 text-[11px] text-zinc-700" style:animation-delay="520ms">no card required &middot; free forever</p>
  </div>
</div>
