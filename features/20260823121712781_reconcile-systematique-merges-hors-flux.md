---
id: "20260823121712781"
title: "reconcile systématique — ne plus rater un ship après un squash-merge fait hors du flux (GitHub UI)"
type: feature
priority: P1
product: mega-city
status: todo
ready:
pr:
created: 2026-08-23
---

# reconcile systématique — le merge GitHub ne doit plus faire rater un ship

## En clair

Quand tu **squash-merges une PR depuis GitHub** (au lieu de passer par ezk), personne n'appelle `ship` :
la fiche reste `todo` alors que le code est sur `main`. La brique qui rattrape ça existe — c'est
**`reconcile`** — mais elle est **manuelle**, donc un merge fait à la main passe sous le radar. On veut la
rendre **systématique**.

## Contexte / Problème

- `ezk-backlog reconcile` croise déjà les **PR mergées** avec les **fiches** et **propose** les `ship`
  oubliés (ADR-0018). Mais il faut **penser à le lancer**.
- Symptôme daté (échange PO 2026-08-23) : « parfois je passe par mega-city et tout se fait ; parfois je
  squash-merge sur GitHub et ça perturbe le déroulé — on rate les `ship` ».
- Conséquence : le `status` d'une fiche (un **cache** de l'état *merged* de sa PR) décroche de la réalité.

## Proposition

- **Systématiser `reconcile`** à un point de passage qu'on ne saute pas :
  - à la **clôture de session** (gate `ezk-archive`), et/ou
  - en **rappel post-merge** (hook / petit job CI sur `main` qui liste les fiches dont la PR est mergée
    mais `status ≠ shipped`).
- Reste une **proposition** : `reconcile` détecte, **`ship` exécute après accord** (invariant préservé —
  jamais de bascule silencieuse).
- Dégrade sans erreur si pas de remote/`gh` (mode local-only, ADR-0018).

## Critères d'acceptation (à groomer)

- [ ] Un merge fait via **GitHub UI** (sans `ship`) est **détecté** sans lancement manuel.
- [ ] Le contrôle **propose** les `ship` manqués (ne bascule rien seul).
- [ ] Branché sur un point systématique (clôture de session **et/ou** post-merge).
- [ ] Silencieux/inoffensif quand il n'y a rien à réconcilier.

## Comment vérifier

Merger une PR depuis l'UI GitHub **sans** `ship`, puis atteindre le point de contrôle → la fiche
correspondante est **signalée à shipper**.

## Notes / voisins

- Voisins : [[0185]] (ezk-archive croise branches réelles ↔ PR ouvertes), [[20260812100109940]] (sync des
  vues de planning au `ship`), `ezk-backlog reconcile` (la brique composée).
- **Non ready** — à groomer (quel point d'ancrage : gate archive, hook, ou CI ?).
