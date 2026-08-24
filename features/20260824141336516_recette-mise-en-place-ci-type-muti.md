---
id: "20260824141336516"
title: Recette « mise en place de la CI » pour un projet type muti (app desktop + web de vente) — build local (act) et/ou GitHub
type: feature
priority: P2
product: mega-city
version:
epic:
depends: []
status: idea
ready:
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
⚠ Le **build local via `act`** est annoncé mais **à vérifier au grooming** (pas de
`Makefile` trouvé à la racine de muti — confirmer le point d'entrée `act`).

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

## Options à trancher (au grooming)

- `act` **obligatoire** (build local reproductible) ou GitHub seul suffit ?
- Périmètre : tout (tests + build + release + deploy + cleanup) ou un sous-ensemble
  activable par projet ?
- Versionnement **inclus** ici ou **recette séparée** composée (mon avis : séparée).
- Smoke-test / coming-soon : dans la recette de base ou en options ?

## LIENS

- `20260824122629794_ezk-extract-capitaliser-feature-en-recette` — le **mécanisme**
  `ezk-ezk extract` qui génèrera/testera les recettes (cette fiche en est un cas de test).
- `vectorz/recipes/plan-distribution-app.md` — recette **sœur** (distribution / téléchargement).
- Exemple de référence : **muti** (`.github/workflows/`).
