# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Web-based Fallout PipBoy UI for a Raspberry Pi 3B inside a 3D-printed PipBoy model. React/TS SPA + a small Node sidecar, run by Chromium kiosk on the Pi. Performance constraints (Pi 3B) drive most architectural choices.

## Commands

| | |
|---|---|
| `pnpm install` | Install workspace deps |
| `pnpm fetch-assets` | Download Vault Boy sprites etc. (gitignored, idempotent; `--force` to redownload). Required once before `pnpm dev`. |
| `pnpm dev` | Parallel dev: UI at :5173, sidecar at :8080. Vite proxies `/api` and `/ws` to the sidecar. |
| `pnpm dev:ui` / `pnpm dev:sidecar` | Run one side only. |
| `pnpm build` | `tsc -b && vite build` for UI, `tsc` for sidecar. |
| `pnpm start` | Production: sidecar serves the built UI at :8080. |
| `pnpm typecheck` | Workspace-wide `tsc --noEmit`. |
| `PIPBOY_MOCK=1 pnpm dev:sidecar` | Sidecar returns fake system data — use this when developing off-Pi (CPU temp, WiFi, etc. can't be read on macOS). |

There is no test suite. Verification = `pnpm build` + opening the UI in the browser.

## Architecture

Two processes wired together by URL conventions, not RPC:

```
Chromium kiosk → Vite SPA (apps/ui)         ← static build served by sidecar in prod
                       ↓ fetch /api/*       ← proxied in dev via vite.config.ts
                       ↓ ws /ws/input
                 Node sidecar (apps/sidecar)
                       ↓ shell + GPIO
                  Raspberry Pi
```

The **sidecar exists only because the browser can't shell out**: it brokers `vcgencmd`/`iwgetid`/etc. for the DATA tab's real Pi stats, and bridges GPIO buttons to a WebSocket the SPA listens on. It also serves the built UI in production. Keep it tiny; don't add business logic there.

### Configuration model (most surprising bit)

Precedence: **URL query args > `config.json` file > built-in defaults**. The launcher (`deploy/start-kiosk.sh`) reads `config.json` via `deploy/config-to-args.js`, turns the `ui:` section into a query string, then appends any `--key=value` flags from the command line. The SPA only ever parses `window.location.search` — it doesn't see the file directly.

Sidecar-only config (port, GPIO pin map, `uiDist`) lives in the same `config.json` under separate keys and is read server-side by `apps/sidecar/src/config.ts`.

**Adding a new flag requires three edits**:
1. `apps/ui/src/config/index.ts` (`loadConfig`, defaults, `Config` type)
2. `deploy/config-to-args.js` (one `push(...)` line)
3. README and `docs/PI_SETUP.md` flag tables

### State, input, theming

- **State**: single Zustand store at `apps/ui/src/store.ts`. The active tab, theme, and boot-finished flag live there; tab-local state stays in the tab component.
- **Input**: semantic event bus at `src/input/events.ts` (`tab-next`, `tab-prev`, `select`, `back`, `scroll-up`, `scroll-down`). Sources (keyboard / touch / GPIO over WS / demo auto-cycle) all `install*()` from `useInput()` and emit into the bus. Tabs subscribe locally for `select` / `scroll-*`; tab-next/prev are handled centrally and gated by `config.lock`.
- **Theming**: 4 themes are CSS custom-property sets keyed off `:root[data-theme="..."]` in `themes/themes.css`. Switch by setting `document.documentElement.dataset.theme`. Never hardcode colors — always `var(--phosphor)` / `--phosphor-dim` / `--phosphor-faint` / `--phosphor-glow` / `--bg`. Monochrome PNG sprites are tinted per theme using `mask-image: url(...); background-color: var(--phosphor);` (see `tabs/Stat/stat.css`).

### Tabs are lazy chunks

Each top tab (`STAT`, `INV`, `DATA`, `RADIO`) is a `React.lazy()` import in `App.tsx`. Add a new tab by:
1. Adding to `TABS` in `src/config/index.ts`
2. Creating `src/tabs/<Name>/index.tsx` with default export
3. Lazy-importing + dispatching in `App.tsx`

`STAT` has internal sub-tabs (`Status` / `S.P.E.C.I.A.L.` / Skills / Perks / General) — local `useState`, not a router.

## Pi 3B performance rules (hard)

These cause real frame drops on the target hardware. Apply during code review:

- **No `box-shadow` or `filter: blur()` on animated elements.** GPU is VideoCore IV. `text-shadow` on static elements is fine; `drop-shadow()` on static elements is fine.
- **Animations use `transform` or `opacity` only.** Other properties trigger layout/paint.
- **No `setInterval` faster than 1 s** for non-essential UI updates. STAT figure runs at 8 fps (125 ms) on purpose.
- **30 fps is acceptable**; aim for 60 only on the tab-switch transform.
- Bundle budgets: < 80 KB gz initial JS, < 300 KB gz total. Lazy-load anything tab-specific. `vite.config.ts` already splits React into its own chunk.

## Assets

`apps/ui/public/assets/` is **gitignored** and populated by `pnpm fetch-assets` from `SurvivorGrim/PipBoy-Pi5` (unlicensed, Bethesda-derivative art). Don't commit assets; add new ones by extending the list in `scripts/fetch-assets.mjs`.

## Deploy

- `deploy/start-kiosk.sh` — Chromium kiosk launcher; merges `config.json` and `--flags` into the URL.
- `deploy/pipboy-sidecar.service` — systemd unit for the Node sidecar; used on both Pi OS Lite and Desktop.
- `deploy/pipboy-ui.service` — systemd unit that runs `startx`; **Pi OS Lite only**. Do not use on Pi OS Desktop — LightDM owns the X session there.
- `deploy/pipboy-kiosk.desktop` — LXDE autostart entry; **Pi OS Desktop only**. Installs to `/etc/xdg/autostart/`.
- `docs/PI_SETUP.md` — operator-facing full Pi setup walkthrough. Keep it in sync when changing flags, services, or required apt packages.

**Tested deploy target**: Pi 3B, Pi OS Desktop (Bookworm), install path `/opt/pipboy/PipBoy-OS/`.

## Workspace layout

```
apps/ui/        # Vite + React SPA
apps/sidecar/   # Fastify service (system stats, GPIO bridge, static UI)
deploy/         # systemd units + kiosk launcher + config bridge
docs/           # Pi setup guide
scripts/        # fetch-assets etc.
```
