import { z } from "zod";
import type { SnippetDraft, SnippetWithTags } from "#lib/types.ts";

const draftSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(120, "title is too long"),
  language: z.string().trim().min(1, "language is required"),
  description: z.string().max(1000, "description is too long"),
  code: z.string().trim().min(1, "code is required"),
  tags: z.array(z.string().trim().min(1).max(30, "tag is too long")).max(30, "too many tags"),
});

export function parseTags(input: string) {
  return [...new Set(input.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

export function toDraft(snippet?: SnippetWithTags | null): SnippetDraft {
  return {
    title: snippet?.title ?? "",
    language: snippet?.language ?? "typescript",
    description: snippet?.description ?? "",
    code: snippet?.code ?? "",
    tags: snippet?.tags.map((tag) => tag.name) ?? [],
  };
}

export function validateDraft(draft: SnippetDraft, tagsInput: string) {
  const parsed = draftSchema.safeParse({ ...draft, tags: parseTags(tagsInput) });
  return parsed.success
    ? { data: { ...draft, ...parsed.data } as SnippetDraft, error: null }
    : { data: null, error: parsed.error.issues[0]?.message ?? "invalid snippet data" };
}
