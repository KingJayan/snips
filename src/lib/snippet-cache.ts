import type { SnippetSummaryWithTags, SnippetWithTags } from "#lib/types.ts";

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

const listKey = (workspaceId: string | null) => `snips.list.cache.v1:${workspaceId ?? "none"}`;
const detailKey = (id: string) => `snips.detail.cache.${id}`;

export function readCachedList(workspaceId: string | null) {
  const list = read<SnippetSummaryWithTags[]>(listKey(workspaceId));
  return Array.isArray(list) ? list : [];
}

export const writeCachedList = (workspaceId: string | null, list: SnippetSummaryWithTags[]) => write(listKey(workspaceId), list);

export const readCachedSnippet = (id: string) => read<SnippetWithTags>(detailKey(id));

export const writeCachedSnippet = (snippet: SnippetWithTags) => write(detailKey(snippet.id), snippet);
