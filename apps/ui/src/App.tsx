import { Suspense, lazy } from "react";
import { useAppStore } from "./store";
import { Frame } from "./chrome/Frame";
import { Scanlines } from "./chrome/Scanlines";
import { BootSequence } from "./chrome/BootSequence";
import { useInput } from "./input/useInput";

const Stat = lazy(() => import("./tabs/Stat"));
const Inv = lazy(() => import("./tabs/Inv"));
const Data = lazy(() => import("./tabs/Data"));
const Radio = lazy(() => import("./tabs/Radio"));

export function App() {
  const booted = useAppStore((s) => s.booted);
  const setBooted = useAppStore((s) => s.setBooted);
  const activeTab = useAppStore((s) => s.activeTab);
  const scanlines = useAppStore((s) => s.config.scanlines);

  useInput();

  if (!booted) {
    return (
      <>
        <BootSequence onDone={() => setBooted(true)} />
        {scanlines && <Scanlines />}
      </>
    );
  }

  return (
    <>
      <Frame>
        <Suspense fallback={<div className="loading">LOADING…</div>}>
          {activeTab === "STAT" && <Stat />}
          {activeTab === "INV" && <Inv />}
          {activeTab === "DATA" && <Data />}
          {activeTab === "RADIO" && <Radio />}
        </Suspense>
      </Frame>
      {scanlines && <Scanlines />}
    </>
  );
}
