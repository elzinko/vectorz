---
id: "20260813170548417"
title: Supprimer le dossier tombstone products/mega-city/features/ + sevrer portfolio.sh (reliquat de 0064)
type: chore
priority: P3
product: mega-city
epic:
status: shipped
ready: 2026-08-13
pr: "#147"
created: 2026-08-13
---

# 20260813170548417 — Supprimer le tombstone `products/mega-city/features/` + sevrer `portfolio.sh`

## Contexte / Problème

La fiche [0064](done/0064-liste-unique-features-champ-product.md) (✅ shippée, PR #66) a
unifié les deux backlogs en une seule liste `features/` à la racine, avec un champ
`product:`. Son critère de fin gardait volontairement `products/mega-city/features/`
comme **tombstone** : dossier vidé + `README.md` stub qui redirige + `done/.gitkeep`.

Ce tombstone a fait son office (rediriger quiconque cherchait les fiches à l'ancien
endroit), mais il laisse le repo dans un état **à moitié assumé** :

1. `products/mega-city/bin/portfolio.sh` **exige** encore le dossier (`[ -d
   products/mega-city/features ] || exit 1`, l.13) et itère dessus (l.50-53) — boucle
   **morte** depuis 0064 (zéro fiche à lire là).
2. `portfolio.sh` (l.2, 4, 74-79) et le `PORTFOLIO.md` qu'il génère décrivent encore
   « **deux backlogs séparés** (ADR-0017 A13) » — texte **périmé** : 0064 (ADR-0017 A14)
   les a unifiés. Le produit vient déjà du front-matter `product:`, pas du dossier.
3. `products/mega-city/skills/ezk-start/scripts/check.sh` (l.118-120) scanne le dossier
   pour les fiches `in-progress` — sous garde `[[ -d … ]]`, donc inoffensif, mais mort.

Décision PO (2026-08-13) : pousser le nettoyage jusqu'au bout plutôt que garder le
tombstone (option « supprimer + adapter les scripts »).

## Proposition

1. **Supprimer** `products/mega-city/features/` (README stub + `done/.gitkeep`).
2. **Sevrer `portfolio.sh`** de ce dossier : retirer la garde `exit 1` (l.13) et la
   boucle morte (l.50-53) ; corriger les libellés « deux backlogs séparés » →
   « liste unique `features/`, groupée par `product:` (0064) ». Le script garde sa
   valeur : vue de lecture transverse triée/comptée par produit.
3. **Nettoyer** le bloc mort de `ezk-start/scripts/check.sh` (l.118-120).
4. **Régénérer** `PORTFOLIO.md` via le script sevré (vérifie qu'il tourne sans le dossier).

Hors périmètre (assumé) : les mentions du chemin dans des **documents historiques** (ADR
0017/0021, fiches `done/` 0048/0064/0097, scripts one-shot `migrate-0064`/`fix-0064`, le
commentaire d'exemple d'`ezk-archive/check.sh`) — on ne réécrit pas l'histoire.

## Critères d'acceptation

- [x] `products/mega-city/features/` n'existe plus (dossier + README stub + `done/` supprimés).
- [x] `portfolio.sh` tourne sans erreur **sans** ce dossier et régénère `PORTFOLIO.md` (exit 0).
- [x] Le `PORTFOLIO.md` régénéré ne décrit plus « deux backlogs séparés » (seules occurrences
      du chemin = le titre de cette fiche) ; les compteurs par produit sont inchangés.
- [x] Plus aucune **dépendance vivante** (garde/scan/itération) au dossier dans les scripts
      (`portfolio.sh`, `ezk-start/check.sh`) — restent 2 commentaires historiques, hors scope.
- [x] Gate locale verte : `bash -n` OK ; `test:scripts` 8 suites vertes ; `check-links` sans
      lien cassé vers le dossier supprimé ni introduit par la fiche.

## Notes / décisions

- Suite directe de **0064** — pas un doublon : 0064 est shippée et gardait le tombstone à
  dessein ; ici on retire le reliquat une fois son rôle de redirection terminé.
- Priorité **P3** proposée (hygiène / dette cosmétique, aucun impact fonctionnel : le
  dossier vide ne gêne aucun run). À réajuster par le PO si besoin.
- Fiche tirée **immédiatement** en soupape PO (décision explicite du 2026-08-13) — DoR
  triviale (problème/valeur/critères évidents), `ready:` posé le jour même.
- Défaut **pré-existant, hors scope** noté au passage : `portfolio.sh` ne compte que
  `vectorz`/`mega-city` (l.131), les fiches `product: cop1` apparaissent dans les tables
  mais pas dans les compteurs. À traiter dans une fiche dédiée si le PO le veut.
