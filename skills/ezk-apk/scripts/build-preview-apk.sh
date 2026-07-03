#!/usr/bin/env bash
# Build an installable preview APK on Expo EAS and print the direct install link,
# to demo/try a mobile PR on a real device (installs over 4G — no adb/debugging).
#
# Usage: EXPO_TOKEN=… bash build-preview-apk.sh [profile] [platform]
#   profile    EAS build profile          (default: preview)
#   platform   android | ios              (default: android)
#
# Requires: EXPO_TOKEN set; eas.json has the profile (internal / apk); app.json
# has the EAS projectId (run `eas init --force` once). Run from the app directory.
set -uo pipefail
PROFILE="${1:-preview}"; PLATFORM="${2:-android}"
EAS=(npx --yes eas-cli@latest)

[ -n "${EXPO_TOKEN:-}" ] || { echo "❌ Set EXPO_TOKEN (expo.dev → Account → Settings → Access Tokens)"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ node is required (for JSON parsing)"; exit 1; }

echo "▶ launching EAS build ($PROFILE / $PLATFORM)…"
OUT="$("${EAS[@]}" build --profile "$PROFILE" --platform "$PLATFORM" --non-interactive --no-wait 2>&1)"
echo "$OUT"
BID="$(printf '%s\n' "$OUT" | grep -oiE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | tail -1)"
[ -n "$BID" ] || { echo "❌ couldn't parse the build id from eas output"; exit 1; }

echo "⏳ polling build $BID — the free-tier queue can take 10-30 min…"
for i in $(seq 1 90); do
  J="$("${EAS[@]}" build:list --json --non-interactive --limit 5 2>/dev/null)"
  R="$(printf '%s' "$J" | BID="$BID" node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
      try{
        const a=JSON.parse(s), p=process.env.BID;
        const b=a.find(x=>String(x.id||"").startsWith(p) || p.startsWith(String(x.id||"").slice(0,8)));
        if(!b){console.log("PENDING");return;}
        console.log((b.status||"")+" "+((b.artifacts&&b.artifacts.applicationArchiveUrl)||""));
      }catch(e){console.log("ERR");}
    });')"
  STATUS="${R%% *}"; URL="${R#* }"
  echo "  [$i] $STATUS"
  case "$STATUS" in
    FINISHED)
      echo ""
      echo "✅ APK ready — give the user this direct install link (open it on the phone):"
      echo "   ${URL:-<see the build page on expo.dev>}"
      exit 0;;
    ERRORED|CANCELED)
      echo "❌ build $STATUS — open the build's logs on expo.dev to diagnose."
      echo "   On a pnpm monorepo this is usually a release-only gotcha (expo-asset /"
      echo "   node-linker=hoisted / unbuilt workspace dist) — see SKILL.md."
      exit 1;;
  esac
  sleep 45
done
echo "⌛ still building after ~67 min — check the build page on expo.dev."
exit 0
