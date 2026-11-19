<script lang="ts">
  import { untrack } from "svelte";
  import type { EditorView } from "@codemirror/view";
  import { codeTheme, DEFAULT_CODE_THEME } from "#lib/code-highlight.ts";
  import { createEditor } from "#lib/editor.ts";
  import { SETTINGS_KEYS, stringSetting } from "#lib/settings.ts";

  type Props = { value: string; language?: string; class?: string; placeholder?: string; readOnly?: boolean };

  let { value = $bindable(), language = "plaintext", class: className, placeholder, readOnly = false }: Props = $props();
  let container: HTMLDivElement;
  let view: EditorView | undefined;
  const themeSetting = stringSetting(SETTINGS_KEYS.codeTheme, DEFAULT_CODE_THEME);

  $effect(() => {
    const options = { language, readOnly, placeholder, theme: codeTheme(themeSetting.value) };
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
