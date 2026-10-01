---
id: "20260824141336516"
title: "Recette : mettre en place la CI d'un projet type muti"
type: feature
priority: P3
product: mega-city
version: V0.3
epic:
labels: [recettes]
depends: []
status: idea
pr:
created: 2026-08-24
---

## En clair

On veut une **recette réutilisable** pour **mettre en place la CI** d'un projet du
même type que muti : une **app desktop** + un **site web de vente**. Le but : qu'un
nouveau projet puisse **se construire sa CI à partir d'un exemple** (muti, assez
évolué), au lieu de tout recâbler à la main. La CI doit pouvoir **builder en local
avec `act`** et/ou **sur GitHub**.

C'est une **recette-contenu** (le « quoi installer »), sœur de la recette de
distribution (`vectorz/recipes/plan-distribution-app.md`). Née `idea` — on la
groome quand on la tire.

## Pourquoi

- Recâbler une CI complète (tests, build multi-OS, release, deploy site, nettoyage)
  à chaque projet est long et faillible. muti l'a déjà fait « bien » → en faire une
  **recette** capitalise ce travail.
- S'inscrit dans la **bibliothèque de recettes** vectorz et le futur mécanisme
  d'extraction (voir LIENS) : on pourra **tester la création** de cette recette
  avec la sous-commande `ezk-ezk extract`.

## Exemple de référence — muti (à reproduire / adapter)

CI muti (`~/git/bacasable/muti/.github/workflows/`) : `ci.yml` (tests) ·
`cd.yml` (build + release + deploy) · `deploy-website.yml` · `cleanup.yml`
(purge des vieux artefacts) · `smoke-test.yml` · `coming-soon.yml`.
**Point d'entrée local vérifié (2026-10-01).** Il n'y a pas de `Makefile`. Le build local passe par
`pnpm ci:local` (`package.json:47-50`). Cette commande lance `scripts/ci-local.sh`, une façade de
`act`, avec un mode natif quand Docker n'est pas là.

## Périmètre pressenti (à groomer, non figé)

- **CI (tests)** : lint + typecheck + tests, gate avant merge.
- **CD (build/release)** : build multi-OS de l'app desktop + publication des
  artefacts → **compose** avec la recette *distribution* (upload R2 + endpoint).
- **Deploy site** (Vercel) pour le web de vente.
- **Un même plan jouable en local (`act`) ET sur GitHub** (reproductibilité).
- **Nettoyage** des vieux artefacts (type `cleanup.yml`).

## Versionnement — probablement une recette composable À PART

Tu me demandais mon avis : le **versionnement** (source unique de version,
propagation dans les fichiers, tag → fichiers) est une **brique autonome** — elle
compose aussi bien avec la recette CI qu'avec la recette distribution. Je propose
de la **capturer à part** (recette « versionnement » composable) au grooming,
plutôt que de la noyer ici. Références : samplerz `scripts/release-set-version.sh`
+ `desktop-sync-manifest.sh` ; muti (script de version — à confirmer).

## Décisions de grooming (2026-10-01)

- **`act` : recommandé, pas obligatoire.** Les workflows GitHub restent la source de vérité. Le
  local est un accélérateur : `act` si Docker tourne, mode natif sinon. Le packaging multi-OS
  (macOS, Windows) ne se joue de toute façon pas sous `act`.
- **Périmètre : un socle et des options.** Le socle est la CI sur PR, le CD sur `main` et sur les
  tags, et le déploiement du site. Les options, activables par projet : nettoyage, smoke-test, page
  « coming soon ».
- **Versionnement : recette séparée**, composable avec celle-ci et avec la distribution. La recette
  CI se contente de la citer.
- **Smoke-test et coming-soon : options.** Chacune renvoie à son workflow muti.

## Périmètre de cette PR

Une recette `recipes/mettre-en-place-ci-projet-type-muti.md`, en `status: draft`. Elle **pointe**
la CI de muti (`source: ~/git/bacasable/muti`), elle ne la recopie pas (ADR-0013).

