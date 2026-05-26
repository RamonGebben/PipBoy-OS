import { useEffect, useState } from "react";
import { subscribe } from "../../input/events";
import "./inv.css";

interface Item {
  name: string;
  weight: number;
  value: number;
  category: "WEAPONS" | "APPAREL" | "AID" | "MISC" | "AMMO";
}

const ITEMS: ReadonlyArray<Item> = [
  { name: "10mm Pistol", weight: 3.0, value: 50, category: "WEAPONS" },
  { name: "Combat Knife", weight: 1.0, value: 25, category: "WEAPONS" },
  { name: "Pipe Rifle", weight: 4.0, value: 35, category: "WEAPONS" },
  { name: "Vault 111 Jumpsuit", weight: 2.0, value: 20, category: "APPAREL" },
  { name: "Leather Armor", weight: 3.5, value: 45, category: "APPAREL" },
  { name: "Combat Helmet", weight: 1.5, value: 30, category: "APPAREL" },
  { name: "Stimpak", weight: 0.1, value: 35, category: "AID" },
  { name: "RadAway", weight: 0.5, value: 40, category: "AID" },
  { name: "Purified Water", weight: 1.0, value: 20, category: "AID" },
  { name: "Nuka-Cola", weight: 1.0, value: 20, category: "AID" },
  { name: "Bobby Pin", weight: 0.0, value: 1, category: "MISC" },
  { name: "Holotape", weight: 0.1, value: 5, category: "MISC" },
  { name: "Pre-War Money", weight: 0.0, value: 10, category: "MISC" },
  { name: ".308 Round", weight: 0.0, value: 3, category: "AMMO" },
  { name: "10mm Round", weight: 0.0, value: 1, category: "AMMO" },
  { name: "Fusion Cell", weight: 0.0, value: 2, category: "AMMO" },
];

const CATEGORIES = ["WEAPONS", "APPAREL", "AID", "MISC", "AMMO"] as const;

export default function Inv() {
  const [catIdx, setCatIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);

  const filtered = ITEMS.filter((i) => i.category === CATEGORIES[catIdx]);
  const safeIdx = Math.min(itemIdx, Math.max(0, filtered.length - 1));
  const selected = filtered[safeIdx];

  useEffect(() => {
    return subscribe((e) => {
      if (e === "scroll-up") setItemIdx((i) => Math.max(0, i - 1));
      if (e === "scroll-down")
        setItemIdx((i) => Math.min(filtered.length - 1, i + 1));
      if (e === "select") {
        setCatIdx((c) => (c + 1) % CATEGORIES.length);
        setItemIdx(0);
      }
    });
  }, [filtered.length]);

  return (
    <div className="inv">
      <header className="cat-strip">
        {CATEGORIES.map((c, i) => (
          <span key={c} className={i === catIdx ? "cat active" : "cat"}>
            {c}
          </span>
        ))}
      </header>
      <ul className="item-list">
        {filtered.map((it, i) => (
          <li key={it.name} className={i === safeIdx ? "row selected" : "row"}>
            <span className="name">{it.name}</span>
            <span className="wt">{it.weight.toFixed(1)}</span>
            <span className="val">{it.value}</span>
          </li>
        ))}
      </ul>
      <footer className="item-detail">
        {selected ? (
          <>
            <div className="detail-name">{selected.name}</div>
            <div className="detail-meta">
              WT {selected.weight.toFixed(1)} · VAL {selected.value}
            </div>
          </>
        ) : (
          <div className="detail-meta">NO ITEMS</div>
        )}
      </footer>
    </div>
  );
}
