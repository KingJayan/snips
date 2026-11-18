<script lang="ts">
  import { ArrowLeft } from "@lucide/svelte";

  let { message }: { message: string } = $props();
</script>

<main class="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4 px-4 py-12">
  <a href="/snippets" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
    <ArrowLeft class="size-4" />
    back to snippets
  </a>
  <section class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{message}</section>
</main>
