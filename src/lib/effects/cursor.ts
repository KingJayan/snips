import { createThrottledHandler, detectHardwareProfile, getPerformanceRecommendations } from "#lib/hardware-detection.ts";

function setSheen(host: HTMLElement, event: PointerEvent) {
  const rect = host.getBoundingClientRect();
  host.style.setProperty("--sheen-x", `${event.clientX - rect.left}px`);
  host.style.setProperty("--sheen-y", `${event.clientY - rect.top}px`);
}

function trackCursor() {
  const recommendations = getPerformanceRecommendations(detectHardwareProfile());
  if (recommendations.disableCursorTracking) return () => {};

  const root = document.documentElement;
  const setCursor = (x: number, y: number) => {
    root.style.setProperty("--cursor-x", `${x}px`);
    root.style.setProperty("--cursor-y", `${y}px`);
  };
  setCursor(window.innerWidth * 0.5, window.innerHeight * 0.3);

  let host: HTMLElement | null = null;
  const findHost = (event: PointerEvent) => {
    const found = event.target instanceof Element ? event.target.closest(".vfx-sheen") : null;
    host = found instanceof HTMLElement ? found : null;
    if (host) setSheen(host, event);
  };
  const onMove = (event: PointerEvent) => {
    setCursor(event.clientX, event.clientY);
    if (host) setSheen(host, event);
    else findHost(event);
  };
  const clearHost = () => (host = null);
  const move = recommendations.throttleMouseEvents ? createThrottledHandler(onMove as EventListener, 32) : (onMove as EventListener);

  window.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerover", findHost, true);
  document.addEventListener("pointerleave", clearHost, true);
  return () => {
    window.removeEventListener("pointermove", move);
    document.removeEventListener("pointerover", findHost, true);
    document.removeEventListener("pointerleave", clearHost, true);
  };
}

export function cursorEffects() {
  let stop = trackCursor();
  const restart = () => {
    stop();
    stop = trackCursor();
  };
  window.addEventListener("snips-hardware-preference-changed", restart);
  return () => {
    stop();
    window.removeEventListener("snips-hardware-preference-changed", restart);
  };
}
