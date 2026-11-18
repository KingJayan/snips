<script lang="ts">
  import { Bot, KeyRound, LoaderCircle, PanelRightClose, Send, Sparkles, Wand } from "@lucide/svelte";
  import { CHAT_MODES, PROVIDERS, postChat, providerById, readChatConfig, writeChatConfig, type ProviderId } from "#lib/ai/chat-config.ts";
  import { PUTER_AUTH_ERROR, puterChat } from "#lib/ai/puter.ts";
  import type { SnippetWithTags } from "#lib/types.ts";
  import Button from "./ui/Button.svelte";
  import Input from "./ui/Input.svelte";
  import Select from "./ui/Select.svelte";
  import Textarea from "./ui/Textarea.svelte";
  import ErrorNote from "./ErrorNote.svelte";

  type Message = { role: "user" | "assistant"; content: string };
  type Props = { snippet: SnippetWithTags; onApplyCode: (code: string) => void; onMinimize: () => void };

  let { snippet, onApplyCode, onMinimize }: Props = $props();

  const CUSTOM = "__custom_model__";
  const MAX_MESSAGES = 24;
  const initial = readChatConfig();
  const config = $state(initial);
  const provider = $derived(providerById(config.provider));
  let modelChoice = $state(providerById(initial.provider).models.includes(initial.model) ? initial.model : CUSTOM);
  let prompt = $state("");
  let messages = $state<Message[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let puterBlocked = $state(false);

  const suggestedCode = $derived(
    messages.findLast((m) => m.role === "assistant")?.content.match(/```[\w-]*\n([\s\S]*?)```/)?.[1]?.trim() ?? null
  );

  $effect(() => writeChatConfig({ ...config }));

  function selectProvider(id: ProviderId) {
    config.provider = id;
    const models = providerById(id).models;
    if (!models.includes(config.model)) config.model = models[0];
    modelChoice = config.model;
  }

  function selectModel(value: string) {
    modelChoice = value;
    if (value !== CUSTOM) config.model = value;
    else if (provider.models.includes(config.model)) config.model = "";
  }

  async function send() {
    const text = prompt.trim();
    if (!text || loading) return;
    if (provider.requiresApiKey && !config.apiKey.trim()) return (error = "api key is required for this provider");
    if (!config.model.trim()) return (error = "model is required");
    if (config.provider === "puterjs" && puterBlocked) return (error = PUTER_AUTH_ERROR);

    const history = [...messages, { role: "user" as const, content: text }].slice(-MAX_MESSAGES);
    messages = history;
    prompt = "";
    error = null;
    loading = true;

    try {
      const reply =
        config.provider === "puterjs"
          ? await puterChat({ messages: history, snippet, mode: config.mode, model: config.model })
          : await postChat($state.snapshot(config), history, snippet);
      messages = [...history, { role: "assistant" as const, content: reply }].slice(-MAX_MESSAGES);
    } catch (requestError) {
      error = requestError instanceof Error ? requestError.message : "chat request failed";
      puterBlocked = error === PUTER_AUTH_ERROR;
      messages = history.slice(0, -1);
    } finally {
      loading = false;
    }
  }
</script>

<aside class="flex h-full min-h-[520px] flex-col rounded-2xl border border-border/70 bg-card/70 animate-subtle-pop-in">
  <header class="border-b border-border/70 p-3">
    <div class="flex items-center justify-between gap-2">
      <h2 class="flex items-center gap-2 text-sm font-semibold tracking-tight"><Bot class="size-4" /> ai edits</h2>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="xs" onclick={() => ((messages = []), (error = null))}>clear</Button>
        <Button variant="ghost" size="icon-sm" onclick={onMinimize} aria-label="minimize ai chat" title="minimize ai chat">
          <PanelRightClose class="size-4" />
        </Button>
      </div>
    </div>
    <p class="mt-1 text-xs text-muted-foreground">{provider.description}</p>
  </header>

  <div class="space-y-2 border-b border-border/70 p-3">
    <label class="flex flex-col gap-1">
      <span class="text-xs text-muted-foreground">provider</span>
      <Select value={config.provider} options={PROVIDERS.map((p) => ({ value: p.id, label: p.label }))} onchange={(e) => selectProvider(e.currentTarget.value as ProviderId)} />
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-xs text-muted-foreground">model</span>
      <Select value={modelChoice} options={[...provider.models.map((m) => ({ value: m, label: m })), { value: CUSTOM, label: "custom model..." }]} onchange={(e) => selectModel(e.currentTarget.value)} />
      {#if modelChoice === CUSTOM}
        <Input bind:value={config.model} placeholder={provider.models[0]} class="h-8 text-xs" />
      {/if}
    </label>

    <label class="flex flex-col gap-1">
      <span class="text-xs text-muted-foreground">mode</span>
      <Select bind:value={config.mode} options={CHAT_MODES.map((m) => ({ value: m, label: m }))} />
    </label>

    {#if config.provider === "puterjs"}
      <p class="rounded-md border border-border/70 bg-background/60 px-2 py-1 text-xs text-muted-foreground">
        puterjs needs a valid puter session; unauthorized browser calls can appear as 401 in devtools.
      </p>
    {/if}

    {#if provider.requiresApiKey}
      <label class="flex flex-col gap-1">
        <span class="flex items-center gap-1 text-xs text-muted-foreground"><KeyRound class="size-3" /> api key (tab session only)</span>
        <Input type="password" bind:value={config.apiKey} placeholder="paste your api key" class="h-8 text-xs" />
      </label>
    {/if}

    {#if provider.supportsBaseUrl}
      <label class="flex flex-col gap-1">
        <span class="text-xs text-muted-foreground">base url</span>
        <Input bind:value={config.baseUrl} placeholder="https://your-host/v1" class="h-8 text-xs" />
      </label>
    {/if}
  </div>

  <div class="flex-1 space-y-2 overflow-y-auto p-3">
    {#each messages as message, index (index)}
      {@const Icon = message.role === "assistant" ? Sparkles : Wand}
      <article class="rounded-lg border px-3 py-2 text-xs leading-relaxed animate-subtle-fade-up {message.role === 'assistant' ? 'border-border/70 bg-background' : 'border-primary/20 bg-primary/5'}">
        <p class="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Icon class="size-3" /> {message.role}</p>
        <pre class="font-sans whitespace-pre-wrap">{message.content}</pre>
      </article>
    {:else}
      <div class="rounded-lg border border-dashed border-border/70 bg-background/40 p-3 text-xs text-muted-foreground">{provider.requiresApiKey && !config.apiKey.trim() ? "add an api key above to start." : "ask for refactors, bug fixes, tests, or performance edits."}</div>
    {/each}
  </div>

  <footer class="space-y-2 border-t border-border/70 p-3">
    <Textarea
      bind:value={prompt}
      placeholder="ask for a code improvement..."
      class="min-h-20 font-mono text-xs"
      onkeydown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          send();
        }
      }}
    />
    <ErrorNote message={error} class="px-2 py-1 text-xs" />
    <div class="flex items-center gap-2">
      <Button size="sm" class="flex-1" onclick={send} disabled={loading}>
        {#if loading}<LoaderCircle class="size-4 animate-spin" /> thinking...{:else}<Send class="size-4" /> send{/if}
      </Button>
      <Button variant="outline" size="sm" onclick={() => suggestedCode && onApplyCode(suggestedCode)} disabled={!suggestedCode}>apply</Button>
    </div>
    <p class="text-xs text-muted-foreground">cmd/ctrl+enter to send</p>
  </footer>
</aside>
