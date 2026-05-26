import { emit } from "./events";

export function installKeyboard(): () => void {
  function onKey(ev: KeyboardEvent) {
    switch (ev.key) {
      case "ArrowRight":
      case "Tab":
        if (!ev.shiftKey) {
          ev.preventDefault();
          emit("tab-next");
        } else {
          ev.preventDefault();
          emit("tab-prev");
        }
        break;
      case "ArrowLeft":
        emit("tab-prev");
        break;
      case "ArrowUp":
        emit("scroll-up");
        break;
      case "ArrowDown":
        emit("scroll-down");
        break;
      case "Enter":
      case " ":
        emit("select");
        break;
      case "Escape":
      case "Backspace":
        emit("back");
        break;
    }
  }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}
