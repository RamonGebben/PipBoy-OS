import { useEffect } from "react";
import { useAppStore } from "../store";
import { subscribe, type InputEvent } from "./events";
import { installKeyboard } from "./keyboard";
import { installTouch } from "./touch";
import { installAutoCycle } from "./autoCycle";
import { installGpioBridge } from "./gpio";

export function useInput(): void {
  const config = useAppStore((s) => s.config);
  const nextTab = useAppStore((s) => s.nextTab);
  const prevTab = useAppStore((s) => s.prevTab);

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    if (!config.lock) {
      cleanups.push(installKeyboard());
      cleanups.push(installTouch());
      cleanups.push(installGpioBridge(config.sidecar));
    }
    if (config.mode === "demo" && !config.lock) {
      cleanups.push(installAutoCycle(config.cycleMs));
    }

    const unsub = subscribe((e: InputEvent) => {
      switch (e) {
        case "tab-next":
          nextTab();
          break;
        case "tab-prev":
          prevTab();
          break;
        default:
          /* per-tab scroll/select handled locally */
          break;
      }
    });
    cleanups.push(unsub);

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [config.lock, config.mode, config.cycleMs, config.sidecar, nextTab, prevTab]);
}
