<script lang="ts">
  import { LoaderCircle, Mail } from "@lucide/svelte";
  import Button from "./ui/Button.svelte";
  import Input from "./ui/Input.svelte";

  type Props = { email: string; busy: boolean; message: string | null; error: string | null; onSubmit: () => void };

  let { email = $bindable(), busy, message, error, onSubmit }: Props = $props();
</script>

<section class="mx-auto mt-16 w-full max-w-sm space-y-5 rounded-2xl border border-border/70 bg-card p-6 vfx-surface">
  <div class="space-y-1">
    <h1 class="text-lg font-semibold tracking-tight">sign in to snips</h1>
    <p class="text-sm text-muted-foreground">we'll email you a link. no password needed.</p>
  </div>

  {#if message}
    <p class="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
  {:else}
    <form
      class="space-y-3"
      onsubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div class="relative">
        <Mail class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="email" bind:value={email} placeholder="you@example.com" aria-label="email" class="pl-9" required />
      </div>
      <Button type="submit" disabled={busy} class="w-full">
        {#if busy}<LoaderCircle class="size-4 animate-spin" />{/if}
        send magic link
      </Button>
    </form>
  {/if}

  {#if error}
    <p class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
  {/if}

  <p class="text-center text-xs text-muted-foreground">or <a href="/public" class="underline underline-offset-4 hover:text-foreground">browse public snippets</a></p>
</section>
