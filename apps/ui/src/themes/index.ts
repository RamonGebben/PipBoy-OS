import type { Theme } from "../config";
import "./themes.css";

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}
