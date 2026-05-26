import type { ReactNode } from "react";
import { TabStrip } from "./TabStrip";
import { StatusBar } from "./StatusBar";
import "./frame.css";

export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="frame">
      <TabStrip />
      <main className="screen">{children}</main>
      <StatusBar />
    </div>
  );
}
