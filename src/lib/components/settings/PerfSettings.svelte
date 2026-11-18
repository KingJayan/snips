<script lang="ts">
  import { Check } from "@lucide/svelte";
  import { onMount } from "svelte";
  import {
    applyHardwareOptimizations,
    detectHardwareProfile,
    getPerformanceRecommendations,
    readCustomPerformanceProfile,
    readHardwareMode,
    writeCustomPerformanceProfile,
    writeHardwarePreference,
    type CustomPerformanceProfile,
  } from "#lib/hardware-detection.ts";
  import Select from "../ui/Select.svelte";

  type Mode = ReturnType<typeof readHardwareMode>;

  const MODES: Array<{ value: Mode; label: string; desc: string }> = [
    { value: "auto", label: "auto-detect (recommended)", desc: "automatically optimizes based on your hardware" },
    { value: "low", label: "force low-end optimizations", desc: "disables visual effects like blur, sheen, and cursor tracking" },
    { value: "normal", label: "force normal performance", desc: "enables all visual effects" },
    { value: "custom", label: "custom profile", desc: "use your own hardware/performance profile" },
  ];

  const CUSTOM: Array<[keyof CustomPerformanceProfile, string]> = [
    ["disableCursorTracking", "disable cursor tracking effects"],
    ["disableBackdropFilter", "disable backdrop blur"],
    ["disableShadows", "disable shadow effects"],
    ["disableSheenEffects", "disable sheen effects"],
    ["reduceAnimationDuration", "reduce animation durations"],
    ["throttleMouseEvents", "throttle pointer events"],
  ];

  let mode = $state<Mode>(readHardwareMode());
  let custom = $state(readCustomPerformanceProfile());
  let hardware = $state(detectHardwareProfile());
  const recommended = $derived(getPerformanceRecommendations(hardware));

  onMount(() => {
    const sync = () => {
      mode = readHardwareMode();
      custom = readCustomPerformanceProfile();
      hardware = detectHardwareProfile();
    };
    window.addEventListener("snips-hardware-preference-changed", sync);
    return () => window.removeEventListener("snips-hardware-preference-changed", sync);
  });

  function setMode(next: Mode) {
    writeHardwarePreference(next);
    applyHardwareOptimizations();
  }

  function toggle(key: keyof CustomPerformanceProfile) {
    writeCustomPerformanceProfile({ ...custom, [key]: !custom[key] });
    applyHardwareOptimizations();
  }
</script>

<section class="space-y-2">
  <div class="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
    <p class="mb-2 text-xs font-medium">hardware profile detected</p>
    <div class="space-y-1 text-xs text-muted-foreground">
      <p><span class="text-foreground">cores:</span> {hardware.cores || "unknown"}</p>
      <p><span class="text-foreground">ram:</span> {hardware.ram ? `${hardware.ram}GB` : "unknown"}</p>
      <p><span class="text-foreground">status:</span> {hardware.isLowEnd ? "low-end device" : "high-performance device"}</p>
    </div>
  </div>

  <label class="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2">
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm font-medium">performance mode</span>
      <span class="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">recommended: {hardware.isLowEnd ? "low" : "normal"}</span>
    </div>
    <Select value={mode} options={MODES} class="mt-1" onchange={(e) => setMode(e.currentTarget.value as Mode)} />
    <p class="mt-1 text-xs text-muted-foreground">{MODES.find((m) => m.value === mode)?.desc}</p>
  </label>

  {#if mode === "custom"}
    <div class="space-y-2 rounded-lg border border-border/70 bg-card px-3 py-2">
      <p class="text-sm font-medium">custom hardware/performance profile</p>
      {#each CUSTOM as [key, label] (key)}
        <button onclick={() => toggle(key)} class="flex w-full items-center justify-between rounded-md border border-border/70 px-2 py-1.5 text-left text-xs hover:bg-accent">
          <span class="inline-flex items-center gap-2">
            {label}
            {#if recommended[key]}<span class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">recommended</span>{/if}
          </span>
          {#if custom[key]}<Check class="size-3.5" />{/if}
        </button>
      {/each}
    </div>
  {/if}

  <div class="space-y-1 rounded-lg border border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground">
    <p class="font-medium text-foreground">low-end optimizations disable:</p>
    <ul class="ml-1 list-inside space-y-0.5">
      <li>• backdrop blur effects</li>
      <li>• cursor tracking effects</li>
      <li>• sheen/shine animations</li>
      <li>• shadow effects</li>
      <li>• animation durations halved</li>
    </ul>
  </div>
</section>
