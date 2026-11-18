<script module lang="ts">
  export type WorkspaceAction = { id: string; label: string; onClick: () => void; disabled?: boolean; destructive?: boolean };
</script>

<script lang="ts">
  import { ChevronRight, Folder, FolderOpen, Globe } from "@lucide/svelte";
  import { innerWidth } from "svelte/reactivity/window";
  import type { Workspace } from "#lib/types.ts";
  import { cn } from "#lib/utils.ts";

  type PanelSize = "tiny" | "small" | "full";
  type Props = {
    workspaces: Workspace[];
    activeId: string | null;
    canSelect: boolean;
    dragging: boolean;
    actions: WorkspaceAction[];
    pinnedTitles: Record<string, string[]>;
    onSelect: (id: string) => void;
    onDrop: (snippetId: string, workspaceId: string) => void;
  };

  let { workspaces, activeId, canSelect, dragging, actions, pinnedTitles, onSelect, onDrop }: Props = $props();

  let chosenSize = $state<PanelSize | null>(null);
  let actionsOpen = $state(false);
  let mobileActionsOpen = $state(false);
  let pinsOpen = $state<Record<string, boolean>>({});
  let dragOver = $state<string | null>(null);

  const autoSize = $derived<PanelSize>((innerWidth.current ?? 1536) < 1280 ? "tiny" : (innerWidth.current ?? 1536) < 1536 ? "small" : "full");
  const size = $derived(chosenSize ?? autoSize);
  const tiny = $derived(size === "tiny");
  const name = (workspace: Workspace) => workspace.name.trim() || "untitled workspace";

  function itemClass(id: string) {
    return id === activeId
      ? "bg-accent/65 text-foreground"
      : dragOver === id
        ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground";
  }

  function dropTarget(node: HTMLElement, id: string) {
    const over = (event: DragEvent) => {
      if (!dragging) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      dragOver = id;
    };
    const leave = () => dragOver === id && (dragOver = null);
    const drop = (event: DragEvent) => {
      event.preventDefault();
      dragOver = null;
      const snippetId = event.dataTransfer?.getData("text/snips-snippet-id") || event.dataTransfer?.getData("text/plain");
      if (snippetId) onDrop(snippetId, id);
    };
    node.addEventListener("dragover", over);
    node.addEventListener("dragleave", leave);
    node.addEventListener("drop", drop);
    return {
      destroy() {
        node.removeEventListener("dragover", over);
        node.removeEventListener("dragleave", leave);
        node.removeEventListener("drop", drop);
      },
    };
  }

  function runAction(action: WorkspaceAction) {
    action.onClick();
    actionsOpen = mobileActionsOpen = false;
  }
</script>

