fiches: 20261003105820077,20261004192802828,20261004192802897,20261004192802964,20261004181110120,20260904080827072,20261002205205417,20261003011750521

# Session du 2026-10-04 au 2026-10-05 — clôture de la V0.5 et cockpit de la V0.6

**En clair.** La session a livré la dernière fiche de la V0.5 puis l'a close (étiquette `v0.5`). Elle a
ensuite construit le cockpit de la V0.6, découpé en trois fiches, et corrigé `ezk`, qui croyait une
variable `INIT_CWD` périmée. Deux rétros légères ont été jouées et rangées. Tout est poussé sur
GitHub (`main` 5bf06faf).

> Snapshot du `SPRINT.md` de ce worktree, réduit à cette session. Le fichier portait aussi les notes
> et les incréments d'une session du 2026-10-02, hérités du dossier recyclé par l'app (le défaut que
> décrit la fiche 20261004181110201, « le journal de sprint se range par branche ») : ils sont déjà
> archivés dans `docs/sessions/2026-10-03-run-v0-5.md` et `docs/sessions/2026-10-03-done-par-story-ship-dans-la-pr.md`.

## Incréments scellés de la session

- Sprint 2 — La note de passation et le carnet de rétro survivent à la suppression d'un worktree — 1
  livrée, 0 reportée : 20261003105820077 (local 527868b7)
- Sprint 3 — Cockpit, socle : l'ADR, ezk config show lisible depuis un autre projet, un seul registre —
  1 livrée, 0 reportée : 20261004192802828 (local 43dcb587)
- Sprint 4 — Cockpit : le menu des projets et les fiches du projet choisi — 1 livrée, 0 reportée :
  20261004192802897 (local 7841c073)
- Sprint 5 — Cockpit : la page « config » du projet choisi — 1 livrée, 0 reportée : 20261004192802964
  (local ec7fc3ec)
- Sprint 6 — ezk ne croit plus un INIT_CWD laissé par un pnpm parent — 1 livrée, 0 reportée :
  20261004181110120 (local f62e0128)

## Notes / décisions

- 2026-10-04 — Run `--once` : la note de passation et le carnet de rétro passent sous
  `<git-common-dir>/ezk/`. Revue NO-GO (boucle sans fin de `note.sh`, reprise de l'ancienne note) puis
  GO. Le PO pousse `main` lui-même ; la V0.5 se clôt par `ezk backlog version close V0.5 --tag`.
- 2026-10-04 — Le PO demande de passer par la méthode ezk, pas par des commandes git brutes.
- 2026-10-04 — Rétro légère de fin de V0.5 (capture `docs/captures/2026-10-04-retro-iteration-v0-5-legere.md`) :
  2 fiches, la règle `development/host-project-proof-before-ship`, 2 ajouts de cas.
- 2026-10-04 — Run auto : cockpit découpé en 3 fiches (décision PO, coût d'un sprint). Portier : passer
  outre autorisé par le PO pour tout le run, voisins propres.
- 2026-10-04 — Socle du cockpit, arbitrages PO au build (contradiction avec l'état livré) : écriture de
  `config` via `--root` gardée (seule l'option explicite redirige) ; `registry-add` écrit dans le
  checkout courant et prévient depuis un worktree. ADR-0062 accepté.
- 2026-10-04 — Run arrêté par le PO devant la fiche des réglages d'agents (12 critères, estimée à
  500-700k) ; bilan rendu à la main, `ezk run report` refusant la livraison locale.
- 2026-10-04 — Bug INIT_CWD : le PO délègue le choix (« je te fais confiance mais sois-en sûr ») ; fuite
  reproduite, signal `npm_package_json` vérifié, option 2 livrée ; le portier passé outre pour toute la
  session (décision PO).
- 2026-10-04 — Rétro légère du run cockpit (capture `docs/captures/2026-10-04-retro-run-cockpit-v0-6-legere.md`) :
  2 fiches, la règle `token-economy/fiche-tient-dans-un-sprint`, portier en P1 au plan, fiche des
  réglages d'agents marquée « à découper ».
- 2026-10-05 — Le PO inscrit samplerz et muti au registre ; `registry-add` efface les commentaires,
  remis à la main avant le commit (5bf06faf). Deux notes déposées au carnet.

Coût approximatif de la session : environ 1,5 M de jetons (dont environ 0,75 M pour le run cockpit).
