---
id: 0085
title: Redéfinir ce que compte la quiescence — les sous-runs de l'orchestrateur, pas tout worktree git du dépôt
type: chore
priority: P0
epic:
status: todo
ready:
pr:
created: 2026-07-19
---

# 0085 — La quiescence compte la mauvaise population

## Contexte / Problème

Le signal « on peut monter de version sans risque » exige aujourd'hui **zéro worktree
additionnel dans le dépôt** (`git worktree list` → une seule entrée).

Or le dépôt vectorz du PO en compte **sept**, en usage normal et permanent : le PO
travaille en worktrees pour presque toutes ses sessions. **Le signal vaut donc `false` en
permanence chez lui.**

L'intention d'origine était différente. Les captures parlent de *« zéro worktree /
sous-run en vol »* et de *« une story = un worktree = un run »* : le modèle mental était
**un worktree = un sous-travail de l'orchestrateur, éphémère**, créé par l'outil. Le cas
« l'humain travaille en permanence en worktrees, y compris pour des tâches sans rapport »
**n'est discuté nulle part** — ni capture, ni ADR, ni fiche. Ce n'est donc pas un
arbitrage rendu contre cet usage : c'est **un cas jamais posé**. La spécification confond
deux populations disjointes : *les sous-runs de l'orchestrateur* et *les worktrees git*.

## Valeur

Un booléen constant porte **zéro information**. Deux issues, toutes deux mauvaises : soit
un consommateur en dépend et se retrouve bloqué en permanence ; soit les humains
apprennent à l'ignorer — et **un signal de sécurité qu'on a appris à ignorer est plus
nuisible qu'un signal absent, parce qu'il occupe la place**.

À corriger **avant le premier dogfooding** : sinon la première rencontre du PO avec sa
propre boîte noire sera un feu rouge permanent qu'il devra apprendre à ne pas regarder.

## Critères d'acceptation

- [ ] La quiescence est redéfinie sur la **population réellement visée** — les sous-runs
      de l'orchestrateur (dossier dédié), pas tout worktree git du dépôt. Périmètre exact
      à trancher au grooming.
- [ ] Sur le dépôt réel du PO (7 worktrees de travail, aucun sous-run en vol), le signal
      peut valoir **vrai** — vérifiable en le calculant sur place.
- [ ] Un sous-run réellement en vol le fait bien passer à **faux** (test).
- [ ] La définition retenue est écrite dans le code **et** dans la doc du kit, avec la
      raison — pour qu'on ne la redéfinisse pas par accident dans six mois.
- [ ] Le levier de veto reste intact (l'appelant peut toujours forcer à faux, jamais à
      vrai).

## Notes

- **Décision produit**, pas technique : c'est au PO de dire ce que « c'est un bon moment
  pour monter de version » doit signifier chez lui. Le grooming doit poser la question
  explicitement.
- Complète la fiche 0084 (cohérence d'échelle du calcul) : 0084 corrige *comment* on
  mesure, 0085 décide *quoi* on mesure.
- Réfs : `src/supervision/upgrade-ok.ts` ; captures des 2026-07-13 (décision sur
  l'éligibilité de mise à jour) et 2026-07-14 ; analyse
  `docs/captures/2026-07-19-topologie-supervision-et-plan-diagrammes.md`.
