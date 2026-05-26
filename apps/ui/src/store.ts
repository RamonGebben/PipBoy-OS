import { create } from "zustand";
import { loadConfig, type Config, type Tab, type Theme, TABS } from "./config";

interface AppState {
  config: Config;
  activeTab: Tab;
  booted: boolean;
  setTab: (t: Tab) => void;
  nextTab: () => void;
  prevTab: () => void;
  setTheme: (t: Theme) => void;
  setBooted: (b: boolean) => void;
}

const initial = loadConfig();

export const useAppStore = create<AppState>((set) => ({
  config: initial,
  activeTab: initial.screen,
  booted: !initial.bootAnimation,
  setTab: (t) => set((s) => (s.config.lock ? s : { activeTab: t })),
  nextTab: () =>
    set((s) => {
      if (s.config.lock) return s;
      const i = TABS.indexOf(s.activeTab);
      return { activeTab: TABS[(i + 1) % TABS.length]! };
    }),
  prevTab: () =>
    set((s) => {
      if (s.config.lock) return s;
      const i = TABS.indexOf(s.activeTab);
      return { activeTab: TABS[(i - 1 + TABS.length) % TABS.length]! };
    }),
  setTheme: (t) =>
    set((s) => {
      document.documentElement.dataset.theme = t;
      return { config: { ...s.config, theme: t } };
    }),
  setBooted: (b) => set({ booted: b }),
}));
