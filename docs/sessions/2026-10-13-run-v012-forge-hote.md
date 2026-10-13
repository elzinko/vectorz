fiches: 20261013073300242,20261013073300256,20261013074251752,20261013074251767,20261004083838687,20261002230039863

# Session 2026-10-13 — Run autonome v0.12 (commandes hôte `--root`, guichet forge, trace de supervision)

**En clair.** Run autonome `ezk-product-build run --mode auto` : les **6 fiches restantes de v0.12**
ont été construites, revues (GO) et livrées sur `main` en local, puis v0.12 a été **taguée `v0.12.0`
et poussée** (go PO). Une rétro d'itération a rangé 5 fiches de suivi. Tout est sur `origin/main`
(`d9a5849a`), rien ne traîne côté session.

## Ce qui a été livré (6 sprints)

- **20261013073300242** — les commandes `ezk` de **lecture** visent le projet hôte (`--root`) :
  `board check`, `run context`, `run report` ; `docs check-links` refuse en nommant le projet.
- **20261013073300256** — idem côté **écriture** : `backlog apply`/`aggregate`, `evidence`, `sprint report`.
- **20261013074251752** — guichet **`ezk forge changes`** : trois états `ok`/`off`/`unavailable` (ADR-0061).
- **20261013074251767** — `ezk-archive`/`reconcile` passent par le guichet + **cliquet** anti-régression `gh pr list`.
- **20261004083838687** — **`ezk forge integrate`** : intégration au choix (`local-squash` ou `push-ff`).
- **20261002230039863** — `sprint:report` retrouve sa trace de supervision (racine `.mcp.json` + id de run).

## Comptes rendus de sprint de cette session

Détails (lot scellé, décisions, galères) dans les comptes rendus committés — ne pas recopier ici :

- `docs/sprints/2026-10-13-sprint-commandes-ezk-de-lecture-visent-le-projet-hote-r.md`
- `docs/sprints/2026-10-13-sprint-commandes-ezk-d-ecriture-visent-le-bon-depot-hot.md`
- `docs/sprints/2026-10-13-sprint-guichet-ezk-forge-changes-ok-off-unavailable.md`
- `docs/sprints/2026-10-13-sprint-ezk-archive-et-reconcile-passent-par-le-guichet.md`
- `docs/sprints/2026-10-13-sprint-ezk-forge-integrate-push-ff-au-choix-du-projet.md`
- `docs/sprints/2026-10-13-sprint-sprint-report-retrouve-sa-trace-de-supervision-r.md`

## Faits durables (non dérivables du git)

- **v0.12 close + taguée + poussée** via `ezk release v0.12.0` (GO : DoD mécanique + chasse-aux-bugs,
  feu vert `.vectorz/release/v0.12.0.bughunt-go` écrit par l'agent-reviewer), puis `version close
  v0.12.0 --tag`, `git push origin main`, `git push origin v0.12.0`. origin/main = `d9a5849a`.
- **Fiche 242 a coûté ~400k jetons** : son critère #4 (ezk-sprint ne cite plus de chemin
  `products/mega-city/…`) exigeait des verbes d'écriture (`journal add`, `pr ship-in-pr`) — le
  périmètre de la fiche sœur. Élargissement de périmètre tranché par le PO en cours de run. Les 5
  autres fiches ~150-250k.
- **Rétro v0.12** (capture `docs/captures/2026-10-13-retro-run-v012.md`, 6/6 décisions) → fiches de
  suivi : helper install-copie `20261013131625101`, règle grooming critère-hors-périmètre
  `20261013131625202` (à groomer en règle), **ezk-retro mode light `20261013131625303`** (demande PO),
  `--root` uniforme `20261013143324404`, coût chemin daté sprint:report `20261013143324505`. P2
  ship-recals `20261013013553044` enrichie (5 occurrences).
- Les nouveaux verbes `ezk journal add` et `ezk pr ship-in-pr` exposent des scripts par-feature
  (sinon cités en chemins `products/mega-city/…`, cassés depuis un hôte).

## État de clôture

- `origin/main` = `d9a5849a` ; local synchro (ahead=0). v0.12 livrée, taguée, poussée.
- Reste côté branches : une branche RÉELLE d'une **autre session** (`claude/ezk-grooming-sessions-dd9b52`,
  grooming) — laissée intacte — et 15 branches absorbées sûres à ranger (`check.sh --cleanup`).
