<script lang="ts">
  import { CodeXml } from "@lucide/svelte";
</script>

<div class="group inline-flex items-center gap-2 select-none">
  <div class="relative size-8 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm transition-colors group-hover:border-primary/20">
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-full p-0.5">
      <rect width="32" height="32" rx="6" class="fill-zinc-900 transition-colors group-hover:fill-zinc-800 dark:fill-zinc-950" />
      <g stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 16L12 12M8 16L12 20M24 16L20 12M24 16L20 20" class="stroke-white" />
        <path d="M17 10L15 22" class="stroke-zinc-400 transition-colors group-hover:stroke-white" />
      </g>
    </svg>
  </div>
  <div class="leading-tight">
    <p class="text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">Snips</p>
    <div class="mt-0.5 inline-flex items-center gap-1 rounded-md border border-border/40 bg-background/60 px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground select-none animate-subtle-pop-in">
      <CodeXml class="size-2.5 shrink-0" />
      <span>code library</span>
    </div>
  </div>
</div>
