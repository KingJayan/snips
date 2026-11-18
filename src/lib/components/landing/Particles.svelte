<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import { BufferAttribute, BufferGeometry, type Points } from "three";

  let { mouse }: { mouse: { x: number; y: number } } = $props();

  const COUNT = 260;
  const positions = new Float32Array(COUNT * 3).map((_, i) => {
    const axis = i % 3;
    const r = Math.random();
    return axis === 0 ? (r - 0.5) * 28 : axis === 1 ? (r - 0.5) * 16 : -r * 30;
  });
  const geometry = new BufferGeometry().setAttribute("position", new BufferAttribute(positions, 3));
  let points = $state<Points>();

  useTask(() => {
    if (!points) return;
    for (let i = 1; i < positions.length; i += 3) positions[i] = positions[i] > 8 ? -8 : positions[i] + 0.0025;
    geometry.attributes.position.needsUpdate = true;
    const mx = mouse.x / window.innerWidth - 0.5;
    const my = mouse.y / window.innerHeight - 0.5;
    points.position.x += (-mx * 1.2 - points.position.x) * 0.018;
    points.position.y += (my * 0.8 - points.position.y) * 0.018;
  });
</script>

<T.Points bind:ref={points} {geometry}>
  <T.PointsMaterial size={0.05} color="#6366f1" transparent opacity={0.55} sizeAttenuation />
</T.Points>
