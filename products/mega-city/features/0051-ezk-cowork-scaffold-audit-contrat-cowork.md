---
id: 0051
title: ezk-cowork — scaffold + audit du pattern « contrat cowork » (bootstrap mince / guide servi par l'app)
type: feature
priority: P2
status: idea
pr:
created: 2026-07-14
---

## Contexte / Problème

Le pattern « contrat cowork » (ADR-0015) est prouvé par deux apps (job-app, my-resume) :
bootstrap statique mince → guide dynamique servi par l'app (`/api/llm-guide`) → règles
d'or. Mais l'appliquer à une nouvelle app reste artisanal, et vérifier qu'une app
existante est **en synchro** (bootstrap ↔ guide ↔ subtree cowork-skills) a demandé une
session manuelle multi-étapes le 2026-07-14 (diff subtree, cohérence des références,
endpoints, launcher).

## Proposition

Skill `ezk-cowork`, deux sous-commandes :

- `scaffold` : installe le pattern dans une app — `cowork/<intent>.md` (bootstrap mince),
  endpoint guide servi par l'app (non-prod only), règles d'or, test e2e des concepts clés,
  règle « guide mis à jour dans la même PR » documentée dans le CLAUDE.md.
- `audit` : vérifie la synchro d'une app équipée — bootstraps = pointeurs minces (zéro
  logique de workflow), références valides (ports, launcher, endpoints), subtree skills
  aligné avec son repo distant (diff vide), nouveautés du guide autoportantes.

## Critères d'acceptation

- [ ] **Gate ADR-0013 d'abord** : ne fabriquer que si une 2e app pilotée par cowork se
      matérialise (samplerz ? muti ?) OU si l'audit de synchro devient un rituel récurrent
      (≥ 3 occurrences datées).
- [ ] `scaffold` produit une app conforme aux 3 étages de l'ADR-0015.
- [ ] `audit` rend un verdict à jour / divergent avec les points précis à corriger.
- [ ] Fabrication via `ezk-ezk create` (l'unique fabrique).

## Notes / décisions

- `status: idea` volontaire (capturé, pas groomé) — priorité **à fixer au grooming**
  (P2 = valeur par défaut du template, pas une décision).
- Ne PAS y remettre de logique de workflow applicatif : le volatil reste dans le guide
  de chaque app (c'est tout l'intérêt du pattern).
- L'« update de skill » générique (version bump, validate) reste hors périmètre :
  couvert par validate.sh + ezk-steward (ADR-0015 §3).
