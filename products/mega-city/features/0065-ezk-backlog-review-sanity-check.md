---
id: 0065
title: ezk-backlog review — sanity check global du backlog (validité, doublons, ordre, staleness)
type: feature
priority: P1
status: todo
pr:
created: 2026-07-17
---

# 0065 — ezk-backlog review : le sanity check global du backlog

## Contexte / Problème

L'anti-doublon d'ezk-backlog ne joue qu'à l'`add` : rien ne re-contrôle le **stock**.
Un backlog qui vieillit accumule des fiches devenues fausses (code livré entre-temps,
ADR postérieur qui contredit), des doublons par accumulation, un ordre P0→P3 dont la
cohérence *relative* n'a jamais été revérifiée, et des `todo` fossiles jamais tirés.
Décision actée : **ADR-0016 §4** (rituel `review`, cadence avant sprint planning +
post-pivot).

## Proposition

Sous-commande `review` dans le playbook ezk-backlog — passe globale en 4 contrôles,
sortie = **rapport + propositions**, arbitrage PO obligatoire (jamais
d'auto-suppression) :

1. **Validité** fiche par fiche : encore vraie ? contredite par un ADR/du code livré ?
2. **Doublons / regroupements** par intention (même moteur que l'anti-doublon d'`add`).
3. **Cohérence de l'ordre** P0→P3 sur l'ensemble (l'ordre relatif, pas juste les buckets).
4. **Staleness** : vieux `todo` jamais tirés → proposer rétrogradation en `idea` ou clôture.

Mesure minimale embarquée dans le rapport (phase 1 Pareto, ADR-0016 §5, zéro
outillage — calculée depuis les front-matters) : fiches par statut, % de `todo`
ready, âge médian des `todo`, nb d'`idea` non groomées.

## Critères d'acceptation

- [ ] `review` produit un rapport structuré couvrant les 4 contrôles + les compteurs.
- [ ] Aucune modification de fiche sans validation PO explicite (propositions seulement).
- [ ] Cadence documentée dans le playbook : avant chaque sprint planning + après pivot
      structurant ; câblage à l'intake d'ezk-sprint / ezk-product-builder.
- [ ] Test de séparabilité : la connaissance du format de fiche reste dans ezk-backlog.

## Notes / décisions

- Origine : ADR-0016 (2026-07-17), douleur opérateur « reprendre le backlog en entier,
  contrôler ce qui est valide et ce qui ne l'est plus ».
- Compose avec 0056 (`groom`/`ready`) : `review` détecte, `groom` répare une fiche.
