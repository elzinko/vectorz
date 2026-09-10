---
id: "20260906135450000"
title: "Recette — démarrer l'émulateur Android / tester sur device (pour que l'agent ne skippe plus)"
type: feature
priority: P2
product: vectorz
epic:
depends: []
labels: [recette, ezk-chef, android, testbed]
status: idea
ready:
pr:
created: 2026-09-06
---

## En clair

Ajouter une **recette** dans `recipes/` (gardien `ezk-chef`) qui explique à tout agent **comment démarrer un émulateur Android et tester sur device**, au lieu de renoncer à un test faute de savoir que c'est possible.

## Contexte / Problème

Sur le projet **lmnpz** (2026-09-05), un agent a **sauté** un test sur device en croyant l'émulateur indisponible — alors qu'il est démarrable, et qu'il l'avait lui-même démarré plus tôt dans le projet. Il manque une **recette réutilisable** capturant la commande et les pièges, pour que ce skip ne se reproduise pas.

## Matière à capitaliser (déjà fait ailleurs — à vérifier avant d'écrire)

- **muti** (Capacitor) : `pnpm --filter @muti/mobile run dev:android` (⇒ `cap run android`) build + lance sur émulateur/device.
- **lmnpz** (Expo / React Native) : démarrer l'AVD puis `expo run:android`. Pièges constatés (mémoire projet lmnpz « banc-android-local ») : **double racine SDK** — `~/Library/Android/sdk` (sans system-images) vs `/opt/homebrew/share/android-commandlinetools` (qui les a) → `ANDROID_SDK_ROOT` doit pointer la bonne ; AVD `livestreamz-test` ; attendre `sys.boot_completed`.

## Livrable (la recette)

`recipes/emulateur-android-test-device.md` : la commande selon la stack (Capacitor `cap run android` / Expo `expo run:android` + démarrage AVD), les pré-requis (SDK, AVD), les pièges (racine SDK), et surtout le **réflexe** : « avant de déclarer un test device impossible, vérifier qu'un émulateur est démarrable ».

## Notes

À réaliser côté **vectorz** avec `ezk-chef` (la fabrique de recettes). Née d'un skip erroné sur lmnpz (fiche 0032). Vérifier le projet **muti** pour la commande exacte (Capacitor) et transposer pour Expo (lmnpz).
