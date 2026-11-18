<script lang="ts">
  import Badge from "./ui/Badge.svelte";

  let { email }: { email: string } = $props();

  const initials = $derived.by(() => {
    const user = email.trim().split("@")[0] ?? "";
    const parts = user.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
    return (parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : user.slice(0, 2)).toUpperCase() || "U";
  });
</script>

<Badge variant="outline" class="h-8 gap-2 rounded-full border-border/70 bg-card px-2 pr-3" aria-label="signed in as {email}" title={email}>
  <span class="grid size-5 place-items-center rounded-full bg-muted text-[10px] font-semibold">{initials}</span>
  <span class="max-w-40 truncate text-xs">{email}</span>
</Badge>
