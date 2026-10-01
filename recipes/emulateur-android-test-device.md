---
id: "20261001005135652"
title: Tester sur mobile Android — démarrer l'émulateur ou utiliser un appareil
makes: Un test sur appareil Android qui ne saute plus faute de savoir : l'émulateur démarre en une commande, l'app s'y lance selon la stack (Capacitor ou Expo)
source: ~/git/bacasable/muti
composes: []
status: draft # commandes rejouées le 2026-10-01 sur ce Mac (boot de l'émulateur, piège des deux racines) ; build d'app non rejoué ici
home: central
created: 2026-10-01
updated: 2026-10-01
---

## En clair

Sur lmnpz, un agent a sauté un test sur appareil en croyant l'émulateur indisponible. Il l'était
pourtant : l'émulateur se démarre en une commande. Cette recette donne cette commande, celle qui
lance l'app dessus selon la stack (Capacitor ou Expo), et les pièges qui font perdre des tours.
La règle à retenir : **avant de déclarer un test sur appareil impossible, vérifier qu'un émulateur
est démarrable.**

## Le réflexe (la règle)

Un test mobile n'est « impossible » qu'après ces trois contrôles, et le rapport dit lesquels ont
échoué et pourquoi :

1. `adb devices` — un appareil ou un émulateur est-il déjà là ?
2. `emulator -list-avds` (celui de la racine qui a les images, voir plus bas) — un AVD existe-t-il ?
3. Le démarrer et attendre `sys.boot_completed` (étape 3 ci-dessous).

## Ingrédients (prérequis)

- Une **image système** Android arm64 (ici : API 34, `google_apis`), installée dans une racine SDK.
- Un **AVD** (appareil virtuel). Ici : `livestreamz-test` (Pixel 6, API 34), rangé dans `~/.android/avd`
  et visible depuis toutes les racines SDK.
- JDK 17, Node, pnpm. Pour un build debug Expo : Metro (voir étape 5).

## Ustensiles (outils — CLI d'abord)

`adb`, `emulator`, `avdmanager`, `sdkmanager` (Homebrew : `android-commandlinetools`), puis la CLI de
la stack : `cap` (Capacitor) ou `expo`. Le téléphone physique relève du skill `ezk-device`.

## Préliminaires (gestes manuels ⚙️)

⚙️ Aucun si `emulator -list-avds` répond. Sinon, créer l'AVD une fois, avec `avdmanager create avd`
sur l'image `system-images;android-34;google_apis;arm64-v8a` (commande documentée par Google, non
rejouée ici puisque l'AVD existe).

## Le concept (mécanisme + schéma)

Le piège central : **il y a deux racines SDK sur ce Mac, et une seule a les images système.** Le
binaire `emulator` cherche ses images à côté de lui. Lancé depuis la mauvaise racine, il s'arrête
net, alors que l'image est bien installée ailleurs.

| Racine | Contient | Ne contient pas |
|---|---|---|
| `~/Library/Android/sdk` (Android Studio) | platforms, build-tools, `emulator` | **les images système** |
| `/opt/homebrew/share/android-commandlinetools` (brew) | `adb`, `emulator`, cmdline-tools, **`system-images/android-34/google_apis/arm64-v8a`** | — |

Ailleurs (Mac Intel, Linux, autre AVD), les chemins et l'ABI changent (image `x86_64` au lieu
d'`arm64-v8a`) mais la règle reste la même : **prendre l'`emulator` de la racine qui contient
`system-images/`**. Non vérifié hors de ce Mac : adapter les noms, pas la règle.

```
 test mobile demandé
   │ adb devices ── appareil ou émulateur déjà là ? ── oui ──────────────┐
   ▼ non                                                                │
 emulator -list-avds ── vide ? ── oui → créer l'AVD (préliminaire)      │
   ▼                                                                    │
 démarrer l'AVD avec l'emulator de la racine QUI A LES IMAGES           │
   ▼                                                                    │
 attendre  adb shell getprop sys.boot_completed  = 1                    │
   ▼                                                                    ▼
 lancer l'app :  Capacitor → cap run android   |   Expo → expo run:android
```

## Exemples pour goûter (référence)

- **muti (Capacitor)** : `pnpm --filter @muti/mobile run dev:android` fait `build:web`, puis
  `cap sync android`, puis `cap run android` (choisit l'émulateur ou l'appareil branché).
- **lmnpz (Expo / React Native)** : démarrer l'AVD, puis, depuis `apps/mobile`, `pnpm run android`
  (le script `android` vaut `expo run:android`).
