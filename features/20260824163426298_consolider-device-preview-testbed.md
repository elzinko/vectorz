---
id: "20260824163426298"
title: Consolider ezk-device + ezk-preview + ezk-testbed (0102) — nouvelle sémantique post-refactoring « map »
type: refactor # feature | bug | refactor | chore | epic
priority: P2 # P0 | P1 | P2 | P3 — PROVISOIRE, à confirmer au grooming
product: mega-city
epic:
status: idea # direction à groomer avec l'architecte
ready:
pr:
created: 2026-08-24
---

# 20260824163426298 — Consolider device + preview + testbed (sémantique « map »)

## En clair

Trois briques de la méthodo se recouvrent : `ezk-device` (tester sur un téléphone via adb),
`ezk-preview` (URL de démo d'une branche) et `ezk-testbed` (fiche 0102 — démarrer un env de test
isolé, Cible × Recette). Le PO veut les **rassembler en un sujet cohérent**, en respectant la
**nouvelle sémantique** de vectorz issue du grand refactoring (« map » & cie) et de la
restructuration de la méthodo scrum mega-city. C'est une **direction à groomer avec l'architecte**,
pas encore une fiche prête à tirer.

## Contexte / Problème

Demande PO (2026-08-24) : « ezk-device doit être mergé avec ezk-preview, en respectant la nouvelle
sémantique (règles) de vectorz après le grand refactoring (map…). Idem pour ezk-testbed. Il faut
revoir selon la restructuration en cours de la méthodo scrum mega-city. »

État constaté :
- **`ezk-preview`** (skill) : URL de démo partageable d'une branche/worktree (Vercel / Cloudflare /
  Tailscale). Son « cas B » commence par « lance l'app, devine le port » — précisément le trou que
  0102 doit combler.
- **`ezk-device`** (skill) : tester sur un téléphone physique via adb (aujourd'hui hors scope
  `ezk-preview`).
- **`ezk-testbed`** (fiche [0102](0102-ezk-testbed-brique-boot-env-test.md), P1, **blocked**) : LA
  brique « démarrer un env de test isolé (PR / branche / local) », paramétrée **Cible × Recette**.
  Elle liste déjà les 4 rôles qui ont ce besoin : `ezk-pr run`, `ezk-preview` cas B, `ezk-sprint`
  étape 6, `verify`/`run`.

Les trois répondent au **même besoin** (« voir / tester tourner un travail en cours ») sous des
angles différents (navigateur / téléphone / env isolé) → recouvrement à consolider. Le refactoring
« map » et la restructuration scrum changent les règles → re-cadrer à leur lumière, avec l'architecte.

## Proposition (direction — à groomer)

Repenser device + preview + testbed comme **une seule brique cohérente**, probablement autour de
0102 `ezk-testbed` comme cœur (Cible × Recette), où :
- `ezk-preview` = la **surface « URL de démo »**,
- `ezk-device` = la **surface « téléphone physique (adb) »**,
- `ezk-testbed` = le **cœur** « démarrer l'env selon la recette de projet ».

À trancher au grooming (avec `ezk-architect`) :
- comment ça se pose dans la **nouvelle sémantique « map »** et la restructuration scrum ;
- une seule skill fusionnée, ou un cœur (testbed) + adaptateurs (preview / device) ;
- **débloquer 0102** (aujourd'hui `blocked`) ou le remplacer par ce sujet.

## Critères d'acceptation

- [ ] À définir au grooming (idea non actionnable en l'état).
- [ ] Gate locale verte (typecheck/lint/tests) puis E2E si UI. *(une fois groomée)*

## Comment vérifier

À définir au grooming avec l'architecte (idea — pas encore actionnable).

## Notes / décisions

- **Priorité P2 provisoire** — à confirmer par le PO au grooming (0102 est P1 ; ce re-cadrage
  post-refactoring est sans deadline).
- **Grooming = `ezk-architect`** (décision d'archi non triviale), selon la **nouvelle sémantique
  « map »** / restructuration scrum mega-city.
- **Foyer existant** : fiche [0102](0102-ezk-testbed-brique-boot-env-test.md) `ezk-testbed`
  (blocked) — probablement absorbée / re-cadrée par ce sujet.
- **Absorbe 2 fiches muti** (retirées du backlog muti, sujet rapatrié ici) :
  - `20260818205645915` — commande `pnpm preview <branche>` git-first (déparamétrer le prototype) ;
  - `20260818205647035` — convention PR git-first (corps de PR = comment se poser sur la branche en git pur).
  - **Prototype muti préservé** : branche `feat/preview-pr-mobile-wizard` sur `origin` du repo **muti**,
    fichier `scripts/preview-pr.mjs` (assistant « charger & essayer une PR », zéro-dépendance) —
    matière pour la surface/recette mobile. À rapatrier ici.
- Principe PO rappelé : **GitHub = projection / plugin optionnel, git = substrat** (preview /
  checkout git-first, `gh` en raccourci).
- **Faux ami** : `ezk-recipy` (0147) = scanner de repos froids, **pas** les « recettes de démarrage »
  du testbed — ne pas confondre.
