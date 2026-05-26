import { useEffect, useState } from "react";
import { useAppStore } from "../store";

function clockText(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function StatusBar() {
  const mode = useAppStore((s) => s.config.mode);
  const theme = useAppStore((s) => s.config.theme);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="statusbar">
      <div className="left">
        <span>PIP-BOY 3000 MK IV</span>
        {mode === "demo" && <span>[DEMO]</span>}
      </div>
      <div className="right">
        <span>{theme.toUpperCase()}</span>
        <span>{clockText(now)}</span>
      </div>
    </div>
  );
}
