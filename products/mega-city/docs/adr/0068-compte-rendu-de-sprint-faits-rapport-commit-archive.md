# ADR 0068 — Le compte rendu de sprint : faits par le rapport existant, commit par le mécanisme d'archive, périmètre par le lot scellé

**Statut :** Accepté
**Date :** 2026-10-08
**Fiches :** [A — `close` écrit et committe le compte rendu](../../../../features/20261008072305169_close-ecrit-et-committe-le-compte-rendu.md) · [B — la rétro et l'archive lisent les comptes rendus](../../../../features/20261008072306360_retro-et-archive-lisent-les-comptes-rendus.md) · source [20261005100027029](../../../../features/done/20261005100027029_compte-rendu-de-sprint-lu-par-la-retro.md)

## En clair

Un sprint et sa rétro peuvent se jouer dans des sessions différentes, des jours d'écart. Rien ne garde
de façon sûre ce qui s'est passé dans un sprint. On fait écrire à `ezk-sprint close` un compte rendu
court et committé. On ne crée **ni** nouvel extracteur **ni** nouveau mécanisme de commit : le rapport de
sprint déjà livré sort les faits, et le mécanisme de commit de l'archive de session (worktree jetable)
committe le fichier. Le périmètre « ce sprint seulement » vient du **lot que `close` scelle**, jamais du
`SPRINT.md` pollué.

## Contexte

- `SPRINT.md` n'est pas committé et mêle des sessions héritées quand l'app recycle le dossier de travail.
- L'archive de session recopie ce mélange.
- Le rapport de sprint (`sprint:report`, fiche 20260826082120062) est **livré**, écrit sous `docs/sprints/`,
  mais ne sort ni le lot ni les décisions, et n'est jamais lancé au `close`.
- La clôture de session committe déjà son archive via un **worktree jetable issu de `main`**
  (ADR-0063, `archive-commit.sh`).
- La fondation « chemins `scrum:` configurables » (20261001192624192) est planifiée en **V0.9**, après
  cette V0.7 : on ne l'attend pas.

## Décision

1. **L'extracteur de faits est `sprint:report`, étendu** — pas un nouveau script. Il émet en plus le
   **lot scellé** (ids + résultat `[x]`/`[~]`) dans son `.json`. Frontière ADR-0001 : le script sort les
   faits, le skill `ezk-sprint` rédige le compte rendu narratif sur un gabarit
   `skills/ezk-sprint/references/sprint-report-template.md` (nouvelle instance de la règle
   `readable-deliverable-trio`).
2. **Le périmètre « ce sprint » vient du lot que `close` scelle (section `## Lot`) + de la fenêtre de
   supervision `sprint-<slug>-checkpoint`** — jamais de `## Incréments scellés de la session` (zone
   accumulée, polluée par héritage).
3. **Le commit réutilise le mécanisme d'`archive-commit.sh`**, généralisé en helper partagé
   `commit-doc-via-worktree.sh` (worktree jetable depuis `main` ; mode local = squash-merge local,
   mode PR = branche `docs/sprint-report-*` + commande d'ouverture ; jamais poussé, jamais injecté dans
   la PR d'une story — cohérent avec ADR-0049).
4. **Lieu : `docs/sprints/` maintenant** ; la relocalisation `scrum:` (V0.9) passera par ce mécanisme.
5. **La fiche est découpée en deux** : producteur (A, le `close` écrit et committe) / consommateurs
   (B, la rétro et l'archive lisent). Liées par même jalon + `version: V0.7`, sans fiche-parapluie.

## Conséquences

- **+** Un seul extracteur, un seul mécanisme de commit : pas de doublon, inversion de dépendance
  respectée (deux skills dépendent d'un helper, pas l'un de l'autre).
- **+** Le récit du sprint survit aux sessions et au recyclage du dossier : il ne dépend plus de `SPRINT.md`.
- **+** Un sprint abandonné (`close --abandon`) laisse aussi un compte rendu, avec sa raison, même périmètre.
- **−** Généraliser `archive-commit.sh` touche un script livré sous ADR-0063 : à faire avec ses tests
  `test:scripts`, en gardant l'API d'`ezk-archive` intacte (helper paramétré, appelant mince).
- **−** Sans checkpoint de supervision, la fenêtre retombe sur `earliestRunStartedTs` : dégradation
  connue (voisine 20261002230039863, pas bloqueur).
