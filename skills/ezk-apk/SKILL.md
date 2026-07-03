---
name: ezk-apk
argument-hint: "[help|build|link|status|check|setup]"
description: >-
  Build an installable preview APK (or IPA) on Expo EAS and hand the user an
  install link + QR, to demo or try a mobile (Expo / React Native) PR on a real
  device — including over 4G, with no adb, USB, Tailscale or debugging. Use
  whenever the user wants to "share a build", "send me an APK", "test this PR on
  my phone", "install the app to try a feature", "give me a QR to install", or
  demo a mobile branch to a tester or stakeholder. Walks through the EXPO_TOKEN
  setup, the eas preview profile, building, and returning the install link.
  Crucially covers the pnpm-monorepo gotchas that break EAS release builds while
  leaving debug builds working (expo-asset, node-linker=hoisted, building
  workspace TS deps), and validating the release compile locally first to avoid
  burning EAS queue time.
---

# Build & share a preview APK for a mobile PR (Expo EAS)

## When to use this — distribution, not debugging
This produces an **installable build** and gives the user a **link + QR**. It
installs over **4G** as a plain HTTPS download — no Wi-Fi, no adb, no USB, no
Tailscale, no device setup. Use it to **demo or test a PR's features** on a real
phone (great when the user is on the go, driving Claude from their phone).

If the user instead needs a **live debug session** (logcat, Metro hot-reload,
inspecting), that is the separate **`ezk-device`** skill (adb over
Tailscale, Wi-Fi-bound). Different goal — don't conflate them.

## Usage (sub-commands)

`/ezk-apk [sub-command] [args]` — or just ask in natural language ("send me an APK to test this PR").

| Sub-command | Effect |
|---|---|
| `help` (or `?`, or **bare** `/ezk-apk`) | Show this command table — do **not** start a build |
| `build` (**default** for a natural-language request) | Full flow: monorepo pre-flight → local release-compile check → EAS `preview` build → hand back the **install link + QR** |
| `link` / `last` | Return the install link + QR of the **latest finished** build, no rebuild (`eas build:list --json` → `applicationArchiveUrl`) |
| `status [id]` | Build status of the latest (or a given) build (`eas build:view <id>`) |
| `check` / `preflight` | pnpm-monorepo gotcha checks + local `./gradlew assembleRelease` **without** spending an EAS build |
| `setup` | Verify/establish `EXPO_TOKEN`, the `preview` profile in `eas.json`, the EAS project link |

> **Help**: invoked bare or with `help`/`?`, render this table first and do **not** trigger a build (it costs EAS queue time). A natural-language ask runs `build`. Anything unrecognized → handle in prose; the skill stays usable conversationally.

## Prerequisites — state them, get the token
- An **Expo account** + an **`EXPO_TOKEN`** (expo.dev → Account → Settings →
  Access Tokens). Pass it **inline** per command (`EXPO_TOKEN=… npx eas-cli …`);
  **never commit it** and don't echo it back in chat.
- **`eas.json`** with a **`preview`** profile = `distribution: internal`, Android
  `buildType: apk` (installable without the Play Store).
- Project linked to EAS — `app.json` has `extra.eas.projectId`. If not, run once:
  `EXPO_TOKEN=… npx eas-cli@latest init --force` (writes `projectId` + `owner`).
- eas-cli via `npx --yes eas-cli@latest` (no global install needed).

## ⚠️ pnpm monorepo gotchas — they break EAS *release* builds, not `expo run`/debug
This is the trap: `pnpm android` / the Metro dev server **hide** these; they only
bite in the **release** bundling + compile that EAS runs. If the project is a pnpm
monorepo, check/fix these BEFORE building (each cost us a failed ~15-min EAS run):

1. **Transitive deps that Metro loads must be DIRECT deps.** Most often
   **`expo-asset`** → `npx expo install expo-asset`. Symptom: `expo export:embed`
   fails with "the required package `expo-asset` cannot be found" in
   `metro.config.js` `getDefaultConfig`.
