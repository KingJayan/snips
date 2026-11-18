<script lang="ts">
  import { untrack } from "svelte";
  import type { EditorView } from "@codemirror/view";
  import { createEditor } from "#lib/editor.ts";

  type Props = { value: string; language?: string; class?: string; placeholder?: string; readOnly?: boolean };

  let { value = $bindable(), language = "plaintext", class: className, placeholder, readOnly = false }: Props = $props();
  let container: HTMLDivElement;
  let view: EditorView | undefined;

  $effect(() => {
    const options = { language, readOnly, placeholder };
    view = untrack(() => createEditor(container, { ...options, doc: value, onChange: (next) => (value = next) }));
    return () => view?.destroy();
  });

  $effect(() => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  });
</script>

<div bind:this={container} class={className} data-code-editor="1"></div>
