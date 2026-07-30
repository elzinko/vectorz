---
id: 0146
title: profils par hôte — cop1-target.yml et desktop.yml
type: feature
priority: P2
product: mega-city
status: shipped
pr: "#7"
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
- [x] `bind cop1-target <projet-cobaye> claude-code` : agents feuilles + ezk-pm présents, aucun orchestrateur — vérifié (5 agents dont ezk-pm, 8 skills feuilles, 0 orchestrateur).
- [~] dogfooding : un run cop1 voit les agents — **externe** (runtime cop1 + projet-cobaye, non exécutable dans ce repo). Le pass-through `settingSources:['project']` est en place côté matérialisation.
- [x] `bind desktop <projet>` : builder + ezk-pm présents, ezk-ci/ezk-apk/ezk-device absents — vérifié (agent ezk-pm, builder+backlog+diagram+ezk, 0 env).
- [x] `profiles/README.md` créé et documente les profils (base, mobile, global, cop1-target, desktop).
- [x] fiche 0003 statuée → **shipped (#6)** : le cap claude-desktop a été livré (pas juste satisfait par le bind global).

## Notes
ADR-0011 §2. Livré via #7. Garde anti-désync née ici : `src/__tests__/profiles-sync.test.ts`
(vérifie que chaque id référencé par un profil existe au catalogue, puisque `expand` ignore
silencieusement une réf pendante). AC dogfooding-cop1 laissé ouvert (externe) — à valider lors
d'un vrai run cop1 sur un projet bindé `cop1-target`.
