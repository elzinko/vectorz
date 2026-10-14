# Run v0.14.0 « les portiers robustes » — compte rendu

**En clair.** v0.14.0 est **livrée et taguée en local**, rien poussé. Sur ses 6 fiches, 5 sont
construites et livrées, 1 s'est avérée **déjà livrée** (superseded). Une **chasse aux bugs adverse**
a trouvé 4 vrais bugs avant le tag ; tous corrigés. Le tag `v0.14.0` est sur `main` local au commit
`6b64ed1f` ; il a débloqué v0.15.0. **Ce qu'il te reste à faire** : pousser l'étiquette quand tu veux
(`git push origin v0.14.0`) — c'est le seul geste laissé au PO.

## Le lot livré (flux local, github: false)

Chaque fiche a suivi : branche → code + test → revue → `ezk forge integrate` (squash local sur le
`main` du principal) → `ezk backlog ship … local (<sha>)`. Tout est sur `main` local, non poussé.

| Fiche | Sort | Squash | Ship |
|---|---|---|---|
| [le journal de sprint se range par branche, hors du worktree](../../features/done/20261004181110201_sprint-md-par-branche-hors-worktree.md) | livrée | `cd2711b8` | `ff7c1721` |
| [le portier distingue un worktree vivant d'un abandonné](../../features/done/20261010213746514_portier-ignore-worktree-sans-session-vivante.md) | **superseded** | — | `8954df04` |
| [lawgiver bind gère un `.git` fichier (worktree)](../../features/done/20261011111526693_lawgiver-bind-hooks-worktree-aware.md) | livrée | `3505dc23` | `967015ad` |
| [ezk-archive reprend proprement un run interrompu](../../features/done/20261002155911264_ezk-archive-reprise-run-interrompu.md) | livrée | `25b4f219` | `229a7f56` |
| [le portier ezk-archive juge contre origin/main](../../features/done/20261003201035168_portier-archive-fiches-et-adr-contre-origin-main.md) | livrée | `495eb9cb` | `f6a285f2` |
| [le ménage ezk-archive en mode auto (`--inventory`)](../../features/done/20261003105820099_menage-archive-lancable-mode-auto.md) | livrée | `dd86eb59` | `220218ac` |

**La fiche superseded.** Le portier distingue déjà un worktree vivant d'un abandonné : ce socle était
livré le 2026-10-05 (fiche « les portiers ignorent les copies de réserve propres », commit `f0a5b0a9`),
avant même le symptôme qui a motivé la fiche. La règle fail-safe qu'elle retenait (« branche non
fusionnée → ALERT ») est le comportement correct en place, testé (S4/S5 de `test-check-gate.sh`). Rien
à construire : marquée superseded pour ne pas dupliquer du livré. **Le grooming du 2026-10-13 avait raté
ce déjà-là** — à regarder avant de tamponner une fiche « prête ».

## La chasse aux bugs adverse (gate de release)

`ezk release v0.14.0` a d'abord rendu **NO-GO** : sa passe « chasse aux bugs adverse » exige un verdict
de relecteur indépendant. Trois relecteurs adverses (agents frais, pas l'auteur) ont relu le cœur du
delta. Ils ont trouvé **4 vrais bugs**, tous dans la résolution de la clé de journal par branche — du
code neuf de ce run. Tous corrigés (commit `6b64ed1f`) :

1. **HEAD détaché** — la clé `_detached/<sha>` bougeait à chaque commit → un sprint ouvert devenait
   introuvable à `close`. Corrigé : clé stable `_detached`.
2. **Sanitisation non injective** — `a+b` et `a-b` tombaient sur le même fichier, sans garde. Corrigé :
   garde d'appartenance (`journal_mismatch`) + test S23.
3. **`mv` de migration silencieux** — un échec abandonnait la reprise sans un mot. Corrigé : signal
   `SPRINT-MIGRATION-FAILED`.
4. **Résolution fragile de `archive-progress.sh`** — localisé via `$0` après un `cd` → une invocation
   relative ratait un run incomplet **en silence**. Corrigé : `BASH_SOURCE` avant le `cd`, garde durcie.

Puis `ezk release v0.14.0` → **GO**, et `ezk backlog version close v0.14.0 --tag` a posé le tag.

## Validation

- **Gate complète** (frontière de version) : `pnpm test` 2035/2035 · `pnpm test:scripts` 43 suites — tout vert.
- **Gate de release** : `dod-mecanique` GO · `chasse-aux-bugs` GO.
- Dette latente rattrapée en parallèle par une autre session (chip posé par ce run) : `tsc --noEmit`
  sur `plan-view-data.ts` (commit `ba83f290`).

## Rétro légère — 4 notes déposées

Au carnet de rétro (`<git-common-dir>/ezk/retro-notes/`), pour la prochaine cérémonie :

1. `forge integrate --dry-run` committe quand même le squash (le dry-run ne gate que l'élagage).
2. `backlog ship` ne persiste que si CWD = le dépôt cible, pas seulement `--root`.
3. Le rayon d'impact d'une fiche doit inclure `src/__tests__/` (2 tests TS cassés, rattrapés par la gate).
4. La chasse aux bugs de release a gagné sa place ; la clé de journal est dupliquée dans 3 fichiers
   (altitude : un résolveur partagé la corrigerait une fois).

## Et maintenant ?

- `git push origin v0.14.0` — publier l'étiquette (geste du PO).
- v0.15.0 « voir les runs » est débloquée et tirable — à construire **en session dédiée** (même consigne
  de build autonome), ou à piloter à la main.
