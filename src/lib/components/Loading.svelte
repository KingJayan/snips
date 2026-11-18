<script lang="ts">
  import { LoaderCircle } from "@lucide/svelte";

  let { label = "loading" }: { label?: string } = $props();
</script>

<main class="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4">
  <p class="flex items-center gap-2 text-sm text-muted-foreground">
    <LoaderCircle class="size-4 animate-spin" />
    {label}
  </p>
</main>