2. **Root `.npmrc` with `node-linker=hoisted`** (Expo's recommendation for pnpm).
   Without a flat node_modules, RN/Expo autolinking mis-resolves: the generated
   `PackageList.java` emits a stale `import expo.core.ExpoModulesPackage` (the real
   class is `expo.modules.ExpoModulesPackage`) and `:expo` fails to link → release
   Java/Kotlin compile fails (`Unresolved reference: expo`). After changing it,
   **clean Gradle**: `rm -rf android/.gradle android/build android/app/build`.
3. **Build `workspace:*` TS packages on EAS.** EAS clones the monorepo and runs
   `pnpm install` but does **not** build local workspace packages, so their `dist/`
   is missing and Metro can't resolve them (e.g. `@scope/shared/dist/index.js`).
   Add an **`eas-build-post-install`** script in the app's package.json, e.g.
   `"eas-build-post-install": "pnpm --filter @scope/shared build"`.

## Validate the release compile LOCALLY first (cheap — saves EAS queue time)
An EAS build can sit in the free-tier queue + run for 10-25 min before failing.
Before spending one, prove the release path compiles locally (bare project with an
`android/` dir):
```bash
cd <app>/android && ANDROID_HOME="$HOME/Library/Android/sdk" \
  ./gradlew assembleRelease --console=plain     # bundles JS + compiles native
# faster subset if you only changed JS/native: 
#   ./gradlew :app:compileReleaseKotlin :app:compileReleaseJavaWithJavac
```
A **red** here is a fast, free signal. Note: green locally ≠ green on EAS, because
EAS clones fresh — it also exposes gotcha #3 (workspace `dist/`), which a local
build hides (you already built `dist/`). So still expect to fix #3 for EAS.

## Build and hand over the link
```bash
EXPO_TOKEN=… bash scripts/build-preview-apk.sh            # android, preview profile
# or drive it yourself (recommended in an agent: launch, then poll):
EXPO_TOKEN=… npx eas-cli@latest build --profile preview --platform android \
  --non-interactive --no-wait                             # prints a build-page URL now
```
`--no-wait` returns immediately with a build page URL. Poll
`build:view <id> --json` **or** `build:list --json` (both need `app.json`
projectId) until `status: FINISHED`, then read `artifacts.applicationArchiveUrl`
— that is the **direct APK link**. Give the user:
- the **direct APK link** as a clickable markdown link (open on the phone →
  download → install; Android will ask to allow "install from this source"), and
- the **build page** (has an Install button + a QR), as a fallback.

## Install gotchas (Android) — warn the user up front
- **"App blocked / blocked to protect your device" (Play Protect)** on an
  unknown-source APK → tap **Install anyway**. Expected for internal-distribution
  builds (not from the Play Store); harmless here.
- **"App not installed" / the update fails** → **signature mismatch**: an app with
  the same `applicationId` signed by a *different* key is already installed (a
  `pnpm android` **debug** build, or an older APK). Android refuses to update
  across signatures → **uninstall the existing app first**, then install. It's a
  one-shot: later EAS builds update cleanly (EAS reuses the same keystore); the
  conflict only recurs if you mix a **dev/debug** build and an **EAS** build of the
  same id on the same device.

## Reference
- The first EAS build auto-generates the Android keystore (remote credentials) —
  no manual signing setup needed for internal distribution.
- Free tier = a shared build queue; 10-30 min waits are normal.
- `expo doctor` warnings (e.g. a package "should not be installed directly") are
  usually non-blocking — note them, don't let them stop the build.
- iOS: same flow with `--platform ios` + an internal-distribution profile (needs an
  Apple account / ad-hoc devices). For **JS-only** changes, mention **EAS Update**
  (OTA) as a lighter alternative — but native changes always need a fresh build.
