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

function base(): string {
  const s = new URLSearchParams(window.location.search).get("sidecar");
  return s ? s.replace(/\/$/, "") : "";
}

export async function fetchSystem(): Promise<SystemInfo | null> {
  try {
    const res = await fetch(`${base()}/api/system`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as SystemInfo;
  } catch {
    return null;
  }
}
