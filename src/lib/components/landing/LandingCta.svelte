<script lang="ts">
  import AppLogo from "../AppLogo.svelte";
  import Button from "../ui/Button.svelte";
</script>

<div class="border-t border-border/60 bg-background">
  <section class="mx-auto flex max-w-5xl flex-col items-start gap-8 px-4 sm:px-8 py-24 sm:flex-row sm:items-end sm:justify-between">
    <div class="max-w-md">
      <p class="mb-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">get started</p>
      <h2 class="text-3xl leading-[1.05] font-bold tracking-tight text-foreground" style:font-family="var(--font-display)">
        your snippets deserve<br /><span class="text-muted-foreground">a better home.</span>
      </h2>
      <p class="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">free, open, no vendor lock-in. sign up in ten seconds and start saving the code you keep rewriting.</p>
    </div>
    <div class="flex shrink-0 flex-col items-start gap-3 sm:items-end">
      <Button href="/snippets" size="lg">open the vault</Button>
    </div>
  </section>
</div>

<footer class="border-t border-border/60 bg-background py-6">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-8">
    <AppLogo />
    <div class="flex items-center gap-6">
      <a href="/public" class="text-xs text-muted-foreground transition-colors hover:text-foreground">explore public snippets</a>
      <p class="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Snips</p>
    </div>
  </div>
</footer>
