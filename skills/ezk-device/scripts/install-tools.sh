#!/usr/bin/env bash
# Install the host tools needed to test an Android app over Tailscale (macOS).
# Idempotent — skips what's already there. The phone side is manual (Play Store).
set -euo pipefail

echo "── Host tools (macOS / Homebrew) ──────────────────────────"
command -v brew >/dev/null 2>&1 || { echo "❌ Homebrew required first: https://brew.sh"; exit 1; }

if command -v tailscale >/dev/null 2>&1 || [ -x /Applications/Tailscale.app/Contents/MacOS/Tailscale ]; then
  echo "✓ Tailscale already installed"
else
  echo "→ installing Tailscale…"; brew install --cask tailscale
fi

if command -v adb >/dev/null 2>&1; then
  echo "✓ adb already installed"
else
  echo "→ installing Android platform-tools…"; brew install --cask android-platform-tools
fi

cat <<'EOF'

── On the phone (manual, one-time) ────────────────────────
1. Install Tailscale from the Play Store, sign in with the SAME account, toggle ON.
2. Enable developer options: Settings → About phone → tap "Build number" 7 times.
3. Settings → Developer options → enable "USB debugging" (for the one-time cable
   step) and "Wireless debugging".

Then verify everything with:  scripts/check-setup.sh
EOF
