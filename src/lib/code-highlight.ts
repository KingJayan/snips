import { LANGUAGES } from "#lib/constants.ts";

export const CODE_THEMES = [
  { value: "github-dark", label: "github dark", bg: "#24292e", border: "#444d56", text: "#e1e4e8" },
  { value: "github-light", label: "github light", bg: "#ffffff", border: "#e1e4e8", text: "#24292e" },
  { value: "dracula", label: "dracula", bg: "#282a36", border: "#44475a", text: "#f8f8f2" },
  { value: "nord", label: "nord", bg: "#2e3440", border: "#434c5e", text: "#d8dee9" },
  { value: "monokai", label: "monokai", bg: "#272822", border: "#3e3d32", text: "#f8f8f2" },
  { value: "one-dark-pro", label: "one dark", bg: "#282c34", border: "#3e4452", text: "#abb2bf" },
] as const;

export type CodeTheme = (typeof CODE_THEMES)[number]["value"];

export function codeTheme(value: string) {
  return CODE_THEMES.find((theme) => theme.value === value) ?? CODE_THEMES[0];
}

const cache = new Map<string, string>();
const MAX_ENTRIES = 120;

export function cacheKey(code: string, language: string, theme: string) {
  return `${theme}:${language}:${code}`;
}

export const cachedHighlight = (key: string) => cache.get(key) ?? null;

export async function highlight(code: string, language: string, theme: CodeTheme) {
  const key = cacheKey(code, language, theme);
  const hit = cache.get(key);
  if (hit) return hit;

  const { codeToHtml } = await import("shiki");
  const html = await codeToHtml(code, { lang: LANGUAGES[language]?.shiki ?? "plaintext", theme });
  cache.set(key, html);
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  return html;
}
