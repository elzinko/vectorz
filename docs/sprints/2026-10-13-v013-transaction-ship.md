# Compte rendu — v0.13.0 « la transaction ship, d'un bloc »

- Date : 2026-10-13
- Run : autonome (`ezk-product-build`, mode auto, flux local `github: false`)
- Base : `main` local, dernier commit `769ade73` — **rien poussé sur origin, rien tagué**

## En clair

v0.13 **livre 7 fiches sur 8** en local. Chacune est construite, testée, revue en adverse, puis
mergée en squash local et rangée (`ezk backlog ship`). La 8e fiche est **différée** : elle demande
une décision de conception (un panel avec le PO). Le gate qualité de version est **GO**, mais le
**tag reste à poser par le PO** (le classifieur du mode auto refuse de taguer tout seul).

## Livré (7 fiches)

| Fiche | Ce qu'elle apporte |
|---|---|
| [20261010114132970](../../features/done/20261010114132970_reconcilier-worktree-apres-ship-local.md) | `ezk run reconcile` : réaligne le worktree sur `main` après un ship, ou dit le retard |
| [20261002231845120](../../features/done/20261002231845120_backlog-md-sans-conflit-entre-pr.md) | `BACKLOG.md` sort de git (ADR-0075) — fini les conflits d'index ; check-links saute les vues générées |
| [20261004211037977](../../features/done/20261004211037977_ship-dit-ce-qu-il-touche-et-lit-l-id-de-tete.md) | `ship` liste tous les fichiers touchés (+ ligne `git add`) et ne lit que l'id de tête du plan |
| [20261002230039650](../../features/done/20261002230039650_ship-pose-une-fois-apres-codex.md) | le ship est posé une seule fois, après la 1re passe Codex (prose, amende ADR-0049) |
| [20261002205428200](../../features/done/20261002205428200_garde-ship-branche-reelle-de-la-pr.md) | la garde de ship lit la vraie branche de la PR, pas l'argument `--branch` |
| [20261013131632277](../../features/done/20261013131632277_tete-plan-respecte-drapeau-bloquee.md) | `plan:head` respecte le drapeau `blocked:` comme `plan:lot` |
| [20261013131632484](../../features/done/20261013131632484_raisons-typees-pour-blocked.md) | raisons typées pour `blocked:` (liste fermée, 10 fiches migrées) |

## Différé (1 fiche) — décision pour le PO

[20261004083345055 — Une PR ne range que sa fiche ; ship après la fusion](../../features/20261004083345055_pr-range-sa-fiche-seule.md).
Marquée `blocked: attend-panel`. Elle **renverse les fiches 4 et 5 ci-dessus** (ship *dans* la PR) et
**révise l'ADR-0049 §2**. C'est une décision structurelle à trancher en panel. Le flux local applique
déjà son modèle (ship après la fusion), donc rien ne presse fonctionnellement.

## Comment vérifier

```bash
cd products/mega-city && pnpm test && pnpm test:scripts   # 171 fichiers vitest / 2026 tests, 42 suites bash — tout vert
ezk release v0.13.0 --root "$(git rev-parse --show-toplevel)"   # GO (DoD mécanique + chasse aux bugs)
```

## Ce qu'il reste au PO

1. **Taguer v0.13 en local** : `ezk backlog version close v0.13.0 --tag` (geste PO ; le classifieur bloque l'agent).
2. **Trancher la fiche 6** en panel (ou la laisser différée).
3. Sans le tag v0.13, le garde-fou ADR-0070 garde le tirage dans v0.13 : **v0.14 n'est pas tirable** tant que v0.13 n'est pas taguée.

## Leçon

Le grooming a laissé passer une **contradiction intra-version** : les fiches 4/5 (« ship dans la PR »)
et la fiche 6 (« ship après la fusion ») s'opposent. Repérée au build, pas au grooming. Un contrôle
« deux fiches d'une même version n'amendent pas le même ADR en sens opposé » l'aurait attrapée.
