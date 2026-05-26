import type { FastifyInstance } from "fastify";

export type InputEvent =
  | "tab-next"
  | "tab-prev"
  | "select"
  | "back"
  | "scroll-up"
  | "scroll-down";

export interface GpioPinMap {
  tabNext?: number;
  tabPrev?: number;
  select?: number;
  back?: number;
  scrollUp?: number;
  scrollDown?: number;
}

const PIN_TO_EVENT: ReadonlyArray<[keyof GpioPinMap, InputEvent]> = [
  ["tabNext", "tab-next"],
  ["tabPrev", "tab-prev"],
  ["select", "select"],
  ["back", "back"],
  ["scrollUp", "scroll-up"],
  ["scrollDown", "scroll-down"],
];

// Broadcaster, populated regardless of GPIO availability.
const sockets = new Set<{ send: (s: string) => void }>();

export function broadcast(ev: InputEvent): void {
  const msg = JSON.stringify({ event: ev });
  for (const s of sockets) {
    try {
      s.send(msg);
    } catch {
      /* ignore */
    }
  }
}

export function registerWsRoute(app: FastifyInstance): void {
  app.get("/ws/input", { websocket: true }, (socket /*, req */) => {
    const handle = { send: (s: string) => socket.send(s) };
    sockets.add(handle);
    socket.on("close", () => sockets.delete(handle));
    socket.on("error", () => sockets.delete(handle));
  });
}

export async function attachGpio(pins: GpioPinMap, log: (msg: string) => void): Promise<() => void> {
  if (!pins || Object.values(pins).every((v) => v === undefined)) {
    log("GPIO: no pins configured, skipping");
    return () => {};
  }
  let onoff: typeof import("onoff") | null = null;
  try {
    onoff = await import("onoff");
  } catch {
    log("GPIO: onoff not available (likely non-Pi host) — buttons disabled");
    return () => {};
  }
  const { Gpio } = onoff;
  const handles: Array<{ unexport: () => void }> = [];

  for (const [key, event] of PIN_TO_EVENT) {
    const pin = pins[key];
    if (typeof pin !== "number") continue;
    try {
      // Active-low button to GND with internal pull-up.
      const button = new Gpio(pin, "in", "falling", { debounceTimeout: 30 });
      button.watch((err: Error | null | undefined) => {
        if (err) return;
        broadcast(event);
      });
      handles.push(button);
      log(`GPIO: pin ${pin} → ${event}`);
    } catch (err) {
      log(`GPIO: failed to bind pin ${pin}: ${(err as Error).message}`);
    }
  }

  return () => {
    for (const h of handles) {
      try {
        h.unexport();
      } catch {
        /* ignore */
      }
    }
  };
}
