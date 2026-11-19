import type { PostgrestError } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "#lib/supabase.ts";
import type {
  ServiceResult,
  SnippetDraft,
  SnippetSummaryWithTags,
  SnippetWithTags,
  Tag,
  Workspace,
} from "#lib/types.ts";

type TagLinks = {
  snippet_tags?: Array<{
    tags: Tag | Tag[] | null;
  }>;
};

const MAX_LIST_ITEMS = 200;
const SUMMARY_COLUMNS =
  "id, user_id, workspace_id, title, language, description, pinned, public, view_count, copy_count, created_at, updated_at, snippet_tags(tags(id, name))";
const SNIPPET_COLUMNS =
  "id, user_id, workspace_id, title, language, description, code, pinned, public, view_count, copy_count, created_at, updated_at, snippet_tags(tags(id, name))";
const WORKSPACE_COLUMNS = "id, owner_id, name, is_public, created_at, updated_at";
const NOT_FOUND = "snippet not found";

type ListSnippetsOptions = {
  signal?: AbortSignal;
  limit?: number;
  workspaceId?: string;
};

type GetSnippetOptions = {
  signal?: AbortSignal;
};

type SnippetTable = "snippets" | "public_snippets";

function withError<T>(error: unknown): ServiceResult<T> {
  if (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && /abort|aborted/i.test(error.message))
  ) {
    return { data: null, error: null };
  }

  let message =
    error instanceof Error
      ? error.message
      : "something went wrong. please try again.";

  if (/auth session missing|\bjwt\b|refresh token/i.test(message)) {
    message = "please sign in to continue";
  }

  return { data: null, error: message };
}

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "supabase is not configured. add PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env"
    );
  }

  return supabase;
}

async function requireUserId(client: NonNullable<typeof supabase>) {
  const { data } = await client.auth.getSession();
  const userId = data.session?.user.id;

  if (!userId) {
    throw new Error("you must sign in to manage snippets");
  }

  return userId;
}

function normalizeWorkspaceName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export async function listWorkspaces(): Promise<ServiceResult<Workspace[]>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { data, error } = await client
      .from("workspaces")
      .select(WORKSPACE_COLUMNS)
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to fetch workspaces");
    }

    return {
      data: data as Workspace[],
      error: null,
    };
  } catch (error) {
    return withError<Workspace[]>(error);
  }
}

export async function createWorkspace(name: string): Promise<ServiceResult<Workspace>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);
    const normalizedName = normalizeWorkspaceName(name);

    if (!normalizedName) {
      throw new Error("workspace name is required");
    }

    const { data, error } = await client
      .from("workspaces")
      .insert({ owner_id: userId, name: normalizedName })
      .select(WORKSPACE_COLUMNS)
      .single();

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to create workspace");
    }

    return { data: data as Workspace, error: null };
  } catch (error) {
    return withError<Workspace>(error);
  }
}

export async function renameWorkspace(
  id: string,
  name: string
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    await requireUserId(client);
    const normalizedName = normalizeWorkspaceName(name);

    if (!normalizedName) {
      throw new Error("workspace name is required");
    }

    const { error } = await client
      .from("workspaces")
      .update({ name: normalizedName })
      .eq("id", id);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to rename workspace");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function toggleWorkspacePublic(
  id: string,
  isPublic: boolean
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    await requireUserId(client);

    const { error } = await client
      .from("workspaces")
      .update({ is_public: isPublic })
      .eq("id", id);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to update workspace sharing");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function deleteWorkspace(id: string): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    await requireUserId(client);

    const { error } = await client
      .from("workspaces")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to delete workspace");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

function normalizeSnippet<T extends TagLinks>({ snippet_tags, ...row }: T) {
  const tags =
    snippet_tags
      ?.flatMap((item) => (Array.isArray(item.tags) ? item.tags : item.tags ? [item.tags] : []))
      .filter((tag): tag is Tag => Boolean(tag?.id && tag?.name)) ?? [];

  return { ...row, tags };
}

function parseSupabaseError(error: PostgrestError | null) {
  if (!error) return null;

  if (error.code === "PGRST116" || error.code === "22P02") return NOT_FOUND;
  if (error.code === "23505") return "that name is already taken";

  const message = `${error.message} ${error.details ?? ""} ${error.hint ?? ""}`;

  if (
    message.includes("Could not find the table 'public.snippets'") ||
    message.includes("relation \"public.snippets\" does not exist")
  ) {
    return "table public.snippets is missing in supabase. run supabase/schema.sql in the sql editor, then refresh api schema cache in project settings > api.";
  }

  if (
    message.includes("Could not find the table 'public.tags'") ||
    message.includes("Could not find the table 'public.snippet_tags'") ||
    message.includes("relation \"public.tags\" does not exist") ||
    message.includes("relation \"public.snippet_tags\" does not exist")
  ) {
    return "snippet tables are incomplete in supabase. run supabase/schema.sql and refresh api schema cache.";
  }

  if (message.includes("row-level security")) {
    return "permission denied by rls policy. ensure you are signed in and policies are applied.";
  }

  return error.message;
}

export async function listSnippets(
  options?: ListSnippetsOptions
): Promise<ServiceResult<SnippetSummaryWithTags[]>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    let query = client
      .from("snippets")
      .select(SUMMARY_COLUMNS)
      .eq("user_id", userId)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(listLimit(options));

    if (options?.workspaceId) {
      query = query.eq("workspace_id", options.workspaceId);
    }

    if (options?.signal) {
      query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to fetch snippets");
    }

    return { data: data.map(normalizeSnippet) as SnippetSummaryWithTags[], error: null };
  } catch (error) {
    return withError<SnippetSummaryWithTags[]>(error);
  }
}

