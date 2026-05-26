import { emit } from "./events";

export function installAutoCycle(intervalMs: number): () => void {
  const id = window.setInterval(() => emit("tab-next"), intervalMs);
  return () => window.clearInterval(id);
}