## Critères d'acceptation

- [x] la recette existe, son front-matter est valide, `status: draft`, et elle est listée dans `recipes/RECIPES.md` après `regen-recipes.sh` (1 ligne ajoutée, 13 recettes)
- [x] elle décrit le **socle** (CI sur PR, CD sur `main` et tags, déploiement du site) et les **options** (nettoyage, smoke-test, coming-soon), chacun relié à son workflow muti
- [x] elle répond aux quatre options tranchées ci-dessus
- [x] elle explique comment **rejouer le même plan en local** : `pnpm ci:local` (`act` ou mode natif), secrets locaux générés, lint des workflows, et ce qui ne se joue pas sous `act` (packaging multi-OS, tags de release)
- [x] la section « Fichiers de référence » porte des pointeurs `fichier:ligne` réels vers muti ; `source:` existe ; aucun code recopié (25 pointeurs sur 25 existent)
- [x] elle compose les recettes sœurs (`composes:` et liens) : distribution, domaine Vercel (les deux fichiers existent dans `recipes/`)
- [x] gate `ezk-chef` rejouée : `regen-recipes.sh` (+1 ligne), les 5 champs du front-matter, 25 pointeurs sur 25, aucun lien cassé de plus (7 hérités, voir Notes). Le jugement (zéro code recopié, deux SHOULD) est porté par la revue.

Preuves ajoutées : les affirmations de la recette sont relues dans le code de muti. Le job de preview a
un `timeout-minutes` de 5 (`ci.yml:171`). La matrice de packaging porte `fail-fast: false`
(`cd.yml:268`). Un tag de release part toujours en cloud, même avec `LOCAL_CI=true` (`cd.yml:44`).
Le smoke de l'app empaquetée fait échouer le job si l'app plante au démarrage (`cd.yml:364`).

## Comment vérifier

1. `bash products/mega-city/bin/regen-recipes.sh`, puis `git diff --stat -- recipes/RECIPES.md` :
   une seule ligne ajoutée, celle de la nouvelle recette.
2. `bash products/mega-city/bin/check-links.sh . recipes` ne signale aucun lien cassé dans les fichiers
   de cette PR. Il en reste 7 hérités dans d'autres recettes (voir Notes).
3. Chaque pointeur `fichier:ligne` de la recette existe dans le dépôt muti.
4. La gate `ezk-chef` rejouée rend GO.

## Suite (hors de cette PR)

- Recette « versionnement » séparée et composable : source unique de version, propagation dans les
  fichiers, du tag vers les fichiers. Références : `scripts/release-set-version.sh` et
  `desktop-sync-manifest.sh` côté samplerz, `scripts/bump-version.sh` côté muti.
- Rejouer la recette sur un 2ᵉ projet, puis la passer `ready` après `ezk-chef check`.

## Notes / décisions

- `recipes/` porte 7 liens cassés **hérités** : sept recettes pointent vers la fiche
  `20260824185422122`, déplacée dans `features/done/`. Hors périmètre de cette PR, signalé au PO.
- Ce que la recette ajoute à la fiche d'origine : l'interrupteur `LOCAL_CI` (`pnpm ci:mode`) et son
  exception pour les tags de release, que la fiche ne mentionnait pas.
- Les économies de minutes (`paths-ignore`, concurrence, `LOCAL_CI`) valent pour un dépôt **privé**.
  Sur un dépôt public, GitHub Actions est gratuit : la recette le dit.

## LIENS

- `20260824122629794_ezk-extract-capitaliser-feature-en-recette` — le **mécanisme**
  `ezk-ezk extract` qui génèrera/testera les recettes (cette fiche en est un cas de test).
- `vectorz/recipes/plan-distribution-app.md` — recette **sœur** (distribution / téléchargement).
- Exemple de référence : **muti** (`.github/workflows/`).
