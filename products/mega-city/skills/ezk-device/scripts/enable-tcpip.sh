#!/usr/bin/env bash
# ONE-TIME: with the phone plugged in via USB, switch adbd to TCP mode on port
# 5555 so it listens on ALL interfaces (Wi-Fi + Tailscale). After this you can
# unplug the cable and use scripts/connect.sh over Tailscale, forever.
#
# Why this is needed: Android's "Wireless debugging" service binds to the Wi-Fi
# interface only, so connecting to it over the Tailscale IP gives "Connection
# refused". `adb tcpip 5555` makes adbd listen on 0.0.0.0:5555 → reachable via
# the Tailscale interface too.
set -uo pipefail
ADB="$(command -v adb || echo /opt/homebrew/share/android-commandlinetools/platform-tools/adb)"
[ -x "$ADB" ] || { echo "❌ adb missing — run scripts/install-tools.sh"; exit 1; }

echo "Plug the phone via USB and accept the 'Allow USB debugging' prompt…"
"$ADB" reconnect offline >/dev/null 2>&1 || true
sleep 2

USB="$("$ADB" devices | awk 'NR>1 && $2=="device" && $1 !~ /:/{print $1; exit}')"
if [ -z "$USB" ]; then
  UNAUTH="$("$ADB" devices | awk 'NR>1 && $2=="unauthorized"{print $1; exit}')"
  if [ -n "$UNAUTH" ]; then
    echo "⚠️  Device detected but UNAUTHORIZED → accept the popup on the phone (tick 'Always allow'), then re-run."
  else
    cat <<EOF
❌ No USB device detected at all. Most likely a CHARGE-ONLY cable.
   Quick check (should list your phone if the cable carries data):
       system_profiler SPUSBDataType | grep -iE 'android|oneplus|samsung|pixel'
   • Use a real DATA cable (ideally the phone's original one).
   • Also confirm "USB debugging" is enabled in Developer options.
EOF
  fi
  exit 1
fi

echo "→ adb tcpip 5555  (device $USB)"
"$ADB" -s "$USB" tcpip 5555 2>&1
echo "✅ Done. Unplug the USB cable, then run:  scripts/connect.sh"
