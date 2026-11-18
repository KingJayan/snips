<script lang="ts">
  import { Bug, ChevronUp, RefreshCw, Trash } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { DEV_OWNER_EMAIL } from "$app/env/public";
  import { page } from "$app/state";
  import { supabase } from "#lib/supabase.ts";
  import Button from "./ui/Button.svelte";

  const owner = DEV_OWNER_EMAIL?.toLowerCase().trim() ?? "";

  let allowed = $state(false);
  let open = $state(false);
  let stats = $state({ heap: null as number | null, session: 0, local: 0 });

  function refresh() {
    const used = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize;
    stats = { heap: used ? Math.round(used / 104857.6) / 10 : null, session: sessionStorage.length, local: localStorage.length };
  }

  function clearSession() {
    Object.keys(sessionStorage).filter((key) => key.startsWith("snips.")).forEach((key) => sessionStorage.removeItem(key));
    refresh();
  }

  onMount(() => {
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      allowed = Boolean(owner) && session?.user?.email?.toLowerCase().trim() === owner;
      if (allowed) refresh();
    }).data.subscription;
    return () => subscription?.unsubscribe();
  });

  $effect(() => {
    if (!allowed || !open) return;
    const interval = setInterval(refresh, 2500);
    return () => clearInterval(interval);
  });
</script>

{#if allowed}
  <div class="pointer-events-none fixed bottom-4 left-4 z-[85]">
    {#if !open}
      <Button size="icon-sm" variant="outline" class="pointer-events-auto" onclick={() => (open = true)} aria-label="open dev panel"><Bug class="size-4" /></Button>
    {:else}
      <section class="pointer-events-auto w-[300px] rounded-xl border border-border/70 bg-card/95 p-3 text-xs shadow-lg backdrop-blur">
        <header class="mb-2 flex items-center justify-between gap-2">
          <h2 class="flex items-center gap-1.5 font-medium"><Bug class="size-3.5" /> dev panel</h2>
          <Button size="icon-xs" variant="ghost" onclick={() => (open = false)} aria-label="close dev panel"><ChevronUp class="size-3" /></Button>
        </header>
        <div class="space-y-1.5 text-muted-foreground">
          <p><span class="text-foreground">route:</span> {page.url.pathname}</p>
          <p><span class="text-foreground">heap:</span> {stats.heap === null ? "n/a" : `${stats.heap} MB`}</p>
          <p><span class="text-foreground">session keys:</span> {stats.session}</p>
          <p><span class="text-foreground">local keys:</span> {stats.local}</p>
        </div>
        <div class="mt-3 flex items-center gap-1.5">
          <Button size="xs" variant="outline" onclick={refresh}><RefreshCw class="size-3" /> refresh</Button>
          <Button size="xs" variant="outline" onclick={clearSession}><Trash class="size-3" /> clear session</Button>
        </div>
      </section>
    {/if}
  </div>
{/if}
