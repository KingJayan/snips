import { onMount } from "svelte";
import { beforeNavigate, goto } from "$app/navigation";

type Pending = { message: string; action: string; resolve: (ok: boolean) => void };

export const confirmState = $state<{ pending: Pending | null }>({ pending: null });

export function ask(message: string, action = "confirm") {
  confirmState.pending?.resolve(false);
  return new Promise<boolean>((resolve) => (confirmState.pending = { message, action, resolve }));
}

export function answer(ok: boolean) {
  const pending = confirmState.pending;
  confirmState.pending = null;
  pending?.resolve(ok);
}

export function confirmLeave(dirty: () => boolean) {
  let leaving = false;

  beforeNavigate((navigation) => {
    const to = navigation.to?.url;
    if (leaving || !to || navigation.type === "leave" || !dirty()) return;
    navigation.cancel();
    void ask("you have unsaved changes. leave anyway?", "leave").then(async (ok) => {
      if (!ok) return;
      leaving = true;
      await goto(to);
      leaving = false;
    });
  });

  onMount(() => {
    const warn = (event: BeforeUnloadEvent) => dirty() && event.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  });
}
