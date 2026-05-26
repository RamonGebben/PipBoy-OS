# PipBoy OS — Raspberry Pi 3B setup

This guide takes a fresh Raspberry Pi 3B and configures it to autoboot into the
PipBoy UI in fullscreen kiosk mode. Tested target: **Raspberry Pi OS Lite (64‑bit, Bookworm)**.

> Pi 3B is the floor — anything newer (3B+, 4, 5, Zero 2 W) works the same way
> and will feel faster.

---

## 1. Flash the OS

1. Use [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
2. Choose **Raspberry Pi OS Lite (64‑bit)**.
3. Open the gear/settings panel and pre-configure:
   - Hostname: `pipboy`
   - Username: `pi`, set a password
   - Wi‑Fi SSID + password
   - SSH enabled
   - Locale & keyboard
4. Flash, boot the Pi, SSH in: `ssh pi@pipboy.local`

## 2. Install system dependencies

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y --no-install-recommends \
  xserver-xorg x11-xserver-utils xinit \
  matchbox-window-manager chromium-browser \
  unclutter ca-certificates curl git \
  netcat-openbsd
```

Install Node.js 20 LTS (ARMv7/v8 binaries are official):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v20.x
```

Install `pnpm`:

```bash
sudo npm install -g pnpm@9
```

## 3. Deploy the code

```bash
sudo mkdir -p /opt/pipboy/PipBoy-OS
sudo chown pi:pi /opt/pipboy/PipBoy-OS
cd /opt/pipboy/PipBoy-OS
git clone <your-fork-url> .          # or rsync from your dev machine
pnpm install
pnpm build
```

## 4. (Optional) Place a config.json

The setup looks for, in order:

1. `$PIPBOY_CONFIG`
2. `/boot/pipboy.config.json` (or `/boot/firmware/pipboy.config.json` on Bookworm)
3. `~/.config/pipboy/config.json`
4. `./config.json` in the sidecar's working directory

Drop your config in the most convenient location:

```bash
sudo cp /opt/pipboy/PipBoy-OS/deploy/config.example.json /boot/firmware/pipboy.config.json
sudo nano /boot/firmware/pipboy.config.json
```

Example overrides:

```json
{
  "ui": { "mode": "demo", "theme": "amber", "cycleMs": 6000 },
  "port": 8080,
  "gpio": { "tabNext": 17, "tabPrev": 27, "select": 22, "back": 23 }
}
```

URL args at launch always win over the file (see §7).

## 5. Allow X to start from a systemd service

On Bookworm, X.Org needs elevated rights to call `drmSetMaster` (get exclusive
KMS/DRM control). When launched via systemd the Xorg process isn't part of a
logind seat session, so it must use the setuid wrapper instead:

```bash
sudo tee /etc/X11/Xwrapper.config <<'EOF'
allowed_users=anybody
needs_root_rights=yes
EOF
```

`needs_root_rights=yes` makes the Xorg wrapper elevate briefly for the DRM
handshake then drop back. Without this you get
`drmSetMaster failed: Permission denied` and X exits immediately.

## 6. Install systemd services

```bash
sudo cp /opt/pipboy/PipBoy-OS/deploy/pipboy-sidecar.service /etc/systemd/system/
sudo cp /opt/pipboy/PipBoy-OS/deploy/pipboy-ui.service      /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pipboy-sidecar pipboy-ui
sudo systemctl start  pipboy-sidecar
```

Test the sidecar:

```bash
curl http://localhost:8080/api/system | jq
```

Reboot to verify the UI service starts the kiosk on boot:

```bash
sudo reboot
```

## 7. Override behaviour from autostart (CLI flags)

`start-kiosk.sh` accepts `--key=value` flags that turn into URL args. These
override anything in `config.json`. Examples:

```bash
/opt/pipboy/PipBoy-OS/deploy/start-kiosk.sh --mode=demo --theme=amber
/opt/pipboy/PipBoy-OS/deploy/start-kiosk.sh --screen=DATA --lock=true
/opt/pipboy/PipBoy-OS/deploy/start-kiosk.sh --no-scanlines --boot=false
```

Supported flags:

| Flag | Values | Effect |
|---|---|---|
| `--mode=` | `normal`, `demo` | `demo` auto-cycles tabs |
| `--screen=` | `STAT`, `INV`, `DATA`, `RADIO` | Initial tab |
| `--lock=` | `true`, `false` | Disable user navigation (kiosk-pin) |
| `--theme=` | `green`, `amber`, `white`, `blue` | Phosphor colour |
| `--cycle=` | int (ms) | Demo cycle interval |
| `--scanlines=` | `true`, `false` | Scanline overlay |
| `--no-scanlines` | flag | Shortcut to disable scanlines |
| `--boot=` | `true`, `false` | Show the boot animation on launch |

To bake flags into autostart, edit the systemd unit and change `ExecStart` to
`startx /opt/pipboy/PipBoy-OS/deploy/start-kiosk.sh --mode=demo --theme=amber -- -nocursor`.

## 8. Pi-specific performance tweaks

Edit `/boot/firmware/config.txt` (Bookworm) or `/boot/config.txt` (older):

```
# Give the GPU a bit more memory so Chromium compositing is happier
gpu_mem=128

# Disable rainbow splash + Pi logo to shave boot time
disable_splash=1

# Force HDMI on even with nothing detected (helpful inside a model)
hdmi_force_hotplug=1
```

Hide the login text and console cursor during boot (cosmetic):

```bash
sudo sed -i 's/$/ quiet loglevel=0 vt.global_cursor_default=0 logo.nologo/' /boot/firmware/cmdline.txt
```

Disable the system swap if your model has a fast SD card — it prevents
swap-thrash freezes under memory pressure:

```bash
sudo dphys-swapfile swapoff
sudo systemctl disable dphys-swapfile
```

## 9. GPIO buttons (optional)

Wire each button between the GPIO pin and **GND**. The sidecar uses `onoff`
with internal pull-up + falling-edge interrupts.

Default pinout (BCM numbering, change in `config.json`):

| Button | Pin | URL event |
|---|---|---|
| Tab → next | 17 | `tab-next` |
| Tab → prev | 27 | `tab-prev` |
| Select / OK | 22 | `select` |
| Back | 23 | `back` |

The `pi` user is added to the `gpio` group by `pipboy-sidecar.service`
(`SupplementaryGroups=gpio`). If the service warns that `onoff` is missing,
re-run `pnpm install` on the Pi (Node must rebuild the native bits on ARM).

## 10. Lighter-weight alternative (optional)

If you want to reclaim ~80 MB RAM on the Pi 3B, swap Chromium for **cog**
(WPE WebKit kiosk browser):

```bash
sudo apt install -y cog
```

Replace the `ExecStart` line in `pipboy-ui.service` with:

```
ExecStart=/usr/bin/cog --platform=drm --fullscreen "http://localhost:8080/?$(node /opt/pipboy/PipBoy-OS/deploy/config-to-args.js)"
```

Caveats: no DevTools, less ergonomic to debug, some CSS edge cases differ.

## 11. Updating

```bash
cd /opt/pipboy/PipBoy-OS
git pull
pnpm install
pnpm build
sudo systemctl restart pipboy-sidecar pipboy-ui
```

## Troubleshooting

- **`drmSetMaster failed: Permission denied` / `AddScreen/ScreenInit failed`**:
  `/etc/X11/Xwrapper.config` is missing or incorrect — follow §5.
- **Black screen on boot**: `journalctl -u pipboy-ui -e` — usually missing
  `xserver-xorg` or wrong TTY.
- **`/api/system` returns nulls**: that's expected on macOS dev. On Pi, check
  `vcgencmd` and `iwgetid` exist (`apt install libraspberrypi-bin wireless-tools`).
- **GPIO doesn't fire**: confirm `pi` is in the `gpio` group (`groups pi`) and
  pin numbers in `config.json` match BCM (not physical) numbering.
- **Chromium asks to restore session**: already disabled via flags; if it
  persists, delete `~/.config/chromium/Singleton*`.
