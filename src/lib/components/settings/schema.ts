import { CHAT_MODES } from "#lib/ai/chat-config.ts";
import { CODE_THEMES } from "#lib/code-highlight.ts";
import { SETTINGS_KEYS } from "#lib/settings.ts";

export type SettingsGroup = "personalization" | "ai" | "preferences" | "performance" | "accessibility";

type Base = { key: string; label: string; desc?: string; terms: string[]; preset?: boolean };
export type ToggleItem = Base & { kind: "toggle"; fallback?: boolean };
export type SelectItem = Base & { kind: "select"; fallback: string; options: ReadonlyArray<{ value: string; label: string }> };
export type SettingItem = ToggleItem | SelectItem;

const opts = (...values: string[]) => values.map((value) => ({ value, label: value }));

const aiPanel = (desc: string): ToggleItem => ({ kind: "toggle", key: SETTINGS_KEYS.aiPanelOpenByDefault, label: "open ai panel by default", desc, fallback: true, preset: true, terms: ["ai panel", "layout", "default"] });
const vim = (label: string, desc?: string): ToggleItem => ({ kind: "toggle", key: SETTINGS_KEYS.vimShortcuts, label, desc, preset: true, terms: ["vim", "shortcuts", "workflow"] });
const hints = (label: string, desc?: string): ToggleItem => ({ kind: "toggle", key: SETTINGS_KEYS.showHints, label, desc, fallback: true, preset: true, terms: ["hints", "productivity", "labels"] });

export const PRESETS: Record<string, Record<string, string | boolean>> = {
  balanced: { [SETTINGS_KEYS.uiDensity]: "comfortable", [SETTINGS_KEYS.animationLevel]: "full", [SETTINGS_KEYS.showHints]: true, [SETTINGS_KEYS.aiPanelOpenByDefault]: true, [SETTINGS_KEYS.vimShortcuts]: false, [SETTINGS_KEYS.compactLayout]: false },
  focused: { [SETTINGS_KEYS.uiDensity]: "compact", [SETTINGS_KEYS.animationLevel]: "reduced", [SETTINGS_KEYS.showHints]: false, [SETTINGS_KEYS.aiPanelOpenByDefault]: false, [SETTINGS_KEYS.vimShortcuts]: true, [SETTINGS_KEYS.compactLayout]: true },
};
PRESETS.expressive = PRESETS.balanced;

export const GROUPS: Record<Exclude<SettingsGroup, "performance">, SettingItem[]> = {
  personalization: [
    { kind: "select", key: SETTINGS_KEYS.personalizationPreset, label: "personalization preset", desc: "practical presets for look + workflow defaults.", fallback: "balanced", options: opts("balanced", "focused", "expressive", "custom"), terms: ["preset", "personalization", "focused", "balanced", "expressive"] },
    { kind: "select", key: SETTINGS_KEYS.uiDensity, label: "ui density", fallback: "comfortable", options: opts("comfortable", "compact"), preset: true, terms: ["density", "spacing", "compact", "comfortable"] },
    { kind: "select", key: SETTINGS_KEYS.animationLevel, label: "animation level", fallback: "full", options: opts("full", "reduced", "minimal"), preset: true, terms: ["animation", "motion", "speed"] },
    aiPanel("layout default on snippet detail page"),
    vim("vim shortcuts"),
    hints("show hints"),
  ],
  ai: [
    { kind: "toggle", key: SETTINGS_KEYS.aiSimilaritySearch, label: "ai similarity search", desc: "find related snippets by code intent (default off)", terms: ["similarity", "ai", "related", "search"] },
    aiPanel("controls default state on snippet detail page"),
    { kind: "select", key: SETTINGS_KEYS.aiDefaultMode, label: "default ai mode", fallback: "improve", options: opts(...CHAT_MODES), terms: ["mode", "default ai mode", ...CHAT_MODES] },
  ],
  preferences: [
    { kind: "toggle", key: SETTINGS_KEYS.compactLayout, label: "compact layout", desc: "reduce spacing for denser information display", preset: true, terms: ["compact", "density", "layout"] },
    hints("show productivity hints", "toggle keyboard and power-search hint labels"),
    { kind: "toggle", key: SETTINGS_KEYS.wrapCodeLines, label: "wrap long code lines", desc: "avoid horizontal scroll in code blocks", terms: ["wrap", "code", "line"] },
    vim("vim-style keyboard shortcuts", "enable vim list navigation and y/p snippet keys"),
    { kind: "select", key: SETTINGS_KEYS.codeTheme, label: "default code theme", fallback: "github-dark", options: CODE_THEMES, terms: ["theme", "code", "appearance"] },
  ],
  accessibility: [
    { kind: "toggle", key: SETTINGS_KEYS.reducedMotion, label: "reduced ui motion", desc: "reduce animations and transitions globally", terms: ["motion", "reduce", "animation"] },
    { kind: "toggle", key: SETTINGS_KEYS.largerText, label: "larger text", desc: "increase base text size for readability", terms: ["text", "readability", "larger"] },
    { kind: "toggle", key: SETTINGS_KEYS.strongerFocus, label: "stronger focus outlines", desc: "make keyboard focus states more visible", terms: ["focus", "keyboard", "outline"] },
  ],
};

export const LABELS: Record<string, string> = Object.fromEntries(
  Object.values(GROUPS).flatMap((items) => items.map((item) => [item.key, item.label]))
);
