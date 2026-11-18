<script lang="ts">
  import { LoaderCircle, LogIn, LogOut, Mail, RefreshCw } from "@lucide/svelte";
  import Button from "./ui/Button.svelte";
  import Input from "./ui/Input.svelte";

  type Props = {
    email: string;
    authenticated: boolean;
    busy: boolean;
    message: string | null;
    error: string | null;
    onSendMagicLink: () => void;
    onSignOut: () => void;
    onRefresh: () => void;
  };

  let { email = $bindable(), authenticated, busy, message, error, onSendMagicLink, onSignOut, onRefresh }: Props = $props();
  const status = $derived(authenticated ? "session active" : "sign in with magic link to access your snippets");
</script>

<section class="rounded-2xl border border-border/70 bg-card/70 p-4 vfx-surface vfx-sheen vfx-edge-light vfx-glass vfx-float-shadow">
  <div class="space-y-1">
    <h2 class="text-sm font-medium">authentication</h2>
    <span class="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground animate-subtle-pop-in vfx-icon-chip" title={status}>
      {#if authenticated}<RefreshCw class="size-3" />{:else}<Mail class="size-3" />{/if}
      <span class="sr-only">{status}</span>
    </span>
  </div>

  <div class="mt-3 flex flex-wrap items-center gap-2">
    <Button variant="outline" size="sm" onclick={onRefresh} disabled={busy}><RefreshCw class="size-4" /> refresh session</Button>
    {#if authenticated}
      <Button variant="outline" size="sm" onclick={onSignOut} disabled={busy}>
        {#if busy}<LoaderCircle class="size-4 animate-spin" />{:else}<LogOut class="size-4" />{/if}
        sign out
      </Button>
    {/if}
  </div>

  {#if !authenticated}
    <form
      class="mt-3 flex flex-col gap-2 sm:flex-row"
      onsubmit={(e) => {
        e.preventDefault();
        onSendMagicLink();
      }}
    >
      <div class="relative flex-1">
        <Mail class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="email" bind:value={email} placeholder="you@example.com" class="pl-9" required />
      </div>
      <Button type="submit" disabled={busy}>
        {#if busy}<LoaderCircle class="size-4 animate-spin" />{:else}<LogIn class="size-4" />{/if}
        send magic link
      </Button>
    </form>
  {/if}

  {#if message}
    <p class="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-300">{message}</p>
  {/if}
  {#if error}
    <p class="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
  {/if}
</section>
