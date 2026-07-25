---
id: 0085
title: Redéfinir ce que compte la quiescence — les sous-runs de l'orchestrateur, pas tout worktree git du dépôt
type: chore
priority: P0
epic:
status: shipped
ready: 2026-07-24
pr: "#47"
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

## Décision produit — grooming du 2026-07-24 (PO, checkpoint product-builder)

**Modèle de référence choisi par le PO : la mise à jour de Claude.** « Quand une session
tourne, on ne peut pas mettre à jour ; si pas d'activité en cours, on peut. » Traduction
dans le monde du kit :

- **Population comptée = les sous-runs du dossier dédié de l'orchestrateur** —
  concrètement les worktrees sous `.cop1/worktrees/` (source de vérité unique, ADR-019
  cop1) : l'« activité » que le kit peut VOIR, comme Claude ne compte que ses propres
  sessions. *(Correction du builder, journalisée : la première traduction « autres runs
  ouverts du journal » était quasi-vide de sens — l'invariant un-seul-run de `run_start`
  garantit que le run courant est le seul ouvert à une racine donnée, et le journal v0.1
  n'a aucune notion de vivacité. Le principe PO est inchangé ; seul le mécanisme de
  détection retenu est celui que l'AC n°1 nommait déjà : le dossier dédié.)*
- **Le reste de la topologie git sort du prédicat** (les 7 worktrees de travail du PO,
  sous `.claude/worktrees/` ou ailleurs, ne comptent plus) ; la moitié « arbre propre »
  reste (son échelle exacte = fiche 0084).
- **« On peut forcer, mais il faut indiquer ce que ça implique »** (PO) : le forçage est
  une prérogative du **siège humain en aval** — le signal ne ment jamais (D11 intact :
  veto → false seulement, jamais l'inverse). L'affichage des conséquences (quels runs en
  vol) relève du **flux d'adoption** → fiche 0050 (canal de release) ; le payload émis
  reste le booléen du contrat v0.1 (raison détaillée = extension v0.2, fiche 0029).
- **Question ouverte PO consignée** : « redémarrage de l'appli, mais laquelle ? »
  (serveur MCP ? méthode ? cop1 ?) — mécanique d'adoption D1/D2, routée fiche 0050.

## Notes

- **Décision produit**, pas technique : c'est au PO de dire ce que « c'est un bon moment
  pour monter de version » doit signifier chez lui. Le grooming doit poser la question
  explicitement. → **Posée et tranchée le 2026-07-24, cf. section ci-dessus.**
- Complète la fiche 0084 (cohérence d'échelle du calcul) : 0084 corrige *comment* on
  mesure, 0085 décide *quoi* on mesure.
- Réfs : `src/supervision/upgrade-ok.ts` ; captures des 2026-07-13 (décision sur
  l'éligibilité de mise à jour) et 2026-07-14 ; analyse
  `docs/captures/2026-07-19-topologie-supervision-et-plan-diagrammes.md`.
