export const TABS = ["STAT", "INV", "DATA", "RADIO"] as const;
export type Tab = (typeof TABS)[number];

export const THEMES = ["green", "amber", "white", "blue"] as const;
export type Theme = (typeof THEMES)[number];

export type Mode = "normal" | "demo";

export interface Config {
  mode: Mode;
  screen: Tab;
  lock: boolean;
  theme: Theme;
  cycleMs: number;
  scanlines: boolean;
  sidecar: string;
  bootAnimation: boolean;
}

const DEFAULTS: Config = {
  mode: "normal",
  screen: "STAT",
  lock: false,
  theme: "green",
  cycleMs: 8000,
  scanlines: true,
  sidecar: "",
  bootAnimation: true,
};

function asTab(v: string | null): Tab | undefined {
  if (!v) return undefined;
  const upper = v.toUpperCase();
  return (TABS as readonly string[]).includes(upper) ? (upper as Tab) : undefined;
}

function asTheme(v: string | null): Theme | undefined {
  if (!v) return undefined;
  return (THEMES as readonly string[]).includes(v) ? (v as Theme) : undefined;
}

function asBool(v: string | null): boolean | undefined {
  if (v === null) return undefined;
  if (v === "" || v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
}

function asInt(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function loadConfig(search = window.location.search): Config {
  const q = new URLSearchParams(search);
  const cfg: Config = { ...DEFAULTS };

  const mode = q.get("mode");
  if (mode === "demo" || mode === "normal") cfg.mode = mode;

  const screen = asTab(q.get("screen"));
  if (screen) cfg.screen = screen;

  const lock = asBool(q.get("lock"));
  if (lock !== undefined) cfg.lock = lock;

  const theme = asTheme(q.get("theme"));
  if (theme) cfg.theme = theme;

  const cycle = asInt(q.get("cycle")) ?? asInt(q.get("cycle-ms"));
  if (cycle) cfg.cycleMs = cycle;

  // ?no-scanlines or ?scanlines=false both disable
  if (q.has("no-scanlines")) cfg.scanlines = false;
  const sl = asBool(q.get("scanlines"));
  if (sl !== undefined) cfg.scanlines = sl;

  const sidecar = q.get("sidecar");
  if (sidecar) cfg.sidecar = sidecar;

  const boot = asBool(q.get("boot"));
  if (boot !== undefined) cfg.bootAnimation = boot;

  return cfg;
}
