import { languageId } from "#lib/constants.ts";
import type { SnippetSummaryWithTags } from "#lib/types.ts";

export type SearchTokens = {
  query: string;
  tag: string | null;
  language: string | null;
  pinnedOnly: boolean;
};

export function parseSearchTokens(input: string): SearchTokens {
  const tokens: SearchTokens = { query: "", tag: null, language: null, pinnedOnly: false };
  const words: string[] = [];

  for (const part of input.trim().split(/\s+/).filter(Boolean)) {
    const lower = part.toLowerCase();
    const [prefix, ...rest] = lower.split(":");
    const value = rest.join(":").trim();

    if (prefix === "tag" && rest.length) {
      if (value) tokens.tag = value;
    } else if ((prefix === "lang" || prefix === "language") && rest.length) {
      if (value) tokens.language = value;
    } else if (lower === "is:pinned" || lower === "pinned:true") {
      tokens.pinnedOnly = true;
    } else {
      words.push(part);
    }
  }

  tokens.query = words.join(" ").toLowerCase();
  return tokens;
}

export function filterSnippets<T extends SnippetSummaryWithTags>(snippets: T[], search: string, activeTag: string | null) {
  const { query, tag, language, pinnedOnly } = parseSearchTokens(search);
  const hasTag = (snippet: T, name: string) => snippet.tags.some((t) => t.name === name);

  return snippets.filter((snippet) => {
    if (pinnedOnly && !snippet.pinned) return false;
    if (tag && !hasTag(snippet, tag)) return false;
    if (language && languageId(snippet.language) !== languageId(language)) return false;
    if (activeTag && !hasTag(snippet, activeTag)) return false;
    if (!query) return true;
    return [snippet.title, snippet.description, snippet.language, ...snippet.tags.map((t) => t.name)]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

export function collectTags(snippets: SnippetSummaryWithTags[]) {
  return [...new Set(snippets.flatMap((s) => s.tags.map((t) => t.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
