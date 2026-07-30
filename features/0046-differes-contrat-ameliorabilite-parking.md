---
id: 0046
title: Différés du contrat d'améliorabilité — parking gated « après boucles réelles »
type: chore
priority: P3
product: vectorz
status: todo
pr:
created: 2026-07-16
---

# 0046 — Différés du contrat d'améliorabilité (parking)

## Contexte / Problème

Le MVP du contrat d'améliorabilité (fiches MVP A/B, ADR-030 proposé) est volontairement
frugal : deny-all, une greffe (rule de profil), un script d'append côté vectorz, un
miroir tenu par le mesureur. Plusieurs pièces utiles sont identifiées mais NE DOIVENT PAS
être fabriquées d'avance (YAGNI, doctrine des fiches 0029/0042) : chaque item ne s'ouvre
que sur douleur constatée en boucle réelle.

## Proposition

Fiche parking façon 0029/0042. Items, chacun avec son gate :

1. **Validateur replay complet** (jumeau de `journal-validator`, précédent done/0027) :
   rejoue `.improvement/*.jsonl` (les deux fichiers + le miroir), violations typées,
   fixtures. *Gate : après 3 cycles vécus (invariants figés sur du vécu). Son branchement
   CI = condition de passage v0.2 du contrat.*
2. **Double émission** : deuxième émetteur conforme (checkpoint ezk-product-builder,
   puis pilote natif 0038) — preuve exécutable de méthode-agnosticité. *Gate : critère
   de sortie à ajouter à la fiche 0038 à son tirage ; jamais une dépendance du MVP.*
3. **Métrologie tokens du budget méta (≤10 %)** : le seuil en tokens est invérifiable en
   session interactive (télémétrie absente-et-dite-absente) — il est requalifié en
   critère du mode pilote. *Gate : tirage de 0038 (stream SDK) ; d'ici là le budget méta
   vit en unités observables (≤1 proposition/cycle, time-box, taille de fiche).*
4. **FR59** — auto-approbation à échéance (48 h, veto signalé au digest du matin,
   synergie 0042 item 7). *Gate : ≥3 cycles verified au ledger + examen des signaux de
   santé de la porte humaine (taux de rejet PO, latence submitted→approved — leur ajout
   au mesureur est lui-même soumis à arbitrage, surface gelée métriques) + décision PO
   explicite après panel.*
5. **Policy d'autonomie par types** (`improvement-policy.yaml`, jumelle de la policy de
   siège 0028) : types auto-applicables en default-deny, `policy_ref` sur chaque décision
   auto, plafond par cycle, config invalide = fail-fast. *Gate : douleur constatée (PO
   sursollicité) + ≥3 cycles verified + panel.*
6. **Enforcement automatique** : amélioration adoptée → DoDCheck via Rules port (ADR-020).
   *Gate : ≥1 règle adoptée violée en pratique.*
7. **Consolidation périodique de la mémoire** : péremption des leçons non re-confirmées,
   compaction auditée de learnings.md. *Gate : learnings.md dépasse une taille gênante
   ou une leçon périmée cause une reprise.*

## Critères d'acceptation

- [ ] Chaque item porte son gate explicite et sa référence (ADR-030, 0028, 0038, 0040, 0042)
- [ ] Aucun item n'est implémenté par cette fiche (parking pur)
- [ ] Revue de la fiche à chaque clôture de cycle du contrat (grooming à l'usage)

## Notes / décisions

- Rien ici n'est décidé : chaque ouverture d'item est un arbitrage PO (après panel pour 4 et 5).
- La garde CI de chemins gelés (véhicule : fiche 0040) n'est PAS un item parking : c'est une option de scope MVP soumise à arbitrage PO immédiat (vs invariant surfaces en classe B + miroir).
- Si la clause de moisson est retirée (échec du MVP), cette fiche part en done/ avec note « caduque ».