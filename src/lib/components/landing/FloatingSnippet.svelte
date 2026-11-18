<script lang="ts">
  import { T, useTask, useThrelte } from "@threlte/core";
  import { Float, HTML } from "@threlte/extras";
  import { Vector3, type Group, type PerspectiveCamera } from "three";
  import type { LandingSnippet } from "./snippet-data";

  type Props = {
    snippet: LandingSnippet;
    position: [number, number, number];
    rotation: [number, number, number];
    baseOpacity: number;
    mouse: { x: number; y: number };
    group?: Group;
  };

  let { snippet, position, rotation, baseOpacity, mouse, group = $bindable() }: Props = $props();

  const COLORS: Record<string, string> = { typescript: "#3b82f6", python: "#facc15", rust: "#fb923c", sql: "#a78bfa", bash: "#4ade80" };
  const REPEL_RADIUS = 0.52;
  const REPEL_MAX_NDC = 0.09;
  const { camera } = useThrelte();
  const projected = new Vector3();
  const badge = $derived(COLORS[snippet.lang] ?? "#71717a");

  let expanded = $state(false);
  let card = $state<HTMLButtonElement>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  useTask(() => {
    const cam = camera.current as PerspectiveCamera;
    if (!group) return;

    let x = position[0];
    let y = position[1];
    if (!expanded) {
      projected.set(...position).project(cam);
      const dx = projected.x - ((mouse.x / window.innerWidth) * 2 - 1);
      const dy = projected.y + ((mouse.y / window.innerHeight) * 2 - 1);
      const dist = Math.hypot(dx, dy);
      const push = (Math.max(0, 1 - dist / REPEL_RADIUS) * REPEL_MAX_NDC) / Math.max(dist, 0.001);
      const halfH = Math.tan((cam.fov * Math.PI) / 360) * Math.abs(position[2] - cam.position.z);
      x += dx * push * halfH * cam.aspect;
      y += dy * push * halfH;
    }

    group.position.x += (x - group.position.x) * 0.06;
    group.position.y += (y - group.position.y) * 0.06;
    group.scale.setScalar(group.scale.x + ((expanded ? 1.65 : 1) - group.scale.x) * 0.1);

    if (card) {
      const depth = Math.abs(position[2] - cam.position.z);
      card.style.opacity = String(Math.min(baseOpacity, Math.max(0.15, 1 - Math.max(0, depth - 16) * 0.05)));
    }
  });

  function toggle() {
    expanded = !expanded;
    clearTimeout(timer);
    if (expanded) timer = setTimeout(() => (expanded = false), 4000);
  }
</script>

<Float speed={0.45} rotationIntensity={0.05} floatIntensity={0.12}>
  <T.Group bind:ref={group} {position} {rotation}>
    <HTML transform scale={0.38} pointerEvents="none" zIndexRange={[4, 0]}>
      <button
        bind:this={card}
        class="landing-3d-card pointer-events-auto cursor-pointer text-left transition-shadow"
        style:opacity={baseOpacity}
        style:box-shadow={expanded ? "0 0 32px 4px #6366f155, 0 2px 24px #0008" : undefined}
        onclick={toggle}
      >
        <div class="l3c-header">
          <span class="l3c-title">{snippet.title}</span>
          <span class="l3c-badge" style:color={badge} style:border-color="{badge}55" style:background-color="{badge}14">{snippet.lang}</span>
        </div>
        <div class="l3c-code">{@html snippet.html}</div>
      </button>
    </HTML>
  </T.Group>
</Float>
