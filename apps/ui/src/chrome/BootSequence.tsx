import { useEffect, useState } from "react";
import "./boot.css";

const LINES = [
  "*** ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL ***",
  "ENTERING MAINFRAME...",
  "BOOTSTRAP V1.1",
  "PIPOS (R) V7.1.0.8",
  "COPYRIGHT 2075 ROBCO (R)",
  "LOADER V1.1",
  "EXEC VERSION 41.10",
  "64K RAM SYSTEM",
  "38911 BYTES FREE",
  "NO HOLOTAPE FOUND",
  "LOAD ROM(1): DEITRIX 303",
  "INITIALIZING...",
  "VAULT-TEC PIP-BOY 3000 MK IV",
  "WELCOME OVERSEER",
];

interface Props {
  onDone: () => void;
}

export function BootSequence({ onDone }: Props) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= LINES.length) {
      const finish = window.setTimeout(onDone, 500);
      return () => window.clearTimeout(finish);
    }
    const delay = shown === 0 ? 200 : 90 + Math.random() * 80;
    const id = window.setTimeout(() => setShown((n) => n + 1), delay);
    return () => window.clearTimeout(id);
  }, [shown, onDone]);

  return (
    <div className="boot">
      <pre className="boot-text">
        {LINES.slice(0, shown).map((l, i) => (
          <span key={i}>
            {l}
            {"\n"}
          </span>
        ))}
        {shown < LINES.length && <span className="cursor">_</span>}
      </pre>
    </div>
  );
}
