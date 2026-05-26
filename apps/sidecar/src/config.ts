import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { GpioPinMap } from "./gpio.js";

export interface SidecarConfig {
  port: number;
  uiDist: string;
  gpio: GpioPinMap;
}

const DEFAULTS: SidecarConfig = {
  port: Number(process.env.PIPBOY_PORT ?? 8080),
  uiDist: process.env.PIPBOY_UI_DIST ?? path.resolve(process.cwd(), "../ui/dist"),
  gpio: {},
};

function tryRead(p: string): unknown | null {
  try {
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickConfigFile(): string | null {
  const candidates = [
    process.env.PIPBOY_CONFIG,
    "/boot/pipboy.config.json",
    "/boot/firmware/pipboy.config.json",
    path.join(os.homedir(), ".config/pipboy/config.json"),
    path.resolve(process.cwd(), "config.json"),
  ].filter((p): p is string => typeof p === "string" && p.length > 0);
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

export function loadSidecarConfig(): SidecarConfig {
  const file = pickConfigFile();
  if (!file) return DEFAULTS;
  const raw = tryRead(file);
  if (!raw || typeof raw !== "object") return DEFAULTS;
  const r = raw as Record<string, unknown>;
  const gpioRaw = (r["gpio"] ?? {}) as Record<string, unknown>;
  return {
    port: typeof r["port"] === "number" ? r["port"] : DEFAULTS.port,
    uiDist: typeof r["uiDist"] === "string" ? r["uiDist"] : DEFAULTS.uiDist,
    gpio: {
      tabNext: numOrUndef(gpioRaw["tabNext"]),
      tabPrev: numOrUndef(gpioRaw["tabPrev"]),
      select: numOrUndef(gpioRaw["select"]),
      back: numOrUndef(gpioRaw["back"]),
      scrollUp: numOrUndef(gpioRaw["scrollUp"]),
      scrollDown: numOrUndef(gpioRaw["scrollDown"]),
    },
  };
}

function numOrUndef(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
