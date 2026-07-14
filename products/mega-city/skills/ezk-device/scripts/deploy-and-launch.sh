#!/usr/bin/env bash
# ONE command for the "go test" workflow: bring Tailscale up (with auto-stop),
# connect adb over the tailnet, build + install the app, then LAUNCH IT
# PRE-CONFIGURED via a deep link — so the human never types an IP/port.
#
# Usage: deploy-and-launch.sh [port] [room]
#   port   server/signaling port the app should hit   (default 8080)
#   room   stream room id                              (default "dev")
#
# Env overrides:
#   SCHEME=livestreamz   PKG=com.anonymous.livestreamz   BUILD_CMD="pnpm android"
#   TAILSCALE_TIMEOUT=300 (seconds; 0 = leave Tailscale up)
#
# Prereq: adbd reachable over Tailscale (run enable-tcpip.sh once via USB), and
# the app must handle  SCHEME://host:port/roomId  as a deep link.
set -uo pipefail
PORT="${1:-8080}"; ROOM="${2:-dev}"
SCHEME="${SCHEME:-livestreamz}"; PKG="${PKG:-com.anonymous.livestreamz}"
BUILD_CMD="${BUILD_CMD:-pnpm android}"; TIMEOUT="${TAILSCALE_TIMEOUT:-300}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TS="$(command -v tailscale || echo /Applications/Tailscale.app/Contents/MacOS/Tailscale)"
ADB="$(command -v adb || echo /opt/homebrew/bin/adb)"

# 1. Tailscale up — remember whether WE started it, so we only auto-stop a
#    session this script opened (never disconnect one the user already had).
STARTED_TS=0
if "$TS" status 2>&1 | grep -qiE "stopped|logged out"; then
  echo "▶ Tailscale was down — starting…"
  "$TS" up >/dev/null 2>&1 || { echo "❌ 'tailscale up' failed (auth needed? open the app)"; exit 1; }
  STARTED_TS=1
fi
MAC_IP="$("$TS" ip -4 2>/dev/null | head -1)"
[ -n "$MAC_IP" ] || { echo "❌ no Tailscale IP for this Mac"; exit 1; }
echo "🖥  Mac tailnet IP: $MAC_IP"

# 2. adb over Tailscale ───────────────────────────────────────────────
bash "$HERE/connect.sh" >/dev/null || { echo "❌ adb connect failed — run enable-tcpip.sh once via USB."; exit 1; }

# 3. Build + install ──────────────────────────────────────────────────
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")"
MOBILE_DIR="$ROOT/packages/mobile"; [ -d "$MOBILE_DIR" ] || MOBILE_DIR="$PWD"
echo "🏗  build + install ($MOBILE_DIR)…"
( cd "$MOBILE_DIR" && eval "$BUILD_CMD" ) || { echo "❌ build/install failed"; exit 1; }

# 4. Launch PRE-CONFIGURED (no manual entry) ──────────────────────────
DEEPLINK="$SCHEME://$MAC_IP:$PORT/$ROOM"
echo "🚀 launching pre-configured: $DEEPLINK"
# `am start` frequently exits 0 even when the activity didn't start, so inspect
# its output rather than trust the exit code — otherwise a wrong PKG/scheme, a
# missing deep-link handler, or a dropped device would still report success.
LAUNCH_OUT="$("$ADB" shell am start -a android.intent.action.VIEW -d "$DEEPLINK" "$PKG" 2>&1)"
if printf '%s' "$LAUNCH_OUT" | grep -qiE "error|exception|unable|not found"; then
  echo "❌ deep-link launch failed:"; printf '%s\n' "$LAUNCH_OUT"
  echo "   check PKG=$PKG and that the app handles ${SCHEME}:// as a deep link."
  exit 1
fi
echo "✅ App is up, already pointed at $MAC_IP:$PORT (room $ROOM) — zero IP typed."

# 5. Auto-stop Tailscale — ONLY if we started it, and only now that the
#    build/install/launch has finished (never cut the tunnel mid-build).
if [ "$STARTED_TS" -eq 1 ] && [ "$TIMEOUT" -gt 0 ]; then
  ( sleep "$TIMEOUT"; "$TS" down >/dev/null 2>&1 ) >/dev/null 2>&1 &
  echo "⏲  Tailscale will auto-stop in ${TIMEOUT}s (we started it; TAILSCALE_TIMEOUT=0 to keep)."
elif [ "$STARTED_TS" -eq 0 ]; then
  echo "ℹ  Tailscale was already up — leaving it as you had it (not ours to stop)."
fi
