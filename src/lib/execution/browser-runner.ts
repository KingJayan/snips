export const RUN_TIMEOUT_MS = 10_000;

export type RunResult = {
  stdout: string;
  stderr: string;
  runtimeMs: number;
};

let worker: Promise<Worker> | null = null;

function spawn() {
  return new Promise<Worker>((resolve, reject) => {
    const next = new Worker("/python-worker.js");
    next.onmessage = ({ data }) => (data.ready ? resolve(next) : reject(new Error(data.error || "failed to load python runtime")));
    next.onerror = () => reject(new Error("failed to load python runtime"));
  });
}

export async function runPython(code: string, stdin = ""): Promise<RunResult> {
  worker ??= spawn().catch((error) => {
    worker = null;
    throw error;
  });
  const target = await worker;
  const startedAt = performance.now();

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      target.terminate();
      worker = null;
      resolve({ stdout: "", stderr: `stopped after ${RUN_TIMEOUT_MS / 1000}s`, runtimeMs: RUN_TIMEOUT_MS });
    }, RUN_TIMEOUT_MS);
    target.onmessage = ({ data }) => {
      clearTimeout(timer);
      resolve({ stdout: data.stdout, stderr: data.stderr, runtimeMs: Math.round(performance.now() - startedAt) });
    };
    target.postMessage({ code, stdin });
  });
}
