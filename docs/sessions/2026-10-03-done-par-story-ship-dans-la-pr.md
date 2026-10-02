fiches: 20261002114435782

# Sprint 1 — La fiche d'une story arrive en done avec son merge (construire l'ADR-0049)
Statut: clos   Ouvert: 2026-10-02   Clos: 2026-10-02

## Lot  (1 ligne = 1 story = 1 PR ; [x] livrée · [~] reportée · [ ] ouverte)
- [x] 20261002114435782 — La fiche d'une story arrive en done avec son merge, quel que soit le canal (PR #333)

## Notes / décisions
- 2026-10-02 — Versions : V0.5 = le sprint au lot, V0.6 = amélioration mesurée (décision PO) → PR #320.
- 2026-10-02 — Trace de supervision : `run_start` refusé, un run d'hier (session « EZK product build run »,
  ezk-product-build@dbd21b88) n'a jamais été clos. Règle : ne pas s'y greffer, ne pas le clore à la place
  de l'humain → run construit SANS trace, question posée au PO en fin de run.
- 2026-10-02 — Sur « abandonne le run » du PO : ancien run clos `abandoned` (by seat), trace V0.5 ouverte
  (run 2026-10-02T12-15-22-105Z-61296d1d, version 736f84f5) ; heartbeat envoyé.
- 2026-10-02 — #320 mergée (`736f84f5`) : V0.5 = le sprint au lot, V0.6 = amélioration mesurée.
- 2026-10-02 — Point d'étape agent : fiche 1 construite (`plan:lot N` + `next --lot N`, 13 tests unitaires +
  1 bout-en-bout qui ouvre vraiment un sprint, critères 5/5) ; fiche 3 groomée, DoR GO `ezk-pm`, construite
  (`--lot N` défaut 1, checkpoint après `CLOSE: SEALED`, 6 cas de contrat, critères 6/6). Gates vertes.
  Revue unique des 2 patchs lancée ; agent relancé pour push + 2 PR (pas de merge). ~300k jetons à ce stade.
- 2026-10-02 — Fin de boucle (borne 2 atteinte) : #324 (fiche 1) et #325 (fiche 3, empilée) ouvertes, revue
  GO sans bloquant (P1 corrigé `96b7fcd8`), CI en cours, ~580k jetons (~240k/fiche > cible 200k).
  RUN-REPORT émis. Rétro d'itération due → présentée au PO (recommandation : la sauter, ficher le défaut).
- 2026-10-02 — Codex sur #325 (3 retours, tous fondés, auto-fix) : P2 liens + P2 guillemets corrigés à la
  source dans #324 (`627fa042`), repris dans #325 par fusion ; P1 per-epic (livraison avant `close`, sinon
  `close` refuse et la boucle se bloque) corrigé dans #325 (`3b4d6eed`). Suites complètes vertes, fils résolus.
- 2026-10-02 — Incident supervision : la session MASTER (« EZK product build run ») a clos MON run V0.5 par
  erreur en voulant clore le sien (déjà abandonné sur ordre PO). Cause : registre à place unique partagée,
  `run_finished` sans run_id → une session peut clore le run d'une autre. Travail intact. → fiche à créer.
- 2026-10-02 — Décisions PO : « merge #324 et #325, pas de rétro ». #324 mergée (`ccff3b64`), #325 mergée
  (`9cba9f4b`) après fusion locale verte avec main. Rétro SAUTÉE (décision PO). RUN-REPORT final : 2/2 mergées.
- 2026-10-02 — Rangement → PR #329 : fiches 1 et 3 livrées (ship:fiche), 2 fiches P2 créées (tête du plan +
  blocked ; run_finished sans run_id), fiche #321 « statuts des stories » en V0.5 + plan ⑥ (décisions PO).
  V0.5 : 2/4 livrées ; tête du plan = fiche #321 (idea, à groomer). Fiche artefacts en V0.5 mais hors plan.
- Hors périmètre signalé : `plan:head` ignore le drapeau `blocked:` (une fiche prête mais bloquée reste
  « tirable » alors que le lot l'écarte) → fiche à créer au rangement.
- 2026-10-02 — Délégation : un seul agent de sprint pour les 2 fiches (coût fixe ~85k/appel), brief v3
  (scratchpad), une seule revue ezk-reviewer pour les 2 patchs, aucun merge par l'agent (garde-fou).
- La fiche « Regrouper les artefacts de méthode hors de docs/ » est en V0.5 (choix de son autrice) mais
  hors du plan : ce run ne la construit pas.
- Override du portier (ALERT points=2) — PO 2026-10-02 : alerte P2 attendue (5 worktrees voisins = sessions actives, dont la session WIP-v0.5 en attente de cette story) ; le PO choisit continuer (2026-10-02)

- 2026-10-02 — Sprint 1 (fiche done par story) : SPRINT.md du run V0.5 trouvé ouvert dans ce worktree
  (session WIP partageait le dossier) → #324/#325 cochés (faits) puis `close` SEALED avant `start`.
- 2026-10-02 — Build : `ship-in-pr.sh` (check/add/undo) + garde `ship-merge.sh --remote` (exit 3) ;
  textes ezk-sprint/ezk-pr/ezk-backlog ; ADR-0049 Accepté. Revue GO, 3 P1 corrigés (`f8a18058`).
  PR #333 ; commit ship `86e47fe2` = dernier de la branche (dogfooding, preuve anti-triche).
  Garde prouvée sur la vraie PR : head shippé → merge construit ; head d'avant → refus.
  Merge HUMAIN attendu, puis rappel `git -C <principal> pull --ff-only`.
- 2026-10-02 — Codex 3 passes sur #333 : 3 retours fondés corrigés (`efe181f0`, `04eefcb2`), 1 décliné
  (garde liée à --branch, même constat que le P2 du reviewer ; vrai filet = check CI en Suite). Chaque
  NO-GO Codex : `undo` (revert) → correctif → `add` ; ship final `f2e280ba` = dernier commit. CI verte.
  Piège : la gate locale avait été rejouée sur test:scripts seul après un correctif → parse maison du
  front-matter passé en local, attrapé par la CI (règle fiche-read-via-loader). Rejouer LES DEUX suites.

## Galères & gestes (labo)

## Incréments scellés de la session
- Sprint 0 — sans objectif — 2 livrées, 0 reportée : 20260930194219046 (PR #324), 20260930194219068 (PR #325)
- Sprint 1 — La fiche d'une story arrive en done avec son merge (construire l'ADR-0049) — 1 livrée, 0 reportée : 20261002114435782 (PR #333)
