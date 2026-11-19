<script lang="ts">
  import type { Snippet } from "svelte";
  import { X } from "@lucide/svelte";
  import { cn } from "#lib/utils.ts";

  type Props = {
    open: boolean;
    title: string;
    description?: string | Snippet;
    class?: string;
    headerClass?: string;
    canClose?: () => boolean | Promise<boolean>;
    children: Snippet;
  };

  let { open = $bindable(), title, description, class: className, headerClass, canClose = () => true, children }: Props = $props();
  let dialog: HTMLDialogElement;

  const close = async () => (await canClose()) && (open = false);

  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });
</script>

<dialog
  bind:this={dialog}
  class={cn(
    "app-dialog fixed inset-0 m-auto h-fit w-full max-w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg border bg-background p-0 text-foreground shadow-lg outline-none theme-scrollbar sm:max-w-lg",
    className
  )}
  onclose={() => (open = false)}
  oncancel={(event) => {
    event.preventDefault();
    close();
  }}
  onclick={(event) => event.target === dialog && close()}
>
  {#if open}
    <div class="flex min-h-0 flex-col">
      <header class={cn("flex flex-col gap-2 px-6 pt-6 pb-4 text-center sm:text-left", headerClass)}>
        <h2 class="text-lg leading-none font-semibold">{title}</h2>
        {#if typeof description === "string"}
          <p class="text-sm text-muted-foreground">{description}</p>
        {:else if description}
          <p class="text-sm text-muted-foreground">{@render description()}</p>
        {/if}
      </header>
      {@render children()}
    </div>
    <button
      type="button"
      class="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:outline-hidden"
      onclick={close}
    >
      <X class="size-4" />
      <span class="sr-only">close</span>
    </button>
  {/if}
</dialog>
