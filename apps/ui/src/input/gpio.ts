import { emit, type InputEvent } from "./events";

const VALID: ReadonlySet<InputEvent> = new Set([
  "tab-next",
  "tab-prev",
  "select",
  "back",
  "scroll-up",
  "scroll-down",
]);

export function installGpioBridge(sidecarBase: string): () => void {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = sidecarBase
    ? sidecarBase.replace(/^http/, "ws")
    : `${proto}://${window.location.host}`;
  const url = `${host.replace(/\/$/, "")}/ws/input`;

  let ws: WebSocket | null = null;
  let retryId = 0;
  let closed = false;

  function connect() {
    try {
      ws = new WebSocket(url);
    } catch {
      schedule();
      return;
    }
    ws.addEventListener("message", (ev) => {
      try {
        const data = JSON.parse(ev.data as string);
        if (data && typeof data.event === "string" && VALID.has(data.event)) {
          emit(data.event as InputEvent);
        }
      } catch {
        /* ignore malformed */
      }
    });
    ws.addEventListener("close", schedule);
    ws.addEventListener("error", () => ws?.close());
  }

  function schedule() {
    if (closed) return;
    window.clearTimeout(retryId);
    retryId = window.setTimeout(connect, 3000);
  }

  connect();

  return () => {
    closed = true;
    window.clearTimeout(retryId);
    ws?.close();
  };
}
