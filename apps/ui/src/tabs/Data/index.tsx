import { useEffect, useState } from "react";
import { fetchSystem, type SystemInfo } from "../../api/system";
import "./data.css";

function fmtUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtMem(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(0)} MB`;
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function useSystem() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => {
      void fetchSystem().then((res) => {
        if (active) setInfo(res);
      });
    };
    load();
    const id = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);
  return info;
}

export default function Data() {
  const now = useNow();
  const info = useSystem();

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const timeStr = now.toLocaleTimeString(undefined, { hour12: false });

  return (
    <div className="data">
      <section className="clock">
        <div className="clock-time">{timeStr}</div>
        <div className="clock-date">{dateStr.toUpperCase()}</div>
      </section>

      <section className="system">
        <header className="section-title">SYSTEM</header>
        <dl className="kv">
          <Row k="HOST" v={info?.hostname ?? "—"} />
          <Row k="IP" v={info?.ip ?? "—"} />
          <Row
            k="WIFI"
            v={
              info?.wifi.ssid
                ? `${info.wifi.ssid}${
                    info.wifi.signal !== null ? ` (${info.wifi.signal} dBm)` : ""
                  }`
                : "—"
            }
          />
          <Row
            k="CPU TEMP"
            v={info?.cpuTempC !== null && info?.cpuTempC !== undefined ? `${info.cpuTempC.toFixed(1)} °C` : "—"}
          />
          <Row
            k="LOAD"
            v={info ? info.loadAvg.map((n) => n.toFixed(2)).join(" ") : "—"}
          />
          <Row
            k="MEMORY"
            v={
              info
                ? `${fmtMem(info.mem.totalMb - info.mem.freeMb)} / ${fmtMem(info.mem.totalMb)}`
                : "—"
            }
          />
          <Row k="UPTIME" v={info ? fmtUptime(info.uptimeSec) : "—"} />
        </dl>
        {info === null && (
          <div className="offline">SIDECAR OFFLINE — RETRYING…</div>
        )}
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </>
  );
}
