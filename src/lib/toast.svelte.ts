export type ToastTone = "success" | "error" | "info";

export const toastState = $state({ message: null as string | null, tone: "info" as ToastTone, duration: 1800, id: 0 });

let timer: ReturnType<typeof setTimeout> | undefined;

export function toast(message: string, tone: ToastTone = "info", duration = 1800) {
  clearTimeout(timer);
  Object.assign(toastState, { message, tone, duration, id: toastState.id + 1 });
  timer = setTimeout(() => (toastState.message = null), duration);
}
