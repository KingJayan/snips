import type { SnippetWithTags } from "#lib/types.ts";

const EXTENSIONS: Record<string, string> = {
  typescript: "ts",
  javascript: "js",
  python: "py",
  rust: "rs",
  go: "go",
  cpp: "cpp",
  c: "c",
  java: "java",
  html: "html",
  css: "css",
  sql: "sql",
  json: "json",
  yaml: "yml",
  markdown: "md",
  plaintext: "txt",
};

const textBlob = (code: string) => URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));

export function viewRaw(code: string) {
  const url = textBlob(code);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function snippetFileName(snippet: Pick<SnippetWithTags, "title" | "language">) {
  const name = snippet.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "snippet";
  return `${name}.${EXTENSIONS[snippet.language] ?? "txt"}`;
}

export function downloadSnippet(snippet: Pick<SnippetWithTags, "title" | "language" | "code">) {
  const url = textBlob(snippet.code);
  const anchor = Object.assign(document.createElement("a"), { href: url, download: snippetFileName(snippet) });
  anchor.click();
  URL.revokeObjectURL(url);
}
