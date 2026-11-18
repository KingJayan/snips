import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * xss-safe md-to-html renderer
 */
export function renderMarkdown(raw: string): string {
  const codeSpans: string[] = [];
  const escaped = raw
    .replace(/\uE000/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`\n]+)`/g, (_, code: string) => `\uE000${codeSpans.push(code) - 1}\uE000`);

  return escaped
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '<br class="my-2"/>')
    .replace(/\n/g, "<br/>")
    .replace(/\uE000(\d+)\uE000/g, (_, index: string) => `<code class="rounded bg-muted px-1 font-mono text-[0.85em]">${codeSpans[Number(index)]}</code>`);
}

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function ignoresShortcuts(target: EventTarget | null) {
  return target instanceof HTMLElement && (EDITABLE_TAGS.has(target.tagName) || target.isContentEditable || Boolean(target.closest("dialog")));
}