<aside class={cn("fixed left-4 z-40 hidden transition-all duration-200 ease-out lg:block", tiny ? "top-12 bottom-12 w-10" : size === "small" ? "top-10 bottom-10 w-44" : "top-6 bottom-6 w-60")}>
  <div class={cn("flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-[0_14px_32px_-22px_hsl(var(--foreground)/0.4)] backdrop-blur vfx-surface vfx-glass", tiny ? "items-center p-1.5" : "p-2")}>
    <div class={cn("flex shrink-0 pt-1 pb-2", tiny ? "flex-col items-center gap-1" : "items-center justify-between px-2")}>
      <span class="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground vfx-icon-chip" title="workspaces"><Folder class="size-3" /></span>
      {#if tiny}
        <button onclick={() => (chosenSize = "small")} class="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground" title="expand panel" aria-label="expand panel">
          <ChevronRight class="size-3" />
        </button>
      {:else}
        <div class="flex items-center gap-1">
          {#each ["tiny", "small", "full"] as const as option (option)}
            <button
              onclick={() => (chosenSize = option)}
              class={cn("rounded-md px-1.5 py-0.5 text-[10px] tracking-wide uppercase transition-colors", size === option ? "bg-accent/70 text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}
              title="{option} panel"
              aria-label="{option} panel"
            >
              {option[0]}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div class={cn("min-h-0 flex-1 space-y-1 overflow-y-auto theme-scrollbar", !tiny && "pr-1")}>
      {#each workspaces as workspace (workspace.id)}
        {@const Icon = workspace.id === activeId ? FolderOpen : Folder}
        {@const pins = pinnedTitles[workspace.id] ?? []}
        <div class="rounded-lg">
          <button
            use:dropTarget={workspace.id}
            onclick={() => onSelect(workspace.id)}
            disabled={!canSelect}
            title={name(workspace)}
            class={cn("transition-all duration-200 ease-out", tiny ? "grid size-7 shrink-0 place-items-center rounded-lg active:scale-[0.92]" : "group/ws flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm active:scale-[0.99]", itemClass(workspace.id))}
          >
            <Icon class="size-3.5 shrink-0" />
            {#if !tiny}<span class="truncate text-xs animate-subtle-slide-right">{name(workspace)}</span>{/if}
          </button>

          {#if !tiny && pins.length}
            <div class="mt-0.5 pr-1 pl-7">
              <button onclick={() => (pinsOpen[workspace.id] = !pinsOpen[workspace.id])} class="text-[11px] text-muted-foreground hover:text-foreground">
                {pinsOpen[workspace.id] ? "hide pins" : "show pins"}
              </button>
              {#if pinsOpen[workspace.id]}
                <ul class="mt-1 space-y-1">
                  {#each pins as title, index (index)}
                    <li class="truncate text-[11px] text-muted-foreground/95" {title}>{title}</li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class={cn("bg-border/60", tiny ? "my-1.5 h-px w-6" : "my-2 h-px w-full")}></div>

    <a href="/public" class={cn("text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground", tiny ? "grid size-7 place-items-center rounded-lg" : "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs")} title="public snippets">
      <Globe class="size-3.5 shrink-0" />
      {#if !tiny}<span class="animate-subtle-slide-right">public snippets</span>{/if}
    </a>

    {#if !tiny && actions.length}
      <div class="mt-2 w-full">
        <button
          class={cn("flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors", actionsOpen ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}
          onclick={() => (actionsOpen = !actionsOpen)}
          aria-expanded={actionsOpen}
        >
          <span>workspace actions</span>
          <span class="text-base leading-none">{actionsOpen ? "−" : "+"}</span>
        </button>
        {#if actionsOpen}
          <div class="mt-1 w-full rounded-xl border border-border/45 bg-background/45 p-1.5">
            {#each actions as action (action.id)}
              <button
                onclick={() => runAction(action)}
                disabled={action.disabled}
                class={cn("flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs transition-colors", action.destructive ? "text-destructive hover:bg-destructive/10 disabled:text-destructive/45" : "text-foreground/90 hover:bg-accent/55 disabled:text-muted-foreground")}
              >
                {action.label}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</aside>

<aside class="fixed inset-x-3 bottom-4 z-40 lg:hidden">
  <div class="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-border/45 bg-card/80 p-2 shadow-[0_10px_24px_-18px_hsl(var(--foreground)/0.35)] backdrop-blur theme-scrollbar vfx-surface vfx-glass">
    {#each workspaces as workspace (workspace.id)}
      <button
        onclick={() => onSelect(workspace.id)}
        disabled={!canSelect}
        class={cn("shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200", workspace.id === activeId ? "bg-accent/70 text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}
        title={workspace.name}
      >
        {workspace.name}
      </button>
    {/each}

    <a href="/public" class="grid size-7 shrink-0 place-items-center rounded-lg bg-background/45 text-foreground/75 hover:bg-accent/55 hover:text-foreground" title="public snippets"><Globe class="size-4" /></a>

    {#if actions.length}
      <div class="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          class={cn("grid size-7 shrink-0 place-items-center rounded-lg bg-background/45 text-foreground/75 hover:bg-accent/55 hover:text-foreground", mobileActionsOpen && "bg-accent/65 text-foreground")}
          onclick={() => (mobileActionsOpen = !mobileActionsOpen)}
          aria-label="workspace options"
          aria-expanded={mobileActionsOpen}
        >
          <span class="text-sm leading-none font-semibold">⋯</span>
        </button>
        {#if mobileActionsOpen}
          <div class="flex items-center gap-1 rounded-xl border border-border/45 bg-background/45 p-1.5">
            {#each actions as action (action.id)}
              <button onclick={() => runAction(action)} disabled={action.disabled} class={cn("shrink-0 rounded-md px-2.5 py-1 text-xs", action.destructive ? "text-destructive hover:bg-destructive/10 disabled:text-destructive/45" : "text-foreground/90 hover:bg-accent/55 disabled:text-muted-foreground")}>
                {action.label}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</aside>
