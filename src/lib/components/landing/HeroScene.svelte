<script lang="ts">
  import { Canvas } from "@threlte/core";
  import Scene from "./Scene.svelte";

  const lowEnd = window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;
</script>

<Canvas dpr={Math.min(window.devicePixelRatio, 1.5)}>
  <Scene count={lowEnd ? 10 : 22} />
</Canvas>
