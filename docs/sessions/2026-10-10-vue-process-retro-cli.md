fiches: 20261002115451315,20261010100030780

# Session 2026-10-10 — Vue process, rétro, et capture du brainstorm CLI

**En clair.** Cette session a livré deux fiches (la vue process du tableau de bord, le fix 404
cross-projet du cockpit), déroulé une rétro complète qui a posé 4 règles neuves et 7 fiches, et
capturé une direction PO (brainstorm du DSL de la CLI) passée à une autre session. Tout est sur le
`main` local (mode `github: false`, rien poussé).

## Livré (sprint « vue process », scellé `CLOSE: SEALED`)

- **[Voir les fiches sur le process](../../features/done/20261002115451315_fiches-sur-le-process-avec-session.md)** (`20261002115451315`) — vue du tableau de bord : chaque fiche active posée sur une des 5 étapes (idée, prête, en sprint, en revue, livrée), déduites du statut + branches `feat/*` + PR ouvertes + sessions. Aucun objet « sprint » (ADR-0069). Version + filtres (recherche/version/milestone/priorité) ajoutés en cours de sprint (demande PO). Module pur `src/core/process-data.ts`, collecteur extrait `src/io/sessions-collect.ts`.
- **[Le cockpit ouvre le détail d'une fiche du projet choisi](../../features/done/20261010100030780_cockpit-sert-detail-fiches-projet-choisi.md)** (`20261010100030780`) — fin des 404 cross-projet : `resolveFichePath` (`src/core/cockpit.ts`), `ezk-map` sert `features/` depuis la racine du projet choisi. Le board en profite aussi.
- Squash local `bc8a0316` + ship `37129813`. 2 revues adverses `ezk-reviewer` **GO**, 6 P1 corrigés avant merge.

## Décisions

- **ADR-0069** (`products/mega-city/docs/adr/`) : l'étape de process se calcule par **jointure**, sans objet « sprint » persistant (le panel du 2026-08-23 tient).
- **Rétro du 2026-10-10 rangée** (capture `docs/captures/2026-10-10-retro-vue-process-worktree-silences.md`, mergée `74d4d613`) : 4 règles neuves (loi 60→64 : `clean-code/no-silent-mutation`, `testing/capped-list-filter-scenario`, `testing/confinement-contract-at-boundary`, `development/one-story-one-commit-local`), 5 fiches (worktree-reconcile P1, allocateur-id-ADR, registry-add-commentaires, cockpit-double-liste, action-grooming) + 2 fiches enrichies, 6 notes de carnet classées.
- **Brainstorm DSL de la CLI** capturé en fiche `20261010153046143` (idea), **passé à la session grooming** (« Auto mode et points de jonction ») sur décision PO — à traiter là-bas, pas en sprint.

## Faits notables appris

- **Deux dossiers d'ADR** : `docs/adr/` (`ADR-0NN`, max 038) et `products/mega-city/docs/adr/` (`00NN`, max 0069). Le « prochain évident » d'un seul dossier entre en collision ; `check-adr-ids.sh . --next` donne le vrai (0069).
- **Worktree ↔ principal** : en mode local, le ship/merge se fait sur le `main` du principal (`git -C`, `ezk --root`) et le worktree reste en retard ; remède appliqué deux fois : `git reset --hard main` du worktree (sûr, tout est absorbé). Le hook bloque l'édition du checkout de base depuis le worktree → `perl` côté principal pour barrer `PLAN.md`.
- **main point chaud** : la session grooming a mergé v0.10/v0.11 par-dessus mon ship pendant la rétro ; sa branche `claude/ezk-grooming-sessions-dd9b52` reste vivante (ne pas y toucher).

## Galères & gestes (labo)

- Numéro d'ADR : DEUX dossiers (docs/adr/ racine en ADR-0NN jusqu'à 038, products/mega-city/docs/adr/ en 00NN jusqu'à 0065). Prochain libre DES DEUX = check-adr-ids.sh . --next → 0069. Consigné aussi au journal.
