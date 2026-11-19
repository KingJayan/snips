<script lang="ts">
  import { page } from "$app/state";
  import NotFound from "#lib/components/NotFound.svelte";
</script>

<NotFound message={page.status === 404 ? "this page doesn't exist" : (page.error?.message ?? "something went wrong")} />
