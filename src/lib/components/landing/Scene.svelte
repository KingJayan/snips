<script lang="ts">
  import { T, useTask, useThrelte } from "@threlte/core";
  import { Color, type Group, type PerspectiveCamera } from "three";
  import Constellation from "./Constellation.svelte";
  import FloatingSnippet from "./FloatingSnippet.svelte";
  import Particles from "./Particles.svelte";
  import { LANDING_SNIPPETS } from "./snippet-data";

  let { count }: { count: number } = $props();

  const LAYERS = [
    { zMin: -2, zMax: -8, opacity: 0.92, frac: 0.27, xSpread: 22, ySpread: 10, xGap: 5.5 },
    { zMin: -9, zMax: -17, opacity: 0.7, frac: 0.36, xSpread: 22, ySpread: 13, xGap: 0 },
    { zMin: -18, zMax: -26, opacity: 0.32, frac: 0.37, xSpread: 26, ySpread: 15, xGap: 0 },
  ];

  const jitter = (spread: number) => (Math.random() - 0.5) * spread;

  function shuffle<T>(items: T[]) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function generateCards(total: number) {
    const snippets = shuffle([...LANDING_SNIPPETS]);
    return LAYERS.flatMap((layer) => {
      const n = Math.max(1, Math.round(total * layer.frac));
      const cols = Math.ceil(Math.sqrt(n * 1.6));
      const rows = Math.ceil(n / cols);
      const cellW = layer.xSpread / Math.max(cols - 1, 1);
      const cellH = layer.ySpread / Math.max(rows - 1, 1);
      const points: [number, number][] = [];
      for (let r = 0; r < rows && points.length < n; r++) {
        for (let c = 0; c < cols && points.length < n; c++) {
          const x = cols > 1 ? (c / (cols - 1) - 0.5) * layer.xSpread : 0;
          const y = rows > 1 ? (r / (rows - 1) - 0.5) * layer.ySpread : 0;
          if (layer.xGap > 0 && Math.abs(x) < layer.xGap) continue;
          points.push([x + jitter(cellW * 0.65), y + jitter(cellH * 0.65)]);
        }
      }
      return shuffle(points).map(([x, y]) => ({
        position: [x, y, layer.zMin + Math.random() * (layer.zMax - layer.zMin)] as [number, number, number],
        rotation: [jitter(0.3), jitter(0.4), jitter(0.06)] as [number, number, number],
        baseOpacity: layer.opacity,
      }));
    })
      .slice(0, total)
      .map((card, i) => ({ ...card, snippet: snippets[i % snippets.length] }));
  }

  const cards = $derived(generateCards(count));
  const groups = $state<(Group | undefined)[]>([]);
  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const { scene } = useThrelte();
  let camera = $state<PerspectiveCamera>();

  scene.background = new Color("#09090b");

  useTask(() => {
    if (camera) camera.position.z -= 0.0018;
  });
</script>

<svelte:window onmousemove={(e) => Object.assign(mouse, { x: e.clientX, y: e.clientY })} />

<T.PerspectiveCamera makeDefault bind:ref={camera} position={[0, 0, 14]} fov={62} />

{#each cards as card, i (i)}
  <FloatingSnippet {...card} {mouse} bind:group={groups[i]} />
{/each}

<Constellation positions={cards.map((c) => c.position)} {groups} />
<Particles {mouse} />
