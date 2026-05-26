#!/usr/bin/env bash
# Launches Chromium in kiosk mode pointing at the PipBoy sidecar.
# Merges config.json (ui section) → URL args, then appends extra args
# passed on the CLI as ?key=value pairs (so the CLI wins).
#
# Usage:
#   start-kiosk.sh                           # use config.json only
#   start-kiosk.sh --mode=demo --theme=amber # override at launch
#   start-kiosk.sh --screen=DATA --lock=true # kiosk pinned to DATA

set -euo pipefail

REPO_ROOT="${PIPBOY_ROOT:-/opt/pipboy}"
SIDECAR_URL="${PIPBOY_URL:-http://localhost:8080}"

# Stop the screen from blanking / cursor from showing.
if command -v xset >/dev/null 2>&1; then
  xset -dpms || true
  xset s off || true
  xset s noblank || true
fi
if command -v unclutter >/dev/null 2>&1; then
  unclutter -idle 0 -root &
fi
if command -v matchbox-window-manager >/dev/null 2>&1; then
  matchbox-window-manager -use_titlebar no -use_cursor no &
fi

# Build query string from config.json.
CONFIG_ARGS="$(node "$REPO_ROOT/deploy/config-to-args.js" 2>/dev/null || echo "")"

# Append CLI overrides. Each --foo=bar → foo=bar
CLI_ARGS=""
for arg in "$@"; do
  case "$arg" in
    --*=*)
      key="${arg%%=*}"; key="${key#--}"
      val="${arg#*=}"
      [ -n "$CLI_ARGS" ] && CLI_ARGS="${CLI_ARGS}&"
      CLI_ARGS="${CLI_ARGS}${key}=${val}"
      ;;
    --no-scanlines)
      [ -n "$CLI_ARGS" ] && CLI_ARGS="${CLI_ARGS}&"
      CLI_ARGS="${CLI_ARGS}no-scanlines=true"
      ;;
  esac
done

QS=""
[ -n "$CONFIG_ARGS" ] && QS="$CONFIG_ARGS"
[ -n "$CLI_ARGS" ] && QS="${QS:+${QS}&}${CLI_ARGS}"
URL="${SIDECAR_URL}/${QS:+?$QS}"

# Pick the first chromium binary available.
CHROMIUM="$(command -v chromium-browser || command -v chromium || true)"
if [ -z "$CHROMIUM" ]; then
  echo "chromium-browser not found" >&2
  exit 1
fi

exec "$CHROMIUM" \
  --kiosk \
  --noerrdialogs \
  --disable-translate \
  --disable-features=TranslateUI,Translate \
  --disable-infobars \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --check-for-update-interval=31536000 \
  --no-first-run \
  --password-store=basic \
  --autoplay-policy=no-user-gesture-required \
  --disable-restore-session-state \
  --disable-session-crashed-bubble \
  --enable-features=OverlayScrollbar \
  "$URL"
