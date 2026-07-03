#!/usr/bin/env bash
# Connect adb to an Android phone over Tailscale — then it's ready for
# build/install (expo run:android, react-native run-android, gradlew installDebug).
#
# Prereq: adbd must listen on all interfaces, i.e. you ran enable-tcpip.sh once
# (`adb tcpip 5555`). The dynamic Android "Wireless debugging" port binds to
# Wi-Fi only and is NOT reachable over Tailscale — that's why we standardize on
# port 5555.
#
# Usage: connect.sh [device-name-or-ip] [port]    (defaults: auto-detect, 5555)
set -uo pipefail
PORT="${2:-5555}"
TS="$(command -v tailscale || echo /Applications/Tailscale.app/Contents/MacOS/Tailscale)"
ADB="$(command -v adb || echo /opt/homebrew/share/android-commandlinetools/platform-tools/adb)"
{ [ -x "$TS" ] && [ -x "$ADB" ]; } || { echo "❌ tailscale/adb missing — run scripts/check-setup.sh"; exit 1; }

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  TARGET="$("$TS" status 2>/dev/null | awk '$4=="android"{print $1; exit}')"
  [ -n "$TARGET" ] || { echo "❌ No Android peer on the tailnet. Turn Tailscale ON on the phone."; exit 1; }
  echo "📱 Auto-detected Android peer: $TARGET"
fi
case "$TARGET" in
  100.*) IP="$TARGET" ;;
  *)     IP="$("$TS" status 2>/dev/null | awk -v n="$TARGET" '$2==n{print $1; exit}')" ;;
esac
[ -n "${IP:-}" ] || { echo "❌ Could not resolve '$TARGET' to a tailnet IP (check 'tailscale status')."; exit 1; }

echo "🔌 adb connect $IP:$PORT ..."
"$ADB" connect "$IP:$PORT" 2>&1
sleep 1
if "$ADB" devices | grep -qE "$IP:$PORT[[:space:]]+device$"; then
  MAC_IP="$("$TS" ip -4 2>/dev/null | head -1)"
  echo "✅ Connected: $IP:$PORT"
  echo "🖥  App server host = ${MAC_IP:-the Mac tailnet IP}  (use the app manual-connection mode)"
  "$ADB" devices
else
  cat <<EOF
❌ Couldn't connect over Tailscale on port $PORT.
   adbd is probably not listening on all interfaces yet — fix it ONCE:
       plug the phone via USB → scripts/enable-tcpip.sh   (runs 'adb tcpip 5555')
   then unplug and re-run this script. (Android's Wireless-debugging port binds
   to Wi-Fi only, so it can't be reached through Tailscale.)
EOF
  exit 1
fi
