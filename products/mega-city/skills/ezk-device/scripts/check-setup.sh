#!/usr/bin/env bash
# Diagnose the setup for testing an Android app remotely over Tailscale.
# Read-only — it checks each prerequisite and tells you exactly what to fix.
set -uo pipefail

ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
ko()   { printf "  \033[31m✗\033[0m %s\n" "$1"; }
info() { printf "  \033[33m•\033[0m %s\n" "$1"; }

TS="$(command -v tailscale || echo /Applications/Tailscale.app/Contents/MacOS/Tailscale)"
ADB="$(command -v adb || echo /opt/homebrew/share/android-commandlinetools/platform-tools/adb)"
problems=0

echo "── Tailscale ──────────────────────────────────────────────"
if [ -x "$TS" ]; then
  ok "CLI present ($TS)"
  # `tailscale status` exits 0 even when stopped, so inspect the output.
  TS_OUT="$("$TS" status 2>&1)"
  if echo "$TS_OUT" | grep -qiE "stopped|logged out|no state"; then
    ko "installed but not running — open the app or run 'tailscale up'"; problems=$((problems+1))
  elif echo "$TS_OUT" | grep -qE "^100\."; then
    ok "running"
    MAC_IP="$("$TS" ip -4 2>/dev/null | head -1)"
    info "this machine's tailnet IP: ${MAC_IP:-?}  ← the app's server host"
    # MagicDNS hijacks the system resolver and breaks Claude / browsers — warn loudly.
    if "$TS" debug prefs 2>/dev/null | grep -q '"CorpDNS": true'; then
      ko "Tailscale DNS (MagicDNS) is ON → it breaks system DNS / Claude. Fix: tailscale set --accept-dns=false"; problems=$((problems+1))
    else
      ok "Tailscale DNS off (system resolver preserved)"
    fi
    PHONE="$(echo "$TS_OUT" | awk '$4=="android"{print $2" ("$1")"; exit}')"
    if [ -n "$PHONE" ]; then ok "Android peer on the tailnet: $PHONE"
    else ko "no Android device on the tailnet — turn Tailscale ON on the phone (same account)"; problems=$((problems+1)); fi
  else
    ko "unexpected Tailscale state — check 'tailscale status'"; problems=$((problems+1))
  fi
else
  ko "not installed — run scripts/install-tools.sh"; problems=$((problems+1))
fi

echo ""
echo "── adb (Android platform-tools) ───────────────────────────"
if [ -x "$ADB" ]; then
  ok "present ($("$ADB" version 2>/dev/null | awk '/Version/{print $2; exit}'))"
  CONN="$("$ADB" devices 2>/dev/null | awk 'NR>1 && $2=="device"{printf "%s ", $1}')"
  if [ -n "$CONN" ]; then ok "device(s) connected: $CONN"
  else info "no device connected yet — scripts/enable-tcpip.sh then scripts/connect.sh"; fi
else
  ko "not installed — run scripts/install-tools.sh"; problems=$((problems+1))
fi

echo ""
if [ "$problems" -eq 0 ]; then
  echo "✅ Setup looks good. Next: scripts/connect.sh, then build/install your app."
else
  echo "⚠️  $problems thing(s) to fix above, then re-run this script."
fi
