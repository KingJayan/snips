<script lang="ts">
  import AppHeader from "./AppHeader.svelte";

  let { message }: { message: string } = $props();
</script>

<AppHeader />
<main class="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
  <h1 class="text-lg font-semibold tracking-tight">nothing here</h1>
  <p class="text-sm text-muted-foreground">{message}</p>
  <a href="/public" class="text-sm underline underline-offset-4 hover:text-foreground">browse public snippets</a>
</main>
