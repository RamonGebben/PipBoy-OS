import { TABS, type Tab } from "../config";
import { useAppStore } from "../store";
import "./tabstrip.css";

export function TabStrip() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setTab = useAppStore((s) => s.setTab);
  const lock = useAppStore((s) => s.config.lock);

  return (
    <nav className="tabstrip" aria-label="PipBoy tabs">
      {TABS.map((t: Tab) => (
        <button
          key={t}
          type="button"
          className={t === activeTab ? "tab active" : "tab"}
          onClick={() => !lock && setTab(t)}
          disabled={lock}
        >
          {t}
        </button>
      ))}
    </nav>
  );
}
