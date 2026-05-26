import { emit } from "./events";

const SWIPE_THRESHOLD = 40;

export function installTouch(): () => void {
  let startX = 0;
  let startY = 0;
  let active = false;

  function onDown(ev: PointerEvent) {
    if (ev.pointerType === "mouse") return;
    active = true;
    startX = ev.clientX;
    startY = ev.clientY;
  }

  function onUp(ev: PointerEvent) {
    if (!active) return;
    active = false;
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > SWIPE_THRESHOLD) emit("tab-prev");
      else if (dx < -SWIPE_THRESHOLD) emit("tab-next");
    } else {
      if (dy > SWIPE_THRESHOLD) emit("scroll-up");
      else if (dy < -SWIPE_THRESHOLD) emit("scroll-down");
    }
  }

  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  return () => {
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
  };
}
