---
id: 0084
title: Le calcul de quiescence mélange deux échelles (propreté par dossier, worktrees par dépôt) — prédicat sans sémantique
type: bug
priority: P0
epic:
status: todo
ready: 2026-07-25
pr:
created: 2026-07-19
---

# 0084 — `computeUpgradeOk` conjoint deux mesures d'échelles différentes

## Contexte / Problème

`src/supervision/upgrade-ok.ts` calcule le signal « on peut monter de version sans
risque » comme la conjonction de deux prédicats — **qui ne mesurent pas la même chose,
ni à la même échelle** :

| Moitié | Ce qu'elle mesure réellement | Échelle |
|---|---|---|
| `isTreeClean()` | `git status --porcelain -- . ':!.supervision'`, avec `cwd = projectRoot`. Le pathspec `-- .` **limite au sous-arbre du dossier courant** | **par dossier** |
| `hasNoAdditionalWorktree()` | `git worktree list` puis `entries.length === 1` — la commande renvoie **tous** les worktrees du dépôt, quelle que soit la position d'appel | **par dépôt** |

Un prédicat qui conjoint une mesure « par dossier » et une mesure « par dépôt » **n'a pas
de sémantique définissable** : selon l'endroit d'où on l'appelle, sa première moitié
change de portée pendant que la seconde reste constante.

*(Constaté lors de l'analyse du 2026-07-19 ; distinct de la question produit « que
doit-on compter comme quiescence », traitée par la fiche 0085 — celle-ci est un défaut de
code qu'il faut corriger **quelle que soit** la décision produit.)*

## Valeur

Ce prédicat est le **verrou de sécurité** qui autorise ou refuse une montée de version.
Un verrou dont la sémantique dépend du répertoire d'appel n'est pas un verrou : il est
soit trop permissif, soit trop strict, sans qu'on puisse dire lequel. Le corriger est le
préalable à toute discussion sur *ce qu'il doit mesurer*.

## Critères d'acceptation

- [x] Les deux moitiés du calcul mesurent à la **même échelle**, explicitement documentée
      dans le code (par dépôt, ou par arbre de travail — mais une seule, choisie).
- [x] Un test couvre le cas qui échoue aujourd'hui : appeler le calcul **depuis un
      sous-dossier** et **depuis la racine** donne le même verdict à état git égal.
      *(Réinterprété à l'audit, cf. section ci-dessous : l'échelle choisie étant « le
      sous-arbre de la racine fournie », le test d'échelle prouve que chaque appel est
      cohérent — aveugle au-dessus, voyant dessous, pour les DEUX moitiés — et non que
      deux racines différentes rendent le même verdict, ce qui relèverait de l'échelle
      « par dépôt » non retenue.)*
- [x] Le commentaire d'en-tête du module dit ce que le prédicat mesure, sans ambiguïté.
- [x] Aucune régression sur les cas déjà couverts (arbre propre → vrai, veto → faux,
      forçage à vrai impossible par construction).

## Audit d'absorption — 2026-07-25 (mandaté par le PO au checkpoint product-builder)

Le bug a été **structurellement résorbé** par le couple 0086 (#46) + 0085 (#47), et cette
fiche se clôt par le **verrou** qui l'empêche de revenir :

- La moitié « worktrees **par dépôt** » (`git worktree list`, insensible à la racine) a
  **disparu** avec la redéfinition 0085 : remplacée par la lecture de
  `<racine>/.cop1/worktrees/`, relative à la racine comme l'autre moitié.
- Échelle unique choisie et documentée : **le sous-arbre de la racine fournie** — en
  pratique l'arbre principal du projet, la racine étant normalisée (ADR-0019).
- Preuve par test (« 0084 — les deux moitiés mesurent la MÊME échelle ») : à état git
  égal, saleté et sous-run situés AU-DESSUS de la racine fournie sont invisibles aux
  deux moitiés, et un sous-run SOUS la racine est vu — plus aucun mélange d'échelles
  possible sans casser ce test.

## Notes

- **Ne présume pas** de la décision de la fiche 0085 : celle-ci corrige la cohérence
  d'échelle, celle-là décide *ce qu'on compte*. Les deux sont P0 et se complètent.
- Réfs : `src/supervision/upgrade-ok.ts` ; `src/supervision/__tests__/upgrade-ok.test.ts` ;
  analyse `docs/captures/2026-07-19-topologie-supervision-et-plan-diagrammes.md`.
