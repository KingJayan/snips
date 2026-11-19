import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { cpp } from "@codemirror/lang-cpp";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { yaml } from "@codemirror/lang-yaml";
import { bracketMatching, defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { EditorState, type Extension } from "@codemirror/state";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import type { CodeThemeOption } from "#lib/code-highlight.ts";
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  rectangularSelection,
} from "@codemirror/view";

const LANGUAGE_EXTENSIONS: Record<string, () => Extension> = {
  typescript: () => javascript({ typescript: true }),
  javascript: () => javascript(),
  python,
  rust,
  java,
  cpp,
  c: cpp,
  html,
  css,
  sql,
  json,
  yaml,
  markdown,
  md: markdown,
};

const appTheme = ({ bg, border, text, dark }: CodeThemeOption) =>
  EditorView.theme(
    {
      "&": { fontSize: "12px", fontFamily: "var(--font-jetbrains-mono, monospace)", height: "100%", backgroundColor: bg, color: text },
      ".cm-scroller": { fontFamily: "var(--font-jetbrains-mono, monospace)", lineHeight: "1.65", overflow: "auto" },
      "&.cm-editor": { borderRadius: "inherit", height: "100%" },
      "&.cm-editor.cm-focused": { outline: "none" },
      ".cm-gutters": { backgroundColor: "transparent", borderRight: `1px solid ${border}`, color: `color-mix(in srgb, ${text} 35%, transparent)`, minWidth: "2.8em" },
      ".cm-activeLineGutter": { backgroundColor: "transparent", color: text },
      ".cm-lineNumbers": { minWidth: "2.8em" },
      ".cm-foldGutter": { minWidth: "1em" },
      ".cm-foldGutter .cm-gutterElement": { padding: "0 2px" },
      ".cm-content": { padding: "8px 4px", caretColor: text },
      ".cm-activeLine": { backgroundColor: `color-mix(in srgb, ${text} 5%, transparent)`, borderRadius: "2px" },
      ".cm-selectionBackground, .cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "rgba(99,102,241,0.25) !important" },
      ".cm-cursor": { borderLeftColor: text, borderLeftWidth: "2px" },
      ".cm-matchingBracket": { backgroundColor: "rgba(99,102,241,0.2)", outline: "1px solid rgba(99,102,241,0.4)", borderRadius: "2px" },
      ".cm-tooltip": { border: `1px solid ${border}`, borderRadius: "6px", backgroundColor: bg, color: text, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" },
      ".cm-tooltip-autocomplete": {
        "& > ul > li": { padding: "3px 10px", fontSize: "11px", lineHeight: "1.5", fontFamily: "var(--font-jetbrains-mono, monospace)" },
        "& > ul > li[aria-selected]": { backgroundColor: "rgba(99,102,241,0.25)", color: text },
      },
      ".cm-completionIcon": { opacity: "0.6" },
    },
    { dark }
  );

type EditorOptions = {
  doc: string;
  language: string;
  readOnly: boolean;
  placeholder?: string;
  theme: CodeThemeOption;
  onChange: (value: string) => void;
};

export function createEditor(parent: HTMLElement, { doc, language, readOnly, placeholder, theme, onChange }: EditorOptions) {
  return new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        appTheme(theme),
        theme.dark ? syntaxHighlighting(oneDarkHighlightStyle) : [],
        history(),
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        crosshairCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        lineNumbers(),
        foldGutter(),
        autocompletion(),
        LANGUAGE_EXTENSIONS[language]?.() ?? [],
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...foldKeymap, ...completionKeymap, indentWithTab]),
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !readOnly) onChange(update.state.doc.toString());
        }),
        placeholder ? EditorView.contentAttributes.of({ "aria-placeholder": placeholder }) : [],
      ],
    }),
  });
}
