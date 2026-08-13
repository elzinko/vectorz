---
id: "20260813200137369"
title: Product-builder — auto-groom vers la DoR + option --check-ready (révise ADR-0016 A5)
type: feature
priority: P1
product: mega-city
epic:
status: todo
ready:
pr:
created: 2026-08-13
---

# 20260813200137369 — Product-builder autonome sur la DoR (`--check-ready`)

## Contexte / Problème

En `--checkpoints auto`, `ezk-product-builder` **calait immédiatement** dès qu'aucune fiche
n'était `ready` : l'invariant A5 d'[ADR-0016](../products/mega-city/docs/adr/0016-rituels-scrum-cycle-de-vie-backlog.md)
imposait un **STOP humain** systématique pour tamponner le gate (« jamais auto-tamponné »).
Résultat : sur un backlog où rien n'est ready (cas courant), la méthode n'avançait pas.
Le PO donne les **grands axes** d'une fiche et veut que la méthode soit **opérationnelle
ensuite** — pas qu'elle s'arrête à chaque fiche non encore rédigée `ready`.

## Proposition (décidée — [ADR-0028](../products/mega-city/docs/adr/0028-product-builder-auto-groom-ready.md))

Reframe : le gate humain mêlait **(a) DoR complète** [mécanique, délégable] et **(b) ça vaut
le coup** [humain]. `--check-ready false` = le PO a déjà tranché (b) en sélectionnant le lot →
la machine ne fait plus que (a).

1. **Auto-groom vers la DoR** : le builder groome la fiche de tête en composant
   `product-brainstorming` (dériver problème/valeur/critères des grands axes), `ezk-architect`
   (structure **et faisabilité en lecture seule** — pas `ezk-tdd` avant le gate),
   `ezk-pm` (arbitrage PO du périmètre).
2. **Option `--check-ready true|false`** : `true` (défaut) = STOP humain pour tamponner (A5
   préservé) ; `false` = auto-tampon **sur concurrence indépendante d'`ezk-pm`** (jamais solo).
3. **Plancher outcome-testable** : pas de critère vérifiable dérivable → **skip + journal +
   surface**, jamais d'invention de direction produit.
4. **Blocage réel → skip** (dépendance inaccessible, conflit stratégique, décision humaine) ;
   tout skippe → STOP humain. Les 4 STOP humains restent absolus.

## Critères d'acceptation

- [x] ADR-0028 rédigé (Accepté) ; ADR-0016 porte la note de révision d'A5
- [x] `SKILL.md` : `argument-hint` + usage + section `--check-ready` + section « Auto-groom vers la DoR » + plancher + skip
- [x] Table du mode `auto` et du mode `ask` mises à jour (auto-groom, skip, --check-ready)
- [ ] Liens markdown valides (`check-links`)
- [ ] Revue de cohérence (steward/reviewer) : le skill reste des instructions cohérentes et déclenchables

## Notes / décisions

- Véhicule = **SKILL.md** (le comportement) + **ADR-0028** (la décision) + cette fiche (backlog).
  Pas de nouvelle règle/rule séparée : la doctrine vit dans le skill, l'invariant dans l'ADR.
- Risque résiduel : la qualité de jugement d'`ezk-pm` (auto-tampon) et du grooming délégué —
  borné par le **plancher testable**. À durcir si des builds auto-readyés sortent hors-cible.
