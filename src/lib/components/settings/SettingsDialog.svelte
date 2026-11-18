<script lang="ts">
  import { APP_VERSION } from "#lib/app-version.ts";
  import { settingsDialog } from "#lib/settings-dialog.svelte.ts";
  import Dialog from "../ui/Dialog.svelte";
  import SettingRow from "./SettingRow.svelte";
  import { SECTIONS } from "./schema";
</script>

<Dialog bind:open={settingsDialog.open} title="settings" class="max-h-[85vh] max-w-lg rounded-2xl border-border/70" headerClass="border-b border-border/70 px-5 py-4">
  <div class="max-h-[65vh] space-y-5 overflow-y-auto p-4 theme-scrollbar">
    {#each SECTIONS as section (section.title)}
      <section class="space-y-2">
        <h3 class="text-xs font-medium text-muted-foreground">{section.title}</h3>
        {#each section.items as item (item.key)}
          <SettingRow {item} />
        {/each}
      </section>
    {/each}
  </div>

  <div class="border-t border-border/70 px-4 py-2">
    <p class="text-xs text-muted-foreground">{APP_VERSION}</p>
  </div>
</Dialog>
