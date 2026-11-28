# Gabarit — compte rendu de sprint (`ezk-sprint close`)

Ce gabarit fixe le **format** du compte rendu qu'`ezk-sprint close` écrit et committe sous
`docs/sprints/<date>-sprint-<slug>.md` (fiche 20261008072305169, [ADR-0068](../../../docs/adr/0068-compte-rendu-de-sprint-faits-rapport-commit-archive.md)).
Les **faits** viennent de l'extracteur `bin/sprint-report.ts` (durée, jetons, KPI, **lot scellé**) ; le
skill ne les recalcule pas, il les reçoit (frontière [ADR-0001](../../../docs/adr/0001-monorepo-composable-coeur-deterministe.md)).
C'est une instance de la règle **`readable-deliverable-trio`** :
**gabarit** (ce fichier) + **extracteur** (`sprint-report.ts`) + **rendu** (`renderSprintReportMarkdown`,
enrichi au besoin par le skill).

Le format fixe les sections ; il ne dispense pas d'écrire clairement dedans (règle
**`human-facing-lisibility`**).

---

## En clair

> **Mets** : 1 à 3 phrases simples — quel sprint, ce qu'il a livré, en combien de temps. Ce qu'un
> lecteur frais doit retenir **avant** tout chiffre.
> **Bannis** : le jargon interne en ouverture, les ids nus, un tableau avant cette phrase.

## En-tête

> **Mets** : trois lignes, écrites par `close` (jamais à la main) — **Numéro** : le numéro CONTINU du
> sprint depuis le début du projet (le nombre de comptes rendus déjà connus, plus un : décision du PO du
> 14 novembre, fiche 20261114131612204) ; **But** : le texte complet de `--objective`, sur une ligne ;
> **Branche** : la branche sur laquelle le sprint a été clos. Une ligne manque quand `close` ne la sait
> pas (but absent, tête détachée). Les mêmes valeurs sont dans le `.json` rangé à côté, sous `sprint`.
> **Bannis** : le compteur du journal de branche (`# Sprint N`, qui repart à 1 par branche) sous le nom
> « Numéro » ; une valeur devinée. Les comptes rendus d'avant n'ont pas cette section : leurs champs
> valent `null` à la lecture (`ezk sprint show`, `ezk board show`).

## Lot scellé

> **Mets** : une ligne par story du **lot de CE sprint** (section `## Lot` de `SPRINT.md`), avec son
> résultat rendu en toutes lettres — **livrée** (`[x]`), **reportée** (`[~]`), **restée ouverte** (`[ ]`,
> cas d'abandon). L'extracteur le sort ; le périmètre vient du lot scellé, **pas** de
> `## Incréments scellés de la session`.
> **Bannis** : recopier un autre sprint, mêler les incréments de session hérités.

## Détail

> **Mets** : les faits datés — fenêtre, durée, jetons (grain `sprint`/`session`), fiches livrées,
> blocages, retouches PR. Tels que l'extracteur les rend. Hors fenêtre de supervision : « non daté »
> assumé (jamais un faux zéro présenté comme vrai).
> **Bannis** : un chiffre inventé ou recopié à la main.

## Abandon (seulement si `close --abandon`)

> **Mets** : la raison de l'abandon, telle que journalisée au `close`. Un sprint abandonné laisse quand
> même son compte rendu.
> **Bannis** : cette section quand le sprint est scellé normalement.
