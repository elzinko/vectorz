---
name: ezk-device
argument-hint: "[help|check|setup|tcpip|connect|run]"
description: >-
  Build, install and live-test an Android app on a PHYSICAL phone that is NOT on
  the same Wi-Fi/LAN as the computer, by tunnelling adb over a Tailscale mesh
  VPN. Use this whenever the user wants to run, install, deploy, sideload or test
  an Android app on a real device remotely — e.g. "test the app on my phone",
  "I'm away from my desk / travelling and want to try the build", "adb won't
  connect over the network", "install the APK on my Android over 4G", "debug on
  my phone from here" — or any time the phone and the dev machine are on
  different networks. Walks the user through installing the tools (Tailscale,
  adb), enabling Android wireless/USB debugging, finding the IP/port/code on the
  phone, and connecting reliably. Also covers the LAN-only WebRTC caveat (why a
  public tunnel like ngrok is NOT enough and a mesh VPN is the right tool).
---

# Test an Android app on a remote physical device (via Tailscale)

## Usage (sub-commands)

`/ezk-device [sub-command] [args]` — or just ask in natural language ("test the app on my phone").

| Sub-command | Effect |
|---|---|
| `help` (or `?`, or **bare** `/ezk-device`) | Show this command table — don't touch adb |
| `check` / `doctor` | Read-only diagnostic (`check-setup.sh`): Tailscale up, phone on the tailnet, adb present, DNS-hijack check |
| `setup` / `tools` | Install the Mac-side tools (`install-tools.sh`: Tailscale + adb) and print the phone-side steps |
| `tcpip` / `enable` | One-time, USB cable: `enable-tcpip.sh` runs `adb tcpip 5555` so adb is reachable over Tailscale forever after |
| `connect` | `connect.sh` — auto-detect the Android peer and `adb connect <100.x>:5555`; prints the Mac's Tailscale IP |
| `run` / `deploy` (**default** for a natural-language request) | Happy path `deploy-and-launch.sh`: Tailscale up → adb connect → build + install → launch via deep link |

> **Help**: invoked bare or with `help`/`?`, render this table — don't touch adb. A natural-language ask runs `run`, but **state the manual prerequisites first** (Tailscale ON + DNS off on the phone, `tcpip` armed once over USB). Anything unrecognized → handle in prose; the skill stays usable conversationally.

## ⚠️ Manual prerequisites — ALWAYS tell the user these FIRST
Before doing anything, state what the human must install/enable by hand, and
confirm the **DNS caveat** — skipping it hijacks the system DNS and breaks Claude
Code, browsers, everything. Required on **both** the Mac and the phone:

- **Tailscale installed and ON** on the Mac **and** the Android phone (same account).
- **Tailscale DNS turned OFF on both** (otherwise MagicDNS hijacks all DNS):
  - Mac: `tailscale set --accept-dns=false`
  - Android: Tailscale app → disable **"Use Tailscale DNS"** (and avoid the "always-on VPN" mode).
- **adb-over-Tailscale ready**: USB debugging on + `adb tcpip 5555` run **once** via a
  USB **data** cable (see `enable-tcpip.sh`). Wireless forever after.

`check-setup.sh` verifies all of this (including the DNS hijack). The phone's
Tailscale toggle is the one thing that can't be automated — **ask the user to
confirm Tailscale is ON on the phone (DNS off)**, then proceed.

## Scope — debugging vs feature-testing (decide before using adb)
adb-over-Tailscale here is for **live debugging** (logs, hot-reload, sideloading a
dev/test build). Two hard limits, state them up front:
- **Android Wireless debugging is bound to Wi-Fi.** The phone must be on *some*
  Wi-Fi (any network — a hotspot, hotel, a friend's); Tailscale then bridges it to
  the Mac across networks. **Pure 4G (Wi-Fi off) does NOT work** unless
  `adb tcpip 5555` was armed once over USB (that detaches adbd from Wi-Fi). iOS has
  no adb — use Xcode's *Connect via network* (pair once over USB) instead.
- **Only want to test features (not debug) remotely / on 4G?** Don't use adb at
  all — ship an **installable build**: Expo EAS `--profile preview` → install
  link/QR, installs over 4G as a plain HTTPS download. Simpler and not Wi-Fi-bound.
  Use this skill only when you genuinely need a live debug/dev session.

## Why this exists
`adb` and most "connect to my dev server" flows assume the phone and computer
are on the **same LAN**. When they're not (travelling, phone on 4G, different
Wi-Fi), the phone's IP isn't routable and nothing connects. A **public tunnel**
(ngrok, cloudflared) exposes one TCP/HTTP service but can't carry `adb` nor a
peer-to-peer media protocol like WebRTC. **Tailscale** puts both devices on a
private mesh network with stable `100.x` IPs routable everywhere — `adb` and even
LAN-only apps then behave as if both were on the same Wi-Fi, with no public
exposure and no STUN/TURN.

