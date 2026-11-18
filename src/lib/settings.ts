import { createSubscriber } from "svelte/reactivity";

export const SETTINGS_KEYS = {
  reducedMotion: "snips.a11y.reduced-motion",
  largerText: "snips.a11y.larger-text",
  strongerFocus: "snips.a11y.stronger-focus",
  aiDefaultMode: "snips.ai.mode",
  aiPanelOpenByDefault: "snips.pref.ai-panel-open",
  compactLayout: "snips.pref.compact-layout",
  showHints: "snips.pref.show-hints",
  wrapCodeLines: "snips.pref.wrap-code-lines",
  vimShortcuts: "snips.pref.vim-shortcuts",
  personalizationPreset: "snips.pref.personalization-preset",
  uiDensity: "snips.pref.ui-density",
  animationLevel: "snips.pref.animation-level",
  codeTheme: "code-theme",
} as const;

export type SettingKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];

export function readBoolSetting(key: string, fallback = false) {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    if (value === null) return fallback;
    return value === "1";
  } catch {
    return fallback;
  }
}

export function writeBoolSetting(key: string, value: boolean) {
  if (typeof window === "undefined") return;

  try {
    if (value) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    return;
  }

  emitSettingsChanged(key, value ? "1" : "0");
}

export function readStringSetting(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;

  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStringSetting(key: string, value: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }

  emitSettingsChanged(key, value);
}

export function applyRootClass(className: string, enabled: boolean) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (enabled) {
    root.classList.add(className);
  } else {
    root.classList.remove(className);
  }
}

export function emitSettingsChanged(key: string, value: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("snips-settings-changed", {
      detail: { key, value },
    })
  );
}

const subscribe = createSubscriber((update) => {
  window.addEventListener("snips-settings-changed", update);
  window.addEventListener("storage", update);
  return () => {
    window.removeEventListener("snips-settings-changed", update);
    window.removeEventListener("storage", update);
  };
});

export function boolSetting(key: string, fallback = false) {
  return {
    get value() {
      subscribe();
      return readBoolSetting(key, fallback);
    },
    set value(next: boolean) {
      writeBoolSetting(key, next);
    },
  };
}

export function stringSetting<T extends string = string>(key: string, fallback: T) {
  return {
    get value() {
      subscribe();
      return readStringSetting(key, fallback) as T;
    },
    set value(next: T) {
      writeStringSetting(key, next);
    },
  };
}

const ROOT_FLAGS: Array<[string, string]> = [
  [SETTINGS_KEYS.reducedMotion, "a11y-reduce-motion"],
  [SETTINGS_KEYS.largerText, "a11y-large-text"],
  [SETTINGS_KEYS.strongerFocus, "a11y-strong-focus"],
  [SETTINGS_KEYS.compactLayout, "pref-compact"],
];

export function syncRootClasses() {
  subscribe();
  for (const [key, className] of ROOT_FLAGS) applyRootClass(className, readBoolSetting(key));
  const animation = readStringSetting(SETTINGS_KEYS.animationLevel, "full");
  applyRootClass("pref-density-compact", readStringSetting(SETTINGS_KEYS.uiDensity) === "compact");
  applyRootClass("pref-anim-reduced", animation === "reduced");
  applyRootClass("pref-anim-minimal", animation === "minimal");
}