- **Rejoué le 2026-10-01** : émulateur 36.6 de la racine brew, `-no-window -no-audio -no-snapshot`,
  AVD `livestreamz-test` → `sys.boot_completed=1` en une quinzaine de secondes, Android 34, `arm64-v8a`.
  Le même AVD lancé avec l'`emulator` d'Android Studio, sans variable, s'arrête sur
  `FATAL | Cannot find AVD system path. Please define ANDROID_SDK_ROOT`.

## Les étapes (playbook)

1. **Réflexe** : `adb devices`. Une ligne `… device` suffit : passer à l'étape 5.
2. **Trouver la racine qui a les images, puis lister les AVD.** Pour chaque racine SDK connue,
   `ls -d <racine>/system-images` : celle qui répond est la bonne (ici
   `SDK=/opt/homebrew/share/android-commandlinetools`). Puis `"$SDK/emulator/emulator" -list-avds`
   (ici : `livestreamz-test`). Liste vide : voir « Préliminaires ».
3. **Démarrer** l'AVD trouvé, en arrière-plan, avec l'`emulator` de cette racine :
   `"$SDK/emulator/emulator" -avd <AVD> -no-snapshot -no-boot-anim` (ajouter `-no-window -no-audio`
   pour un agent ou une CI). Si on préfère l'`emulator` d'Android Studio, **exporter
   `ANDROID_SDK_ROOT="$SDK"`** d'abord.
4. **Attendre le boot** : `adb wait-for-device`, puis répéter `adb shell getprop sys.boot_completed`
   jusqu'à `1`. Ne pas lancer l'app avant.
5. **Lancer l'app** selon la stack :
   - Capacitor : `pnpm --filter @muti/mobile run dev:android`.
   - Expo : `pnpm run android` depuis `apps/mobile` (= `expo run:android`). Pour un build **debug**, Metro doit tourner :
     `npx expo start --dev-client`, puis `adb reverse tcp:8081 tcp:8081`.
6. **Éteindre** : `adb emu kill` (tue l'émulateur, pas les autres appareils).

## Checklist « rien d'oublié »

- [ ] Le rapport dit si `adb devices`, `-list-avds` et le boot ont été essayés avant tout « impossible »
- [ ] L'émulateur vient de la racine qui a `system-images` (sinon `ANDROID_SDK_ROOT` exporté)
- [ ] `sys.boot_completed` vaut `1` avant de lancer l'app
- [ ] Gradle voit le bon SDK : `ANDROID_HOME=~/Library/Android/sdk` ou `sdk.dir=` dans `android/local.properties`
- [ ] Worktree neuf : `node_modules` installé, dossier `android/` généré (`expo prebuild --platform android --no-install`
      depuis `apps/mobile`, ou `cap sync android`) — ils ne suivent pas d'un worktree à l'autre
- [ ] `adb shell` : la commande distante est entre guillemets, sinon le shell local la coupe en mots
- [ ] Lien lent : `-Dorg.gradle.internal.http.socketTimeout=180000 -Dorg.gradle.internal.http.connectionTimeout=180000`
      (aussi dans `GRADLE_OPTS`) quand `dl.google.com` ou Maven expirent
- [ ] `BUILD SUCCESSFUL` ne prouve pas que la brique native est dans l'APK : vérifier le manifest fusionné
- [ ] Arrêter l'émulateur en fin de test (`adb emu kill`)

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : **`~/git/bacasable/muti`**

- `apps/mobile/package.json:21` — `dev:android` (build web, `cap sync android`, `cap run android`)

Seconde racine : **`~/git/immo/lmnpz`**

- `apps/mobile/package.json:8` — `android` = `expo run:android`

Sur la machine : `/opt/homebrew/share/android-commandlinetools/emulator/emulator` (l'`emulator` qui trouve
ses images) et le dossier `~/.android/avd/` (les AVD, partagés par toutes les racines SDK).

## Statut de cette recette

Capturée le 2026-10-01 depuis la fiche `20260906135450000`, née d'un skip erroné sur lmnpz (fiche 0032).
Les commandes de boot et le piège des deux racines ont été **rejoués sur ce Mac** ; les commandes de
build d'app (`dev:android`, `expo run:android`) sont lues dans les `package.json` des deux projets et
**n'ont pas été rejouées** ici. Les autres pièges de la checklist (Gradle, Metro, worktree neuf,
quoting d'`adb shell`) sont le retour d'expérience des sprints lmnpz, eux aussi non rejoués : la
recette reste `draft` jusqu'à un test complet. Hors périmètre :
le téléphone physique (skill `ezk-device`), les captures d'écran (mécanisme parqué) et l'appel
automatique par `ezk-scout` (il lit la recette, il ne la lance pas encore).
