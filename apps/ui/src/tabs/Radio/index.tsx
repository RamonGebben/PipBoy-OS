import { useEffect, useState } from "react";
import "./radio.css";

const STATIONS = [
  "DIAMOND CITY RADIO",
  "CLASSICAL RADIO",
  "RADIO FREEDOM",
  "VAULT 101 EMERGENCY",
];

export default function Radio() {
  const [active, setActive] = useState(0);
  const [needle, setNeedle] = useState(0.42);

  // slow wandering needle, no audio
  useEffect(() => {
    const id = window.setInterval(() => {
      setNeedle((n) => {
        const drift = (Math.random() - 0.5) * 0.02;
        const next = n + drift;
        if (next < 0.1) return 0.1;
        if (next > 0.9) return 0.9;
        return next;
      });
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="radio">
      <section className="stations">
        <header className="section-title">STATIONS</header>
        <ul>
          {STATIONS.map((s, i) => (
            <li
              key={s}
              className={i === active ? "row selected" : "row"}
              onClick={() => setActive(i)}
            >
              {s}
            </li>
          ))}
        </ul>
        <div className="hint">SIGNAL: NONE — RECEIVER OFFLINE</div>
      </section>
      <section className="dial">
        <div className="dial-track">
          <div className="dial-needle" style={{ left: `${needle * 100}%` }} />
        </div>
        <div className="dial-scale" aria-hidden>
          {Array.from({ length: 21 }).map((_, i) => (
            <span key={i} className={i % 5 === 0 ? "tick major" : "tick"} />
          ))}
        </div>
      </section>
    </div>
  );
}
