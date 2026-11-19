import { CHAT_MODES } from "#lib/ai/chat-types.ts";
import { CODE_THEMES } from "#lib/code-highlight.ts";
import { SETTINGS_KEYS } from "#lib/settings.ts";

type Base = { key: string; label: string; desc?: string };
export type ToggleItem = Base & { kind: "toggle"; fallback?: boolean };
export type SelectItem = Base & { kind: "select"; fallback: string; options: ReadonlyArray<{ value: string; label: string }> };
export type SettingItem = ToggleItem | SelectItem;

export const SECTIONS: Array<{ title: string; items: SettingItem[] }> = [
  {
    title: "appearance",
    items: [
      { kind: "select", key: SETTINGS_KEYS.codeTheme, label: "code theme", fallback: "github-dark", options: CODE_THEMES },
      { kind: "toggle", key: SETTINGS_KEYS.wrapCodeLines, label: "wrap long code lines", desc: "avoid horizontal scroll in code blocks" },
      { kind: "toggle", key: SETTINGS_KEYS.compactLayout, label: "compact layout", desc: "tighter spacing on cards and code" },
    ],
  },
  {
    title: "ai",
    items: [
      { kind: "toggle", key: SETTINGS_KEYS.aiPanelOpenByDefault, label: "open ai panel by default", desc: "on the snippet page" },
      { kind: "select", key: SETTINGS_KEYS.aiDefaultMode, label: "default ai mode", fallback: "improve", options: CHAT_MODES.map((value) => ({ value, label: value })) },
    ],
  },
  {
    title: "keyboard",
    items: [
      { kind: "toggle", key: SETTINGS_KEYS.vimShortcuts, label: "vim shortcuts", desc: "j/k, enter and p in the list; y and p on a snippet" },
      { kind: "toggle", key: SETTINGS_KEYS.showHints, label: "search hints", desc: "show filter examples in the search box", fallback: true },
    ],
  },
  {
    title: "accessibility",
    items: [
      { kind: "toggle", key: SETTINGS_KEYS.reducedMotion, label: "reduce motion", desc: "turn off animations and transitions" },
      { kind: "toggle", key: SETTINGS_KEYS.largerText, label: "larger text" },
      { kind: "toggle", key: SETTINGS_KEYS.strongerFocus, label: "stronger focus outlines" },
    ],
  },
];
