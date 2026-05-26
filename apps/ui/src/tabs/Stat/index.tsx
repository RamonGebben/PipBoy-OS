import { useEffect, useState } from "react";
import "./stat.css";

const SPECIAL: ReadonlyArray<[string, string, number]> = [
  ["S", "STRENGTH", 5],
  ["P", "PERCEPTION", 6],
  ["E", "ENDURANCE", 4],
  ["C", "CHARISMA", 7],
  ["I", "INTELLIGENCE", 8],
  ["A", "AGILITY", 5],
  ["L", "LUCK", 6],
];

const STEPS = [0, 1, 2, 3, 4, 3, 2, 1];
const FRAME_MS = 125;

const CONDITION_MENU = ["CND", "RAD", "EFF", "H2O", "FOD", "SLP"] as const;
type Condition = (typeof CONDITION_MENU)[number];

const SUB_TABS = ["STATUS", "SPECIAL", "SKILLS", "PERKS", "GENERAL"] as const;
type SubTab = (typeof SUB_TABS)[number];

const AID_ITEMS = [
  { hotkey: 9, name: "Stimpak", tag: "S" },
  { hotkey: 10, name: "Doctor's Bag", tag: "E" },
  { hotkey: 11, name: "Purified Water", tag: "H" },
  { hotkey: 12, name: "RadAway", tag: "R" },
];

export default function Stat() {
  const [sub, setSub] = useState<SubTab>("STATUS");
  const [condition, setCondition] = useState<Condition>("CND");

  return (
    <div className="stat">
      <StatHeader />
      <div className="stat-body">
        {sub === "STATUS" && (
          <StatusPane condition={condition} setCondition={setCondition} />
        )}
        {sub === "SPECIAL" && <SpecialPane />}
        {(sub === "SKILLS" || sub === "PERKS" || sub === "GENERAL") && (
          <PlaceholderPane label={sub} />
        )}
      </div>
      <SubTabStrip active={sub} onChange={setSub} />
    </div>
  );
}

function StatHeader() {
  return (
    <header className="stat-header">
      <span className="stat-title">STATS</span>
      <div className="stat-header-stats">
        <span>
          <em>LVL</em> 7
        </span>
        <span>
          <em>HP</em> 46/145
        </span>
        <span>
          <em>AP</em> 88/80
        </span>
        <span>
          <em>XP</em> 4969/6125
        </span>
      </div>
    </header>
  );
}

function SubTabStrip({
  active,
  onChange,
}: {
  active: SubTab;
  onChange: (s: SubTab) => void;
}) {
  return (
    <nav className="sub-tabs" aria-label="STAT sub-tabs">
      {SUB_TABS.map((t) => (
        <button
          key={t}
          type="button"
          className={t === active ? "sub-tab active" : "sub-tab"}
          onClick={() => onChange(t)}
        >
          {t === "SPECIAL" ? "S.P.E.C.I.A.L." : titleCase(t)}
        </button>
      ))}
    </nav>
  );
}

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function StatusPane({
  condition,
  setCondition,
}: {
  condition: Condition;
  setCondition: (c: Condition) => void;
}) {
  return (
    <div className="status-pane">
      <aside className="condition-menu">
        {CONDITION_MENU.map((c) => (
          <button
            key={c}
            type="button"
            className={c === condition ? "cond active" : "cond"}
            onClick={() => setCondition(c)}
          >
            {c}
          </button>
        ))}
      </aside>

      <div className="figure-area">
        <VaultboyAnimated />
        <div className="char-name">AXONIS &middot; LEVEL 7</div>
      </div>

      <aside className="aid-list">
        {AID_ITEMS.map((it) => (
          <div key={it.hotkey} className="aid-row">
            <span className="aid-hot">({it.hotkey})</span>
            <span className="aid-name">{it.name}</span>
            <span className="aid-tag">{it.tag}</span>
          </div>
        ))}
      </aside>
    </div>
  );
}

function SpecialPane() {
  return (
    <div className="special-pane">
      <ul className="special-list">
        {SPECIAL.map(([letter, name, val]) => (
          <li key={letter}>
            <span className="special-letter">{letter}</span>
            <span className="special-name">{name}</span>
            <Bar value={val * 10} />
            <span className="special-value">{val}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlaceholderPane({ label }: { label: string }) {
  return (
    <div className="placeholder-pane">
      <span>{label} — NO DATA</span>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="bar" aria-hidden>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function LimbMarker({ className, label }: { className: string; label?: string }) {
  return (
    <div className={`limb ${className}`} aria-hidden>
      {label && <span className="limb-label">{label}</span>}
      <span className="limb-bracket" />
    </div>
  );
}

function VaultboyAnimated() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, FRAME_MS);
    return () => window.clearInterval(id);
  }, []);

  const bob = STEPS[step] ?? 0;
  const legFrame = step + 1;

  return (
    <div className="vaultboy-figure" aria-hidden>
      <div
        className="vb-legs"
        style={{
          maskImage: `url(/assets/stats/legs1/${legFrame}.png)`,
          WebkitMaskImage: `url(/assets/stats/legs1/${legFrame}.png)`,
          transform: `translateY(${bob}px)`,
        }}
      />
      <div
        className="vb-head"
        style={{ transform: `translateY(${bob}px)` }}
      />
      <LimbMarker className="limb-head" />
      <LimbMarker className="limb-arm-l" label="CRIPPLED" />
      <LimbMarker className="limb-arm-r" />
      <LimbMarker className="limb-torso" />
      <LimbMarker className="limb-leg-l" label="CRIPPLED" />
      <LimbMarker className="limb-leg-r" />
    </div>
  );
}
