import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";

const exec = promisify(execFile);

export interface SystemInfo {
  time: string;
  uptimeSec: number;
  cpuTempC: number | null;
  loadAvg: [number, number, number];
  mem: { totalMb: number; freeMb: number };
  wifi: { ssid: string | null; signal: number | null };
  ip: string | null;
  hostname: string;
}

const CACHE_MS = 2000;
let cache: { at: number; data: SystemInfo } | null = null;
const MOCK = process.env.PIPBOY_MOCK === "1";

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

async function readCpuTemp(): Promise<number | null> {
  if (MOCK) return 42.5 + Math.random() * 8;
  // 1. Try /sys/class/thermal (Linux generic, works on Pi)
  try {
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile("/sys/class/thermal/thermal_zone0/temp", "utf8");
    const n = parseInt(raw.trim(), 10);
    if (Number.isFinite(n)) return n / 1000;
  } catch {
    /* fall through */
  }
  // 2. Try vcgencmd (Raspberry Pi)
  try {
    const { stdout } = await exec("vcgencmd", ["measure_temp"]);
    const m = stdout.match(/temp=([\d.]+)/);
    if (m) return parseFloat(m[1]!);
  } catch {
    /* ignore */
  }
  return null;
}

async function readWifi(): Promise<{ ssid: string | null; signal: number | null }> {
  if (MOCK) return { ssid: "VAULT-TEC-WIFI", signal: -47 };
  let ssid: string | null = null;
  let signal: number | null = null;
  try {
    const { stdout } = await exec("iwgetid", ["-r"]);
    const s = stdout.trim();
    if (s) ssid = s;
  } catch {
    /* ignore */
  }
  try {
    const { stdout } = await exec("iwconfig", []);
    const m = stdout.match(/Signal level=(-?\d+)/);
    if (m) signal = parseInt(m[1]!, 10);
  } catch {
    /* ignore */
  }
  return { ssid, signal };
}

function readIp(): string | null {
  if (MOCK) return "192.168.4.20";
  const ifs = os.networkInterfaces();
  for (const name of Object.keys(ifs)) {
    if (name === "lo" || name.startsWith("lo")) continue;
    for (const a of ifs[name] ?? []) {
      if (a.family === "IPv4" && !a.internal) return a.address;
    }
  }
  return null;
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.data;

  const [cpuTempC, wifi] = await Promise.all([
    safe(readCpuTemp(), null),
    safe(readWifi(), { ssid: null, signal: null }),
  ]);

  const totalMb = os.totalmem() / 1024 / 1024;
  const freeMb = os.freemem() / 1024 / 1024;
  const [l1, l5, l15] = os.loadavg();

  const data: SystemInfo = {
    time: new Date().toISOString(),
    uptimeSec: Math.floor(os.uptime()),
    cpuTempC,
    loadAvg: [l1 ?? 0, l5 ?? 0, l15 ?? 0],
    mem: { totalMb, freeMb },
    wifi,
    ip: readIp(),
    hostname: os.hostname(),
  };

  cache = { at: now, data };
  return data;
}
