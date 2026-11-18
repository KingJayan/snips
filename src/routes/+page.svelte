<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/env";
  import { goto } from "$app/navigation";
  import FeaturesStrip from "#lib/components/landing/FeaturesStrip.svelte";
  import HeroOverlay from "#lib/components/landing/HeroOverlay.svelte";
  import LandingCta from "#lib/components/landing/LandingCta.svelte";
  import LandingNav from "#lib/components/landing/LandingNav.svelte";
  import { getCurrentUser } from "#lib/supabase.ts";

  onMount(async () => {
    if (await getCurrentUser()) await goto("/snippets", { replaceState: true });
  });
</script>

<main class="min-h-svh bg-background">
  <LandingNav />

  <section class="relative h-svh w-full overflow-hidden">
    <div class="absolute inset-0">
      {#if browser}
        <svelte:boundary>
          {#await import("#lib/components/landing/HeroScene.svelte") then { default: HeroScene }}
            <HeroScene />
          {/await}
          {#snippet failed()}{/snippet}
        </svelte:boundary>
      {/if}
    </div>
    <HeroOverlay />
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-background to-transparent"></div>
  </section>

  <FeaturesStrip />
  <LandingCta />
</main>
