---
id: 0041
title: profils par hôte — cop1-target.yml et desktop.yml
type: feature
priority: P2
status: todo
pr:
created: 2026-07-06
---

## Contexte / Problème
Un seul profil `global` sert aujourd'hui tous les usages. Or les skills orchestratrices
(ezk-product-builder, ezk-sprint) CONCURRENCENT cop1 si elles sont bindées dans un projet
qu'il pilote (deux chefs dans la même session), et les skills à environnement d'exécution
(ezk-ci → act+Docker, ezk-apk → EAS) n'ont pas leur place dans une session Desktop pure.
Le Profile est précisément l'outil fait pour ça (keystone, ADR-0001).

## Proposition
- `profiles/cop1-target.yml` : bundles LOI (post-0006) + agents feuilles (architect, dev —
  aujourd'hui ezk-tdd, fiche 0045 —, qa, reviewer) + **ezk-pm** + skills feuilles (commits,
  ci, design-system, backlog…) — **sans** ezk-product-builder ni ezk-sprint (cop1 a sa
  propre boucle).
- `profiles/desktop.yml` : builder + backlog + ezk-pm + skills de rédaction/organisation —
  sans ci/apk/device. (Le cadrage/brainstorm n'est pas bindable : il arrive par composition
  externe de product-management:product-brainstorming, cf. ADR-0012.)
- Re-vérifier la fiche 0003 (cap claude-desktop) : possiblement déjà satisfaite par le bind
  global `~/.claude` depuis le switchover — la clore ou la re-scoper.

## Critères d'acceptation
- [ ] `bind cop1-target <projet-cobaye> claude-code` : agents feuilles + ezk-pm présents, aucun orchestrateur
- [ ] dogfooding : un run cop1 sur cop1-cobaye ainsi bindé voit les agents (pass-through `settingSources:['project']`)
- [ ] `bind desktop <projet>` : builder + ezk-pm présents, ezk-ci/ezk-apk/ezk-device absents
- [ ] `profiles/README.md` créé et documente les 3 profils (global, cop1-target, desktop)
- [ ] fiche 0003 statuée (close ou re-scopée)

## Notes
ADR-0011 §2. Le test de sync profil↔catalogue (audit 2026-07-05, « garde anti-désync »)
gagnerait à naître ici : 3 profils manuels = 3 occasions de désynchroniser.