function listLimit(options?: ListSnippetsOptions) {
  return typeof options?.limit === "number" && options.limit > 0
    ? Math.min(options.limit, MAX_LIST_ITEMS)
    : MAX_LIST_ITEMS;
}

async function fetchSnippet(id: string, options?: GetSnippetOptions & { table?: SnippetTable }) {
  const client = requireClient();
  let query = client.from(options?.table ?? "snippets").select(SNIPPET_COLUMNS).eq("id", id);

  if (options?.signal) {
    query = query.abortSignal(options.signal);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(parseSupabaseError(error) ?? "failed to fetch snippet");
  }

  if (!data) {
    throw new Error(NOT_FOUND);
  }

  return normalizeSnippet(data) as SnippetWithTags;
}

export async function getSnippetById(
  id: string,
  options?: GetSnippetOptions
): Promise<ServiceResult<SnippetWithTags>> {
  try {
    return { data: await fetchSnippet(id, options), error: null };
  } catch (error) {
    return withError<SnippetWithTags>(error);
  }
}

async function saveSnippet(id: string | null, draft: SnippetDraft) {
  const client = requireClient();
  await requireUserId(client);

  if (!id && !draft.workspace_id) {
    throw new Error("workspace is required");
  }

  const { data, error } = await client.rpc("save_snippet", {
    p_id: id,
    p_workspace_id: draft.workspace_id ?? null,
    p_title: draft.title.trim(),
    p_language: draft.language,
    p_description: draft.description.trim(),
    p_code: draft.code,
    p_tags: draft.tags,
  });

  if (error) {
    throw new Error(parseSupabaseError(error) ?? "failed to save snippet");
  }

  return fetchSnippet(data as string);
}

export async function createSnippet(
  draft: SnippetDraft
): Promise<ServiceResult<SnippetWithTags>> {
  try {
    return { data: await saveSnippet(null, draft), error: null };
  } catch (error) {
    return withError<SnippetWithTags>(error);
  }
}

export async function updateSnippet(
  id: string,
  draft: SnippetDraft
): Promise<ServiceResult<SnippetWithTags>> {
  try {
    return { data: await saveSnippet(id, draft), error: null };
  } catch (error) {
    return withError<SnippetWithTags>(error);
  }
}

export async function deleteSnippet(id: string): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { error } = await client
      .from("snippets")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to delete snippet");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function togglePinSnippet(
  id: string,
  pinned: boolean
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { error } = await client
      .from("snippets")
      .update({ pinned })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to pin snippet");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function moveSnippetToWorkspace(
  id: string,
  workspaceId: string
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { error } = await client
      .from("snippets")
      .update({ workspace_id: workspaceId })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to move snippet");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function togglePublicSnippet(
  id: string,
  isPublic: boolean
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    const userId = await requireUserId(client);

    const { error } = await client
      .from("snippets")
      .update({ public: isPublic })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to update public status");
    }

    return { data: true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}

export async function listPublicSnippets(
  options?: ListSnippetsOptions
): Promise<ServiceResult<SnippetSummaryWithTags[]>> {
  try {
    const client = requireClient();

    let query = client
      .from("public_snippets")
      .select(SUMMARY_COLUMNS)
      .order("updated_at", { ascending: false })
      .limit(listLimit(options));

    if (options?.workspaceId) {
      query = query.eq("workspace_id", options.workspaceId);
    }

    if (options?.signal) {
      query = query.abortSignal(options.signal);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(parseSupabaseError(error) ?? "failed to fetch public snippets");
    }

    return { data: data.map(normalizeSnippet) as SnippetSummaryWithTags[], error: null };
  } catch (error) {
    return withError<SnippetSummaryWithTags[]>(error);
  }
}

export async function getPublicSnippetById(
  id: string
): Promise<ServiceResult<SnippetWithTags>> {
  try {
    return { data: await fetchSnippet(id, { table: "public_snippets" }), error: null };
  } catch (error) {
    return withError<SnippetWithTags>(error);
  }
}

export async function getPublicWorkspaceName(id: string): Promise<ServiceResult<string>> {
  try {
    const { data, error } = await requireClient().from("workspaces").select("name").eq("id", id).eq("is_public", true).maybeSingle();
    if (error) throw new Error(parseSupabaseError(error) ?? "failed to fetch workspace");
    if (!data) throw new Error("workspace not found or not public");
    return { data: data.name as string, error: null };
  } catch (error) {
    return withError<string>(error);
  }
}

export async function incrementSnippetCounter(
  id: string,
  kind: "view" | "copy"
): Promise<ServiceResult<boolean>> {
  try {
    const client = requireClient();
    const { data: auth } = await client.auth.getSession();
    if (!auth.session) return { data: false, error: null };

    const { data, error } = await client.rpc("increment_snippet_counter", {
      p_snippet_id: id,
      p_kind: kind,
    });

    if (error) {
      throw new Error(parseSupabaseError(error) ?? `failed to update ${kind} count`);
    }

    return { data: data === true, error: null };
  } catch (error) {
    return withError<boolean>(error);
  }
}
