# Handoff

Point-in-time state for the next session. CLAUDE.md has the durable architecture; this file is just "where we left off".

_Last updated: 2026-05-26_

## Status

- **Builds & runs locally** on macOS (`pnpm install && pnpm fetch-assets && pnpm dev`).
- **Not yet smoke-tested on a Raspberry Pi 3B.** Everything below the Vite proxy is unverified on real hardware: actual boot time, RSS, GPIO interrupts, `vcgencmd`, X / matchbox / Chromium kiosk autostart, screen blanking suppression. Pi hardware is the next big validation gate.

## Recently shipped

- Full scaffold (UI + sidecar + systemd units + Pi setup doc).
- STAT tab restructured to mirror the F3 in-game layout:
  - Top header (`LVL / HP / AP / XP`)
  - Left condition menu (`CND / RAD / EFF / H2O / FOD / SLP`)
  - Vault Boy figure (head + 8-frame walking cycle, breathing offset, mask-tinted)
  - Limb markers as children of the 100×180 figure box (pixel positions)
  - Right-hand aid items list
  - Bottom sub-tabs (Status / S.P.E.C.I.A.L. / Skills / Perks / General); Status + SPECIAL functional, the rest are placeholders.
- Asset pipeline (`pnpm fetch-assets`) pulling sprites from `SurvivorGrim/PipBoy-Pi5`.

## Open threads (small)

- **Limb marker positions** are eyeballed in pixels against the walking sprite. Last view from the user looked plausible but no follow-up confirmation — expect ±5 px nudges per limb once the figure is viewed on the target screen size.
- **No T-pose Vault Boy asset** exists in the upstream we pulled from (`body_1.png` and `legs1/1.png` are the same idle/walking pose). User accepted current walking figure; revisit if a static T-pose sprite is sourced elsewhere.
- **Config-lock semantics** — `config.lock = true` disables top-tab nav and input sources, but STAT sub-tabs and the condition menu are still freely clickable. May want to extend `lock` to gate all interactive UI if a true kiosk-pin is needed.

## Open questions / decisions deferred

1. **Phase 2 asset pull** — SPECIAL stat animations, inventory item 24-frame spins, 8-frame boot animation, monofonto / RobotoCondensed fonts, map icons. Plan exists; awaiting user go-ahead.
2. **MAP tab** — not built. Upstream has SVG map icons but no map renderer; would need a tile source + interaction model.
3. **Real radio** — RADIO tab is "no signal" cosmetics. Adding audio means an `<audio>` element + curated stream list + permissions handling (Chromium autoplay flag is already set in `start-kiosk.sh`).
4. **Settings UI** — no in-app way to change theme/mode at runtime; users must reload with new URL args. A small settings overlay (long-press, secret tap?) would be nice once input ergonomics are settled on real hardware.
5. **`/api/input` POST endpoint** is unauthenticated. Fine on a kiosk loopback; if the sidecar ever binds to anything but 127.0.0.1 in a networked context, this needs auth or removal.

## Suggested next moves (in order)

1. **Pi 3B hardware bring-up**: run `docs/PI_SETUP.md` end-to-end, hit the budgets in CLAUDE.md, fix what doesn't fly. Anything below this is premature without it.
2. **Phase 2 small wins** (cheap, big visual lift):
   - `monofonto.ttf` font (drop-in, immediate authenticity)
   - 8-frame boot animation replacing the ROBCO text
3. **SPECIAL sub-tab Vault Boy poses** — animated per-stat figures from `images/stats/special/*`.
4. **INV tab item rotations** — bind a few `images/inventory/<item>/000–023.png` sequences to the currently-selected inventory row.

## Don't-trip-on-this

- `pnpm fetch-assets` is required before first `pnpm dev` or assets 404. It's idempotent; safe to re-run.
- The Vite dev server proxies `/api` and `/ws` to the sidecar — `pnpm dev:ui` alone won't have working DATA/GPIO. Use `pnpm dev` or run both halves.
- All CSS color values must be theme variables (`var(--phosphor)` etc.). Hard-coded colors break the theme swap.
- Mask-image-based sprite tinting needs both `mask-image` and `-webkit-mask-image` (Chromium on the Pi is recent enough to drop the prefix, but Vite preview / older Safari isn't).
- The `STEPS = [0,1,2,3,4,3,2,1]` breathing offset and 125 ms cycle mirror the upstream Pygame timing — don't change without checking how it looks.
