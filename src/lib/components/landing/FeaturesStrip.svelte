<script lang="ts">
  const FEATURES = [
    { num: "01", name: "collect", label: "snippet vault", desc: "tag, search, and pin snippets across languages. find anything in under two keystrokes.", detail: "python · typescript · sql · rust · bash · +more" },
    { num: "02", name: "organize", label: "workspaces", desc: "create isolated workspaces for projects. share a whole workspace publicly with one click.", detail: "private · public" },
    { num: "03", name: "run", label: "live playground", desc: "execute python right in the browser — no setup, no server. paste and go.", detail: "pyodide in-browser runtime" },
    { num: "04", name: "ask", label: "AI assist", desc: "explain, rewrite, or debug any snippet. bring your own key or use the built-in.", detail: "claude · openai · gemini" },
  ];
</script>

<section class="border-t border-border/60 bg-background">
  <div class="mx-auto max-w-5xl">
    <div class="border-b border-border/60 px-8 py-10">
      <p class="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">what's inside</p>
      <h2 class="text-2xl font-semibold text-foreground" style:font-family="var(--font-display)">
        everything you actually need.<span class="text-muted-foreground"> nothing you don't.</span>
      </h2>
    </div>
    <div class="grid grid-cols-1 border-b border-border/60 sm:grid-cols-2">
      {#each FEATURES as feature, i (feature.num)}
        <div class="group relative border-border/60 px-8 py-9 transition-colors duration-200 hover:bg-muted/40 {i % 2 === 0 ? 'sm:border-r' : ''} {i < FEATURES.length - 2 ? 'border-b' : i === FEATURES.length - 2 ? 'border-b sm:border-b-0' : ''}">
          <p class="mb-4 font-mono text-[10px] tracking-widest text-muted-foreground">{feature.num} · {feature.label}</p>
          <p class="mb-2 text-[15px] font-semibold text-foreground" style:font-family="var(--font-display)">{feature.name}</p>
          <p class="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
          <p class="mt-3 font-mono text-[10px] text-muted-foreground/80">{feature.detail}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
