<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import { BufferAttribute, BufferGeometry, Vector3, type Group, type LineBasicMaterial } from "three";

  let { positions, groups }: { positions: [number, number, number][]; groups: (Group | undefined)[] } = $props();

  const THRESHOLD = 11;
  const pairs = $derived(
    positions.flatMap((a, i) => positions.slice(i + 1).flatMap((b, k) => (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < THRESHOLD ? [[i, i + 1 + k]] : [])))
  );
  const geometry = $derived(new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(pairs.length * 6), 3)));
  const a = new Vector3();
  const b = new Vector3();
  let material = $state<LineBasicMaterial>();
  let elapsed = 0;

  const worldPosition = (index: number, target: Vector3) => {
    const group = groups[index];
    return group ? group.getWorldPosition(target) : target.set(...positions[index]);
  };

  useTask((delta) => {
    elapsed += delta;
    const array = geometry.attributes.position.array as Float32Array;
    pairs.forEach(([i, j], k) => {
      worldPosition(i, a).toArray(array, k * 6);
      worldPosition(j, b).toArray(array, k * 6 + 3);
    });
    geometry.attributes.position.needsUpdate = true;
    if (material) material.opacity = 0.13 + Math.sin(elapsed * 0.4) * 0.04;
  });
</script>

<T.LineSegments {geometry}>
  <T.LineBasicMaterial bind:ref={material} color="#6366f1" transparent opacity={0.13} />
</T.LineSegments>