## Operate it like this
The scripts are the source of truth; drive the user through them in order. Adapt
paths if the user vendored the skill into a repo.

**Happy path — one command** (after `enable-tcpip.sh` was run once via USB):
```bash
bash scripts/deploy-and-launch.sh [port] [room]
```
Brings Tailscale up (auto-stops after 5 min), connects adb, builds + installs,
then **launches the app pre-configured via a deep link** (`scheme://host:port/room`)
so the human **never types an IP**. Requires the app to handle that deep link
(Expo: a `scheme` in app.json + a `Linking.getInitialURL()` handler that routes
to the stream screen). The steps below are the manual breakdown.

### 1. Install tools & verify
```bash
bash scripts/install-tools.sh   # Tailscale + adb on the Mac; prints the phone-side steps
bash scripts/check-setup.sh     # read-only diagnostic — what's OK, what to fix
```
`check-setup.sh` confirms Tailscale is up, the phone is on the tailnet, and adb
is present. Re-run it whenever something looks off — prefer it over guessing.

### 2. Make adb reachable over Tailscale (one-time, USB cable)
This is the **reliable** path and the one to recommend by default:
```bash
# phone plugged in via USB, "USB debugging" on, accept the authorization popup
bash scripts/enable-tcpip.sh    # runs `adb tcpip 5555`
```
**Why USB-once:** Android's *Wireless debugging* service binds to the Wi-Fi
interface, so connecting to it over the Tailscale IP fails with
`Connection refused`; its port + 6-digit code are dynamic and expire fast; and
on macOS adb's Openscreen mDNS backend frequently can't even discover it
(`protocol fault`). `adb tcpip 5555` makes adbd listen on `0.0.0.0:5555` —
reachable over Wi-Fi **and** Tailscale — once and for all. Unplug after.

*No data cable available?* Fall back to wireless pairing — but expect friction.
See `references/android-wireless-debugging.md` for exactly where the IP, port and
pairing code live on the phone, and the `ADB_MDNS_OPENSCREEN=0` workaround. The
human must read the 6-digit code off the screen; you can't.

### 3. Connect over Tailscale
```bash
bash scripts/connect.sh         # auto-detects the Android peer, adb connect <100.x>:5555
```
It prints the **Mac's Tailscale IP** — that's the host the app must point at.

### 4. Build & install
Detect the project's build command and run it once adb shows the device:
- Expo: `npx expo run:android` (or a wrapper like `pnpm android`)
- Bare RN: `npx react-native run-android`
- Gradle: `./gradlew installDebug`

The build runs on the Mac; install, Metro (`adb reverse tcp:8081 tcp:8081`) and
`adb logcat` all flow to the phone over Tailscale.

### 5. Point the app at the computer
If the app talks to a server on the Mac (dev API, WebSocket, signaling…), set its
host to the **Mac's Tailscale IP** (`tailscale ip -4`), not `localhost`/the LAN
IP — via the app's manual-host field, an env var, or a QR/deep-link. For
**WebRTC** apps with empty `iceServers` (LAN-only), the Tailscale `100.x` host
candidates make the peer connection succeed **without** a TURN server — the whole
reason a mesh VPN beats a public tunnel here.

## Cable gotcha (very common)
If `adb devices` shows nothing AND
`system_profiler SPUSBDataType | grep -iE 'android|oneplus|samsung|pixel'` shows
nothing → the cable is **charge-only** (power but no data). Swap to a real data
cable (ideally the phone's original). "Detected but `unauthorized`" instead means
the cable is fine — just accept the popup on the phone.

## Reference
- `references/android-wireless-debugging.md` — enabling developer options, and
  exactly where the connection IP/port and the pairing port + 6-digit code are on
  the phone (with OEM label variants), plus why USB-once is preferred.
