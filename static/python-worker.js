self.importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");

const ready = self.loadPyodide();
ready.then(
  () => self.postMessage({ ready: true }),
  (error) => self.postMessage({ ready: false, error: String(error?.message ?? error) })
);

self.onmessage = async ({ data }) => {
  const pyodide = await ready;
  let stdout = "";
  let stderr = "";
  pyodide.setStdout({ batched: (text) => (stdout += `${text}\n`) });
  pyodide.setStderr({ batched: (text) => (stderr += `${text}\n`) });
  try {
    pyodide.globals.set("__stdin", data.stdin ?? "");
    await pyodide.runPythonAsync("import io, sys\nsys.stdin = io.StringIO(__stdin)");
    await pyodide.runPythonAsync(data.code);
  } catch (error) {
    stderr += String(error?.message ?? error);
  }
  self.postMessage({ stdout, stderr });
};
