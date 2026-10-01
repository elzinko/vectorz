---
id: "20260906135450000"
title: "Recette : lancer l'émulateur Android pour tester sur mobile"
type: feature
priority: P3
product: vectorz
version: V0.2
epic:
depends: []
labels: [test-local]
status: shipped
pr: "#276"
created: 2026-09-06
---

## En clair

Une **recette** dans `recipes/` (gardien `ezk-chef`) explique à tout agent **comment démarrer un
émulateur Android et lancer l'app dessus**. Elle est écrite et reste `draft` : elle donne la
commande qui marche sur ce Mac, celle de chaque stack (Capacitor, Expo) et le piège qui fait perdre
des tours (deux racines SDK). Seul le build d'app de bout en bout n'est pas rejoué. Elle pose
surtout un réflexe : **avant de déclarer un test sur appareil impossible, vérifier qu'un émulateur
est démarrable.** `ezk-scout` la lit désormais avant de classer un chemin mobile « non sondé ».

## Contexte / Problème

Sur **lmnpz** (2026-09-05), un agent a **sauté** un test sur appareil en croyant l'émulateur
indisponible, alors qu'il est démarrable et qu'il l'avait lui-même démarré plus tôt. Il manquait
une recette réutilisable avec la commande et les pièges.

## Ce qui a été vérifié, et ce qui ne l'a pas été

| Élément | Statut |
|---|---|
| Démarrage de l'AVD `livestreamz-test` avec l'`emulator` de la racine qui a les images système | **rejoué le 2026-10-01** : `sys.boot_completed=1` en une quinzaine de secondes, Android 34, `arm64-v8a`, arrêt par `adb emu kill` |
| Piège des deux racines SDK : l'`emulator` d'Android Studio, sans variable | **rejoué** : s'arrête sur « Cannot find AVD system path. Please define ANDROID_SDK_ROOT » |
| Capacitor (muti) : `dev:android` = `build:web` puis `cap sync android` puis `cap run android` | **lu** dans `apps/mobile/package.json:21`, non rejoué |
| Expo (lmnpz) : `expo run:android` | **lu** dans `apps/mobile/package.json:8`, non rejoué |
| Pièges Gradle, Metro, worktree neuf, quoting `adb shell` | repris du retour d'expérience de lmnpz (banc local), non rejoués |

## Critères d'acceptation

- [x] `recipes/emulateur-android-test-device.md` existe, au gabarit (front-matter valide, schéma texte, fichiers de référence) et figure dans `recipes/RECIPES.md`.
- [x] La commande de démarrage de l'émulateur est donnée **et rejouée** (boot, attente de `sys.boot_completed`, arrêt).
- [x] Les pré-requis (image système, AVD) et le piège des deux racines SDK sont écrits **et vérifiés**.
- [x] La commande par stack est donnée : Capacitor (`dev:android`) et Expo (`expo run:android`).
- [x] Le **réflexe** « avant de déclarer un test device impossible… » est en tête de recette, et `ezk-scout` y renvoie.
- [ ] Le build d'app de bout en bout sur l'émulateur est rejoué : en « Suite » (la recette reste `draft` jusque-là).

## Comment vérifier

```
bash products/mega-city/bin/test-regen-recipes.sh      # le livre des recettes se régénère, la nouvelle ligne y est
pnpm --dir products/mega-city exec vitest run src/__tests__/ezk-scout-contract.test.ts   # le scout garde ses trois renvois honnêtes
/opt/homebrew/share/android-commandlinetools/emulator/emulator -list-avds              # doit lister livestreamz-test
```

Rejeu complet de la preuve de boot : lancer l'émulateur en arrière-plan avec
`-avd livestreamz-test -no-window -no-audio -no-snapshot`, répéter `adb shell getprop sys.boot_completed`
jusqu'à `1`, puis `adb emu kill`.

## Suite (hors de cette fiche)

- **Rejouer un build d'app** (`dev:android` sur muti ou `expo run:android` sur lmnpz) jusqu'à voir l'app dans l'émulateur : la recette passe alors `ready`.
- **Appel automatique** : que `ezk-scout` démarre l'émulateur lui-même (aujourd'hui il lit la recette, il ne la lance pas), et les captures d'écran (mécanisme parqué, fiche 20260812104022228).
- **Variante du lanceur universel** (`--as android`) pour lancer l'app sur l'émulateur avec la même commande que le web (fiche 20260917162000501).
- **iOS** (simulateur) : hors de cette fiche.

## Notes

Réalisée côté **vectorz** avec `ezk-chef` (la fabrique de recettes). Née d'un skip erroné sur lmnpz
(fiche 0032).

## Ce que ça veut dire pour toi

Un agent qui hésite à tester sur mobile a maintenant la commande sous la main, et le scout ne
saute plus le chemin mobile sans l'avoir essayée. Il reste à rejouer un vrai build d'app pour passer
la recette en `ready` (une session sur muti ou lmnpz).
