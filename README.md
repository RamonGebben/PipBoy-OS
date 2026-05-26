# PipBoy OS

A web-based recreation of the Fallout PipBoy interface, designed to run on a
Raspberry Pi 3B (or anything newer) inside a 3D-printed PipBoy model. React +
TypeScript, ruthlessly optimised for low-end hardware.

```
┌─────────────────────────────────────────────┐
│ Chromium kiosk  →  React SPA  ↔  Node sidecar │
│                                ↑              │
│                                GPIO buttons    │
└─────────────────────────────────────────────┘
```

## Features

- Fallout 4 tab layout: **STAT / INV / DATA / RADIO**.
- Themes: **green** (F4), **amber** (F3/NV), **white**, **blue**. Swap at
  runtime via URL arg or `config.json`.
- Real clock + Pi system stats on the DATA tab (CPU temp, load, memory, WiFi,
  uptime). Other tabs are ambient/cosmetic.
- Input: keyboard, touchscreen, GPIO buttons (via WS), or demo auto-cycle —
  pick from launch flags.
- Boot animation, animated scanlines, vignette — all CSS, GPU-friendly.
- Lazy-loaded tab chunks, ~tiny initial JS payload.
- Autoboot scripts and systemd units for the Pi.

## Quick start (dev, on your laptop)

```bash
pnpm install
pnpm fetch-assets   # one-off: pulls Vault Boy sprites etc. (gitignored)
pnpm dev
```

- UI: <http://localhost:5173>
- Sidecar API: <http://localhost:8080/api/system>

`PIPBOY_MOCK=1 pnpm dev:sidecar` makes the sidecar return sensible mock values
when you're not on a Pi.

Try the launch flags directly in the URL:

- `http://localhost:5173/?theme=amber`
- `http://localhost:5173/?mode=demo&cycle=4000`
- `http://localhost:5173/?screen=DATA&lock=true`

## Configuration

Precedence: **URL args  >  config.json  >  built-in defaults**.

Search order for `config.json`:

1. `$PIPBOY_CONFIG`
2. `/boot/pipboy.config.json` (or `/boot/firmware/pipboy.config.json` on Bookworm)
3. `~/.config/pipboy/config.json`
4. `./config.json` next to the sidecar

See [`deploy/config.example.json`](deploy/config.example.json).

## Production build

```bash
pnpm build
pnpm start    # sidecar serves the built UI at http://0.0.0.0:8080
```

## Deploy on a Raspberry Pi

Step-by-step guide: **[docs/PI_SETUP.md](docs/PI_SETUP.md)**.

Short version:

```bash
sudo cp deploy/pipboy-sidecar.service /etc/systemd/system/
sudo cp deploy/pipboy-ui.service      /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pipboy-sidecar pipboy-ui
```

## Layout

```
apps/
  ui/        # Vite + React SPA
  sidecar/   # Fastify service: system stats, GPIO bridge, static UI
deploy/      # systemd units, kiosk launcher, config-to-args bridge
docs/        # Pi setup guide
```

## Performance budgets (Pi 3B targets)

| | budget |
|---|---|
| First contentful paint | < 2 s |
| Idle CPU (post-boot) | < 15% one core |
| Browser RSS | < 180 MB |
| Sidecar RSS | < 40 MB |
| JS bundle (gz) | < 300 KB total |

## Asset attribution

Image assets (Vault Boy sprites, equipment icons) are sourced from
[SurvivorGrim/PipBoy-Pi5](https://github.com/SurvivorGrim/PipBoy-Pi5), which
itself adapts [ZapWizard's pypboy](https://github.com/zapwizard/pypboy) and
the Adafruit Ruiz Brothers' PipBoy project. The original artwork is derivative
of Bethesda's Fallout IP.

Assets are **not committed** to this repo — `pnpm fetch-assets` downloads them
into `apps/ui/public/assets/` (gitignored) for personal/local use. Don't
redistribute them.

## License

MIT for code in this repo — see [LICENSE](LICENSE) (add one before publishing).
Asset rights remain with their respective owners (see Asset attribution above).
