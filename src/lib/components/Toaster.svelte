<script lang="ts">
  import { fly } from "svelte/transition";
  import { CircleAlert, CircleCheck, Info } from "@lucide/svelte";
  import { toastState } from "#lib/toast.svelte.ts";
  import { cn } from "#lib/utils.ts";

  const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
  const Icon = $derived(ICONS[toastState.tone]);
</script>

{#if toastState.message}
  <div
    class="pointer-events-none fixed right-4 z-[70]"
    style="bottom: calc(1rem + env(safe-area-inset-bottom, 0px))"
    aria-live="polite"
    transition:fly={{ y: 12, duration: 220 }}
  >
    <div
      role="status"
      class={cn(
        "pointer-events-auto min-w-60 max-w-[min(92vw,24rem)] overflow-hidden rounded-lg border shadow-lg backdrop-blur",
        toastState.tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        toastState.tone === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
        toastState.tone === "info" && "border-border/70 bg-card/95 text-foreground"
      )}
    >
      <div class="flex max-h-[min(40vh,14rem)] items-start gap-2 overflow-y-auto px-3 py-2.5 text-xs theme-scrollbar">
        <Icon class="mt-0.5 size-3.5 shrink-0" />
        <span class="leading-relaxed break-words">{toastState.message}</span>
      </div>
      <div class="h-1 w-full bg-black/10 dark:bg-white/10">
        {#key toastState.id}
          <div class="toast-progress h-full bg-current opacity-50" style="animation-duration: {toastState.duration}ms"></div>
        {/key}
      </div>
    </div>
  </div>
{/if}

<style>
  .toast-progress {
    animation: toast-drain linear forwards;
  }

  @keyframes toast-drain {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
</style>
