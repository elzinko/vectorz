fiches: 20261002133125444,20261003201035260,20261002115451315,20261005100027029,20261008072305169,20261008072306360

# Session 2026-10-08 — V0.7 socle (2 bugs) + grooming des têtes P1

**En clair.** Sprint V0.7 « socle » joué et scellé : deux bugs de confiance livrés en local sur
`main`. Puis grooming des deux têtes P1 de l'interface : l'une passée prête, l'autre découpée en
deux. Enfin un peu de ménage de méthode. Tout est committé sur `main`, les deux gates sont vertes.

## Livré (sprint, local sur `main`)

- **Fermer un run de supervision peut fermer celui d'une autre session** (`20261002133125444`) —
  `run_finished` exige désormais son `run_id` ; un id absent ou étranger est refusé sans rien
  fermer, et le refus nomme le run ouvert + son âge + sa méthode. Garde dans `runtime.ts`, 4 skills
  émetteurs mis à jour. Fix `29ee1834` + ship `34e919c0`. Revue `ezk-reviewer` GO.
- **Les récits de session reviennent sur main** (`20261003201035260`) — fiche d'enquête : le trou
  (30 août → 3 octobre, 0 récit committé) était réel mais **déjà corrigé par ADR-0063**
  (`archive-commit.sh`). La fiche mesure et constate, zéro code neuf. `274d25b4` + ship `52696317`.

Sprint scellé : `CLOSE: SEALED`, 2 livrées, 0 reportée. Run de supervision ouvert et fermé avec
son `run_id` (dogfooding du correctif de la story 1).

## Groomé / décidé

- **Voir les fiches posées sur le process** (`20261002115451315`) → **ready**. Dépendance à l'ADR
  de la page hôte constatée **levée** (ADR-0062 accepté, cockpit livré). Conception d'archi : module
  pur `src/core/process-data.ts` qui joint fiches ↔ sessions par branche, réutilise le collecteur de
  `ezk-sessions`, `openPrByBranch` nullable de première classe.
- **Compte rendu de sprint** (`20261005100027029`) → **découpé** en deux (ADR-0068) : A
  (`20261008072305169`, « close écrit+committe », **ready**, keystone) + B (`20261008072306360`,
  « rétro+archive lisent », idée, dépend de A). Conception : étendre `sprint:report` (extracteur),
  généraliser `archive-commit.sh` en helper de commit partagé, périmètre = lot scellé + fenêtre de
  supervision (jamais `## Incréments scellés`).

## Ménage de méthode

- Retrait du jargon « NOW/NEXT » du skill `ezk-backlog` : le parseur de `PLAN.md` accepte des
  intitulés libres, le skill le dit maintenant.
- Suppression de `MIGRATION-0064-remap.json` (migration terminée, lu par aucun script).
- Réparation de 2 liens morts dans le benchmark BMAD (tâche de fond).

## Prochain pas

Lot V0.7 possible : la vue process (`20261002115451315`) + la fille A (`20261008072305169`), deux
fiches prêtes. B dépend de A.

## Galères & gestes (labo)

- **Copier un fichier du worktree vers `main` peut écraser une donnée qu'un script venait d'y
  poser.** Symptôme : la fille A du split avait perdu son `split_from` — en re-copiant la fiche à
  l'étape `ready`, j'ai recouvert la version qu'`apply split` avait enrichie. Attrapé par
  `check-fiches --strict` (provenance non réciproque). Fix : rétablir `split_from` (`14a45eb2`).
  Pourquoi : le va-et-vient worktree→principal traite le worktree comme la source, alors qu'un
  script a pu écrire côté principal entre-temps.
- **Lancer les tests dans un worktree en retard sur `main` donne de faux rouges.** Symptôme :
  `test-links-repo` puis `check-fiches` rouges sur des états déjà corrigés sur `main`. Geste :
  `git reset --hard main` dans le worktree avant de valider (tout le travail était déjà sur `main`).
